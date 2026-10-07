import {
  InfrastructureArchitecture,
  ChaosTriggerType,
  ChaosExperimentReport,
  ChaosStep,
} from '../types/infrastructure';
import { simulateArchitecture } from './engine';

export function runChaosExperiment(
  arch: InfrastructureArchitecture,
  triggerType: ChaosTriggerType,
  targetId?: string
): ChaosExperimentReport {
  const baseSim = simulateArchitecture(arch);
  const steps: ChaosStep[] = [];
  let survived = true;
  let sloBreached = false;
  let mttrObservedMin = 2.4;
  let targetName = 'System Component';
  let recoverySummary = '';
  const hardening: string[] = [];

  switch (triggerType) {
    case 'node-failure': {
      const targetNode = arch.computeNodes.find(n => n.id === targetId) || arch.computeNodes[0];
      targetName = targetNode ? `${targetNode.name} (Instance #1)` : 'Compute Node';

      const initialInstances = targetNode ? targetNode.instances : 2;
      const hasSurplus = initialInstances > 1;

      steps.push({
        timeOffsetSec: 0,
        headline: `SIGKILL injected into ${targetName}`,
        description: 'Process abruptly terminated. Health-check probes begin timing out.',
        affectedComponents: [targetName],
        severity: 'warning',
        metricsSnapshot: {
          rps: arch.traffic.ingressRps,
          p95LatencyMs: baseSim.performance.p95LatencyMs,
          cpuUtilizationPct: baseSim.capacity.cpuUtilizationPct,
          errorRatePct: 0.05,
          availabilityPct: 99.95,
        },
      });

      steps.push({
        timeOffsetSec: 5,
        headline: 'Load Balancer detects unresponsiveness',
        description: 'Active TCP connections drop. Traffic redistributed across remaining alive instances.',
        affectedComponents: ['Ingress Load Balancer', targetName],
        severity: hasSurplus ? 'warning' : 'critical',
        metricsSnapshot: {
          rps: arch.traffic.ingressRps * 0.98,
          p95LatencyMs: +(baseSim.performance.p95LatencyMs * (hasSurplus ? 1.4 : 3.8)).toFixed(1),
          cpuUtilizationPct: Math.min(100, +(baseSim.capacity.cpuUtilizationPct * (hasSurplus ? 1.5 : 2.4)).toFixed(1)),
          errorRatePct: hasSurplus ? 0.4 : 14.5,
          availabilityPct: hasSurplus ? 99.85 : 85.5,
        },
      });

      steps.push({
        timeOffsetSec: 30,
        headline: 'Orchestrator initiates container replacement',
        description: 'Kubernetes/Cloud auto-recovery schedules fresh container on spare capacity node.',
        affectedComponents: ['Container Runtime', 'API Pool'],
        severity: hasSurplus ? 'nominal' : 'warning',
        metricsSnapshot: {
          rps: arch.traffic.ingressRps,
          p95LatencyMs: +(baseSim.performance.p95LatencyMs * (hasSurplus ? 1.2 : 2.1)).toFixed(1),
          cpuUtilizationPct: +(baseSim.capacity.cpuUtilizationPct * (hasSurplus ? 1.2 : 1.6)).toFixed(1),
          errorRatePct: hasSurplus ? 0.1 : 3.2,
          availabilityPct: hasSurplus ? 99.92 : 96.8,
        },
      });

      steps.push({
        timeOffsetSec: 90,
        headline: 'Readiness probe passed & traffic restored',
        description: 'New instance has joined the serving pool. Queues drained to baseline.',
        affectedComponents: [targetName, 'API Pool'],
        severity: 'recovery',
        metricsSnapshot: {
          rps: arch.traffic.ingressRps,
          p95LatencyMs: baseSim.performance.p95LatencyMs,
          cpuUtilizationPct: baseSim.capacity.cpuUtilizationPct,
          errorRatePct: 0.01,
          availabilityPct: 99.99,
        },
      });

      if (!hasSurplus) {
        survived = false;
        sloBreached = true;
        mttrObservedMin = 4.2;
        recoverySummary = 'Single compute instance caused single point of failure outage during replacement boot time.';
        hardening.push('Scale compute tier to minimum of 2 instances across separate availability zones.');
      } else {
        survived = true;
        sloBreached = false;
        mttrObservedMin = 1.5;
        recoverySummary = 'Redundant compute tier absorbed load shift gracefully. Brief 5s connection resets handled by client retries.';
        hardening.push('Add pre-warmed pod pools to accelerate replacement spin-up time under 15 seconds.');
      }
      break;
    }

    case 'rack-failure': {
      const rack = arch.racks[0];
      targetName = rack ? `${rack.code} (PDU A Feed)` : 'Primary Server Rack';

      steps.push({
        timeOffsetSec: 0,
        headline: `Upstream Power Distribution Unit trip on ${targetName}`,
        description: 'Primary feed lost. All devices with single power supply drop immediately.',
        affectedComponents: [targetName, 'Rack Power Strip'],
        severity: 'critical',
        metricsSnapshot: {
          rps: arch.traffic.ingressRps,
          p95LatencyMs: baseSim.performance.p95LatencyMs * 1.5,
          cpuUtilizationPct: 88,
          errorRatePct: 2.1,
          availabilityPct: 97.9,
        },
      });

      steps.push({
        timeOffsetSec: 15,
        headline: 'Rack-level failure isolates collocated nodes',
        description: 'Compute and cache nodes on Rack A go dark. Network switches reroute to Rack B.',
        affectedComponents: ['ToR Switch A', 'Rack-A Instances'],
        severity: 'critical',
        metricsSnapshot: {
          rps: arch.traffic.ingressRps * 0.92,
          p95LatencyMs: baseSim.performance.p95LatencyMs * 2.8,
          cpuUtilizationPct: 96,
          errorRatePct: 8.5,
          availabilityPct: 91.5,
        },
      });

      steps.push({
        timeOffsetSec: 60,
        headline: 'Automatic failover to secondary rack completed',
        description: 'Traffic shifted to Rack B. PDU B took remaining dual-corded workloads.',
        affectedComponents: ['Rack-B', 'Secondary PDU'],
        severity: 'warning',
        metricsSnapshot: {
          rps: arch.traffic.ingressRps * 0.98,
          p95LatencyMs: baseSim.performance.p95LatencyMs * 1.3,
          cpuUtilizationPct: 79,
          errorRatePct: 0.8,
          availabilityPct: 99.2,
        },
      });

      steps.push({
        timeOffsetSec: 180,
        headline: 'Data center ATS (Automatic Transfer Switch) engaged',
        description: 'Generator bus stabilized Rack A. Cold boot sequence executed.',
        affectedComponents: [targetName],
        severity: 'recovery',
        metricsSnapshot: {
          rps: arch.traffic.ingressRps,
          p95LatencyMs: baseSim.performance.p95LatencyMs,
          cpuUtilizationPct: baseSim.capacity.cpuUtilizationPct,
          errorRatePct: 0.02,
          availabilityPct: 99.98,
        },
      });

      if (arch.racks.length <= 1) {
        survived = false;
        sloBreached = true;
        mttrObservedMin = 15.0;
        recoverySummary = 'Single rack topology suffered catastrophic total loss of service.';
        hardening.push('Provision dual-rack architecture (Rack A and Rack B) with dual-corded A/B PDU redundancy.');
      } else {
        survived = true;
        sloBreached = false;
        mttrObservedMin = 3.0;
        recoverySummary = 'Cross-rack distribution allowed surviving rack to handle degraded traffic while ATS stabilized.';
        hardening.push('Verify rack power limits do not exceed 80% during N-1 rack failover surge.');
      }
      break;
    }

    case 'region-failure': {
      const region = arch.regions[0];
      targetName = region ? `${region.name} (${region.code})` : 'Cloud Region';

      const multiRegion = arch.regions.length > 1;

      steps.push({
        timeOffsetSec: 0,
        headline: `Fiber cut / regional transit loss in ${targetName}`,
        description: 'Major backbone routing withdrawal. BGP routes unreachable.',
        affectedComponents: [targetName, 'Core Transit'],
        severity: 'critical',
        metricsSnapshot: {
          rps: arch.traffic.ingressRps,
          p95LatencyMs: baseSim.performance.p95LatencyMs * 2.2,
          cpuUtilizationPct: baseSim.capacity.cpuUtilizationPct,
          errorRatePct: multiRegion ? 20.0 : 100.0,
          availabilityPct: multiRegion ? 80.0 : 0.0,
        },
      });

      steps.push({
        timeOffsetSec: 20,
        headline: 'Global Anycast DNS health check fails',
        description: 'Traffic manager shifts DNS queries away from degraded region.',
        affectedComponents: ['Route 53 / Cloudflare DNS', targetName],
        severity: multiRegion ? 'warning' : 'critical',
        metricsSnapshot: {
          rps: arch.traffic.ingressRps * (multiRegion ? 0.75 : 0.05),
          p95LatencyMs: +(baseSim.performance.p95LatencyMs * (multiRegion ? 1.6 : 10)).toFixed(1),
          cpuUtilizationPct: multiRegion ? 92 : 0,
          errorRatePct: multiRegion ? 5.0 : 95.0,
          availabilityPct: multiRegion ? 95.0 : 5.0,
        },
      });

      steps.push({
        timeOffsetSec: 90,
        headline: multiRegion ? 'Secondary region absorbs 100% of global traffic' : 'Region remains unreachable',
        description: multiRegion
          ? 'Auto-scaling policies triggered in secondary region to expand compute capacity.'
          : 'Total dark outage. Service unavailable globally.',
        affectedComponents: multiRegion ? ['Secondary Region', 'Global Load Balancer'] : [targetName],
        severity: multiRegion ? 'warning' : 'critical',
        metricsSnapshot: {
          rps: multiRegion ? arch.traffic.ingressRps : 0,
          p95LatencyMs: +(baseSim.performance.p95LatencyMs * (multiRegion ? 1.25 : 0)).toFixed(1),
          cpuUtilizationPct: multiRegion ? 82 : 0,
          errorRatePct: multiRegion ? 0.3 : 100,
          availabilityPct: multiRegion ? 99.7 : 0.0,
        },
      });

      steps.push({
        timeOffsetSec: 300,
        headline: multiRegion ? 'Disaster Recovery failover stabilized' : 'Manual incident escalation active',
        description: multiRegion
          ? 'Cross-region read/write routing active. Steady state achieved.'
          : 'Waiting on cloud provider post-mortem and regional recovery.',
        affectedComponents: [targetName],
        severity: multiRegion ? 'recovery' : 'critical',
        metricsSnapshot: {
          rps: multiRegion ? arch.traffic.ingressRps : 0,
          p95LatencyMs: +(baseSim.performance.p95LatencyMs * 1.1).toFixed(1),
          cpuUtilizationPct: baseSim.capacity.cpuUtilizationPct,
          errorRatePct: multiRegion ? 0.02 : 100,
          availabilityPct: multiRegion ? 99.98 : 0,
        },
      });

      if (!multiRegion) {
        survived = false;
        sloBreached = true;
        mttrObservedMin = 45.0;
        recoverySummary = 'Single region architecture suffered complete outage with zero recovery path during regional failure.';
        hardening.push('Deploy active-passive or active-active multi-region deployment with geo-DNS routing.');
      } else {
        survived = true;
        sloBreached = false;
        mttrObservedMin = 1.8;
        recoverySummary = 'Global Anycast DNS successfully steered ingress away from failed region to healthy secondary region.';
        hardening.push('Pre-scale idle capacity in secondary region to eliminate cold-scale lag.');
      }
      break;
    }

    case 'database-primary-failure': {
      const db = arch.databaseNodes[0];
      targetName = db ? `${db.name} (Primary Node)` : 'Database Primary';
      const hasReplica = db && db.readReplicas > 0;
      const isSync = db && db.replicationMode === 'sync';

      steps.push({
        timeOffsetSec: 0,
        headline: `Kernel panic on ${targetName}`,
        description: 'Postgres/DB OS crashed. Write WAL log flush halted.',
        affectedComponents: [targetName, 'Write Pool'],
        severity: 'critical',
        metricsSnapshot: {
          rps: arch.traffic.ingressRps,
          p95LatencyMs: baseSim.performance.p95LatencyMs * 2.5,
          cpuUtilizationPct: baseSim.capacity.cpuUtilizationPct,
          errorRatePct: 22.0, // write requests fail immediately
          availabilityPct: 78.0,
        },
      });

      steps.push({
        timeOffsetSec: 15,
        headline: hasReplica ? 'Consensus leader election initiated (Patroni/Raft)' : 'No replica available',
        description: hasReplica
          ? `Read replica promoted to new Primary. Replication mode: ${isSync ? 'Sync (0 data loss)' : 'Async (~120ms WAL replay)'}.`
          : 'Automated disk snapshot recovery initiated. Cold boot required.',
        affectedComponents: ['DB Replica Pool', targetName],
        severity: hasReplica ? 'warning' : 'critical',
        metricsSnapshot: {
          rps: arch.traffic.ingressRps,
          p95LatencyMs: baseSim.performance.p95LatencyMs * (hasReplica ? 1.8 : 5.0),
          cpuUtilizationPct: 74,
          errorRatePct: hasReplica ? 4.5 : 45.0,
          availabilityPct: hasReplica ? 95.5 : 55.0,
        },
      });

      steps.push({
        timeOffsetSec: 45,
        headline: hasReplica ? 'DNS CNAME / VIP switched to newly promoted Primary' : 'Restoring snapshot from storage',
        description: hasReplica
          ? 'Application connection pool re-established. Write operations resumed.'
          : 'Disk volume mounting in progress. Engine replaying transaction logs.',
        affectedComponents: [targetName, 'App Connection Pool'],
        severity: hasReplica ? 'nominal' : 'critical',
        metricsSnapshot: {
          rps: arch.traffic.ingressRps,
          p95LatencyMs: +(baseSim.performance.p95LatencyMs * (hasReplica ? 1.15 : 4.0)).toFixed(1),
          cpuUtilizationPct: baseSim.capacity.cpuUtilizationPct,
          errorRatePct: hasReplica ? 0.2 : 35.0,
          availabilityPct: hasReplica ? 99.8 : 65.0,
        },
      });

      steps.push({
        timeOffsetSec: 120,
        headline: hasReplica ? 'Failover complete. Degraded replica count.' : 'Snapshot restored after cold boot',
        description: hasReplica
          ? 'System fully serving. Rebuilding replacement replica in the background.'
          : 'Database back online after 15 minutes of downtime.',
        affectedComponents: [targetName],
        severity: 'recovery',
        metricsSnapshot: {
          rps: arch.traffic.ingressRps,
          p95LatencyMs: baseSim.performance.p95LatencyMs,
          cpuUtilizationPct: baseSim.capacity.cpuUtilizationPct,
          errorRatePct: 0.01,
          availabilityPct: 99.99,
        },
      });

      if (!hasReplica) {
        survived = false;
        sloBreached = true;
        mttrObservedMin = 12.5;
        recoverySummary = 'Cold restore required. Massive write downtime and error rate breach.';
        hardening.push('Provision at least 1 standby read replica with automated failover orchestrator.');
      } else {
        survived = true;
        sloBreached = !isSync;
        mttrObservedMin = isSync ? 0.8 : 2.1;
        recoverySummary = `Automated replica promotion completed in ${mttrObservedMin} minutes. ${isSync ? 'Zero data loss verified.' : 'Minor async WAL lag synced.'}`;
        hardening.push('Switch database replication mode to synchronous commit for mission-critical write paths.');
      }
      break;
    }

    case 'network-degradation': {
      targetName = 'Core Transit & Cross-Zone Link';
      steps.push({
        timeOffsetSec: 0,
        headline: 'Network packet drop & latency injection (120ms, 8% loss)',
        description: 'Simulating congested transit route and TCP packet retransmissions.',
        affectedComponents: [targetName],
        severity: 'warning',
        metricsSnapshot: {
          rps: arch.traffic.ingressRps,
          p95LatencyMs: baseSim.performance.p95LatencyMs + 120,
          cpuUtilizationPct: baseSim.capacity.cpuUtilizationPct + 12,
          errorRatePct: 2.5,
          availabilityPct: 97.5,
        },
      });

      steps.push({
        timeOffsetSec: 30,
        headline: 'HTTP connection pools back up',
        description: 'Slow client connections tie up thread pools on compute instances.',
        affectedComponents: ['Compute Worker Threads', 'TCP Buffer'],
        severity: 'critical',
        metricsSnapshot: {
          rps: arch.traffic.ingressRps * 0.94,
          p95LatencyMs: +(baseSim.performance.p95LatencyMs * 2.8).toFixed(1),
          cpuUtilizationPct: Math.min(100, baseSim.capacity.cpuUtilizationPct + 28),
          errorRatePct: 6.8,
          availabilityPct: 93.2,
        },
      });

      steps.push({
        timeOffsetSec: 90,
        headline: 'Circuit breakers trip to protect upstream systems',
        description: 'Graceful degradation engaged. Static fallbacks served from CDN cache.',
        affectedComponents: ['Circuit Breaker', 'Edge Cache'],
        severity: 'warning',
        metricsSnapshot: {
          rps: arch.traffic.ingressRps,
          p95LatencyMs: +(baseSim.performance.p95LatencyMs * 1.6).toFixed(1),
          cpuUtilizationPct: baseSim.capacity.cpuUtilizationPct + 8,
          errorRatePct: 1.1,
          availabilityPct: 98.9,
        },
      });

      steps.push({
        timeOffsetSec: 180,
        headline: 'Alternative transit route selected via BGP',
        description: 'Network path cleared. Latency returns to baseline.',
        affectedComponents: [targetName],
        severity: 'recovery',
        metricsSnapshot: {
          rps: arch.traffic.ingressRps,
          p95LatencyMs: baseSim.performance.p95LatencyMs,
          cpuUtilizationPct: baseSim.capacity.cpuUtilizationPct,
          errorRatePct: 0.02,
          availabilityPct: 99.98,
        },
      });

      survived = true;
      sloBreached = false;
      mttrObservedMin = 1.9;
      recoverySummary = 'Circuit breakers and aggressive timeout budgets prevented catastrophic thread pool exhaustion.';
      hardening.push('Configure tight TCP keep-alives and 800ms client read timeouts with circuit breakers.');
      break;
    }

    case 'traffic-spike': {
      targetName = 'Global Ingress Traffic (500% Surge)';
      steps.push({
        timeOffsetSec: 0,
        headline: 'Viral event / flash sale: 5x traffic surge hits ingress',
        description: `Traffic jumps from ${arch.traffic.ingressRps.toLocaleString()} to ${(arch.traffic.ingressRps * 5).toLocaleString()} RPS in 10s.`,
        affectedComponents: [targetName, 'Edge Gateways'],
        severity: 'warning',
        metricsSnapshot: {
          rps: arch.traffic.ingressRps * 5,
          p95LatencyMs: baseSim.performance.p95LatencyMs * 1.9,
          cpuUtilizationPct: 82,
          errorRatePct: 0.5,
          availabilityPct: 99.5,
        },
      });

      const cacheEnabled = arch.cacheNodes.some(c => c.enabled);

      steps.push({
        timeOffsetSec: 15,
        headline: cacheEnabled ? 'Cache layer shields database reads' : 'Database IOPS collapses under unbuffered read wave',
        description: cacheEnabled
          ? 'Redis absorbing 88% of read queries. CPU queues building on compute tier.'
          : 'Disk queues saturated at 100%. Database thread pool starvation.',
        affectedComponents: cacheEnabled ? ['Redis Cache', 'Compute Tier'] : ['Primary Database', 'Disk IOPS'],
        severity: cacheEnabled ? 'warning' : 'critical',
        metricsSnapshot: {
          rps: arch.traffic.ingressRps * 4.8,
          p95LatencyMs: +(baseSim.performance.p95LatencyMs * (cacheEnabled ? 2.5 : 8.0)).toFixed(1),
          cpuUtilizationPct: cacheEnabled ? 94 : 100,
          errorRatePct: cacheEnabled ? 1.8 : 28.5,
          availabilityPct: cacheEnabled ? 98.2 : 71.5,
        },
      });

      steps.push({
        timeOffsetSec: 60,
        headline: 'HPA (Horizontal Pod Autoscaler) expands compute pool',
        description: 'New pods provisioned. Ingress load spread across wider pool.',
        affectedComponents: ['Compute Autoscaler', 'Worker Pool'],
        severity: cacheEnabled ? 'nominal' : 'warning',
        metricsSnapshot: {
          rps: arch.traffic.ingressRps * 5,
          p95LatencyMs: +(baseSim.performance.p95LatencyMs * (cacheEnabled ? 1.3 : 3.2)).toFixed(1),
          cpuUtilizationPct: cacheEnabled ? 65 : 88,
          errorRatePct: cacheEnabled ? 0.1 : 5.4,
          availabilityPct: cacheEnabled ? 99.9 : 94.6,
        },
      });

      steps.push({
        timeOffsetSec: 180,
        headline: 'Sustained peak handled at scaled footprint',
        description: 'All 5x requests served within SLO latency boundaries.',
        affectedComponents: ['Scaled Infrastructure'],
        severity: 'recovery',
        metricsSnapshot: {
          rps: arch.traffic.ingressRps * 5,
          p95LatencyMs: +(baseSim.performance.p95LatencyMs * 1.15).toFixed(1),
          cpuUtilizationPct: 62,
          errorRatePct: 0.01,
          availabilityPct: 99.99,
        },
      });

      if (!cacheEnabled) {
        survived = false;
        sloBreached = true;
        mttrObservedMin = 5.2;
        recoverySummary = 'Absence of cache layer caused direct database saturation and massive request drops.';
        hardening.push('Enable Redis cache tier with high TTLs on read-heavy entities to decouple database from surges.');
      } else {
        survived = true;
        sloBreached = false;
        mttrObservedMin = 1.0;
        recoverySummary = 'Redis cache tier shielded backend relational database. Autoscaler absorbed compute load within 60s.';
        hardening.push('Tune predictive horizontal pod autoscaling threshold down to 60% CPU for faster response.');
      }
      break;
    }
  }

  return {
    triggerType,
    targetId: targetId || 'default-target',
    targetName,
    durationMinutes: 5,
    steps,
    survived,
    sloBreached,
    mttrObservedMin,
    recoverySummary,
    architecturalHardeningRecommendations: hardening,
  };
}
