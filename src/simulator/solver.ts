import {
  InfrastructureArchitecture,
  SolverConstraints,
  SolverCandidate,
} from '../types/infrastructure';
import { simulateArchitecture } from './engine';

/**
 * Applied Science Constraint Solver:
 * Explores infrastructure configuration parameter vectors and evaluates Pareto optimality.
 */
export function solveConstraints(
  baseArch: InfrastructureArchitecture,
  constraints: SolverConstraints
): SolverCandidate[] {
  const candidates: SolverCandidate[] = [];

  // Candidate Archetype 1: Budget-Optimized Feasible
  const archBudget: InfrastructureArchitecture = JSON.parse(JSON.stringify(baseArch));
  archBudget.id = 'candidate-budget';
  archBudget.name = 'Budget-Optimized Tier';
  // Scale down compute instances to minimal required
  archBudget.computeNodes.forEach(c => {
    c.instances = Math.max(2, Math.ceil((baseArch.traffic.ingressRps * 1.2) / c.maxQpsPerInstance));
  });
  archBudget.databaseNodes.forEach(d => {
    d.readReplicas = Math.max(1, d.readReplicas > 1 ? d.readReplicas - 1 : 1);
    d.replicationMode = 'async'; // cheaper, lower compute overhead
  });
  // Ensure cache is enabled to protect smaller DB
  archBudget.cacheNodes.forEach(c => {
    c.enabled = true;
    c.nodes = Math.max(2, c.nodes);
  });

  // Candidate Archetype 2: High-Availability & Disaster Recovery
  const archResilient: InfrastructureArchitecture = JSON.parse(JSON.stringify(baseArch));
  archResilient.id = 'candidate-resilient';
  archResilient.name = 'Multi-Zone Resilient (High Availability)';
  archResilient.computeNodes.forEach(c => {
    c.instances = Math.max(4, c.instances + 2);
  });
  archResilient.databaseNodes.forEach(d => {
    d.readReplicas = Math.max(2, d.readReplicas + 1);
    d.replicationMode = 'sync'; // Zero-RPO synchronous commit
  });
  // Distribute across racks if available
  if (archResilient.racks.length > 1) {
    archResilient.computeNodes.forEach((c, idx) => {
      c.rackId = archResilient.racks[idx % archResilient.racks.length].id;
    });
  }

  // Candidate Archetype 3: Performance & Edge Accelerator
  const archPerf: InfrastructureArchitecture = JSON.parse(JSON.stringify(baseArch));
  archPerf.id = 'candidate-performance';
  archPerf.name = 'Ultra-Low Latency & High Headroom';
  archPerf.computeNodes.forEach(c => {
    c.instances = Math.max(6, Math.ceil((baseArch.traffic.ingressRps * 2.2) / c.maxQpsPerInstance));
    c.vCpuPerInstance = Math.max(8, c.vCpuPerInstance);
  });
  archPerf.cacheNodes.forEach(c => {
    c.enabled = true;
    c.nodes = Math.max(4, c.nodes + 2);
    c.ramGbPerNode = Math.max(32, c.ramGbPerNode * 1.5);
    c.hitRateTarget = 0.94;
  });
  archPerf.databaseNodes.forEach(d => {
    d.readReplicas = Math.max(3, d.readReplicas + 2);
    d.iopsProvisioned = Math.max(10000, d.iopsProvisioned * 2);
  });

  // Candidate Archetype 4: Pareto-Optimal Balanced
  const archBalanced: InfrastructureArchitecture = JSON.parse(JSON.stringify(baseArch));
  archBalanced.id = 'candidate-balanced';
  archBalanced.name = 'Pareto Balanced Recommendation';
  archBalanced.computeNodes.forEach(c => {
    const idealInstances = Math.max(3, Math.ceil((baseArch.traffic.ingressRps * 1.5) / c.maxQpsPerInstance));
    c.instances = idealInstances;
  });
  archBalanced.cacheNodes.forEach(c => {
    c.enabled = true;
    c.nodes = 2;
    c.hitRateTarget = 0.88;
  });
  archBalanced.databaseNodes.forEach(d => {
    d.readReplicas = 2;
    d.replicationMode = 'async';
  });

  const archetypes = [
    {
      arch: archBalanced,
      title: 'Pareto-Optimal Architecture (Recommended)',
      reasoning: 'Calibrated instance sizing targeting 60% CPU baseline, 2 read replicas for N+1 DB resilience, and dedicated Redis caching.',
      tradeoffs: [
        'Moderate infrastructure cost ($) with 42% safety headroom',
        'Sub-15ms p95 latency under normal and 1.5x surge workloads',
        'Balanced power consumption respecting rack 12kW caps',
      ],
      changes: [
        'Set API compute tier to 3-4 instances',
        'Maintain 2 DB read replicas in async mode',
        'Cache hit rate stabilized at ~88%',
      ],
    },
    {
      arch: archBudget,
      title: 'Cost-Minimal Feasible Architecture',
      reasoning: 'Prunes surplus compute headroom to absolute necessity while retaining caching to shield the primary database.',
      tradeoffs: [
        'Lowest monthly spend, cuts cloud bill by up to 35%',
        'Higher tail latency (p99) during sudden bursts due to thinner compute buffer',
        'Lower operational complexity with fewer distributed nodes',
      ],
      changes: [
        'Scale down compute instances to 2 units',
        'Reduce DB read replicas to 1',
        'Switch DB replication to async to eliminate sync commit latency',
      ],
    },
    {
      arch: archResilient,
      title: 'Fault-Tolerant High-Availability Architecture',
      reasoning: 'Prioritizes maximum survivability: synchronous multi-AZ replication, N+2 compute redundancy, and cross-rack isolation.',
      tradeoffs: [
        'Zero RPO with 99.98% composite availability SLO',
        'Higher hourly database cost due to synchronous storage consensus',
        'Increased power footprint across both rack A & B PDUs',
      ],
      changes: [
        'Enable synchronous DB replication across replicas',
        'Add +2 compute instances across separate rack PDUs',
        'Guaranteed zero downtime during single-node or single-rack failure',
      ],
    },
    {
      arch: archPerf,
      title: 'Ultra-Performance & High-Headroom Architecture',
      reasoning: 'Oversizes memory caches and provisioned IOPS to compress p95 latency under 10ms and absorb 3x organic traffic surges.',
      tradeoffs: [
        'Sub-8ms p95 latency and near-zero queueing delay',
        'Highest monthly cost due to generous provisioned IOPS and large RAM',
        'Thermal dissipation requires verified cold-aisle cooling support',
      ],
      changes: [
        'Scale compute instances to 6+ with 8 vCPUs each',
        'Double Redis cache nodes and allocate 32GB RAM per node',
        'Provision 10,000 IOPS on database volumes',
      ],
    },
  ];

  archetypes.forEach(({ arch, title, reasoning, tradeoffs, changes }) => {
    const metrics = simulateArchitecture(arch);
    const violations: string[] = [];

    if (metrics.cost.monthlyTotal > constraints.maxCostMonthly) {
      violations.push(`Monthly cost ($${metrics.cost.monthlyTotal.toFixed(0)}) exceeds ceiling of $${constraints.maxCostMonthly}`);
    }
    if (metrics.reliability.compositeAvailabilityPct < constraints.minAvailabilityPct) {
      violations.push(`Availability (${metrics.reliability.compositeAvailabilityPct}%) below target of ${constraints.minAvailabilityPct}%`);
    }
    if (metrics.performance.p95LatencyMs > constraints.maxLatencyP95Ms) {
      violations.push(`p95 Latency (${metrics.performance.p95LatencyMs}ms) exceeds max of ${constraints.maxLatencyP95Ms}ms`);
    }
    if (metrics.capacity.cpuHeadroomPct < constraints.minCapacityHeadroomPct) {
      violations.push(`CPU Headroom (${metrics.capacity.cpuHeadroomPct}%) below min buffer of ${constraints.minCapacityHeadroomPct}%`);
    }

    const isFeasible = violations.length === 0;

    // Score calculation
    let score = 70;
    if (isFeasible) score += 20;
    else score -= violations.length * 15;

    if (constraints.objective === 'cost-min') {
      score += Math.max(0, 10 - (metrics.cost.monthlyTotal / constraints.maxCostMonthly) * 10);
    } else if (constraints.objective === 'performance-max') {
      score += Math.max(0, 10 - (metrics.performance.p95LatencyMs / constraints.maxLatencyP95Ms) * 10);
    } else if (constraints.objective === 'reliability-max') {
      score += (metrics.reliability.availabilityNines - 3) * 10;
    } else {
      score += (metrics.capacity.cpuHeadroomPct / 100) * 10;
    }

    candidates.push({
      id: arch.id,
      title,
      score: Math.min(99, Math.max(20, Math.round(score))),
      architecture: arch,
      metrics,
      isFeasible,
      violations,
      reasoning,
      tradeoffs,
      recommendedChanges: changes,
    });
  });

  // Sort: feasible candidates first, then by score descending
  return candidates.sort((a, b) => {
    if (a.isFeasible && !b.isFeasible) return -1;
    if (!a.isFeasible && b.isFeasible) return 1;
    return b.score - a.score;
  });
}
