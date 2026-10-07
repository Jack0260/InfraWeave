import React, { useState } from 'react';
import {
  InfrastructureArchitecture,
  SimulationResult,
  RolePersona,
} from '../types/infrastructure';
import { generateCapacityForecast } from '../simulator/dataScience';
import {
  Shield,
  GitBranch,
  Terminal,
  Cloud,
  LineChart,
  BrainCircuit,
  Briefcase,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Cpu,
} from 'lucide-react';

interface RolePerspectivesViewProps {
  architecture: InfrastructureArchitecture;
  metrics: SimulationResult;
}

export const RolePerspectivesView: React.FC<RolePerspectivesViewProps> = ({
  architecture,
  metrics,
}) => {
  const [activePersona, setActivePersona] = useState<RolePersona>('sre');
  const [growthRate, setGrowthRate] = useState<number>(18.5);

  const forecast = generateCapacityForecast(architecture, growthRate);

  return (
    <div className="space-y-6">
      {/* Header Banner & Persona Selector */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-pink-400" />
              <h2 className="text-base font-semibold text-white">Cross-Disciplinary Engineering Lenses</h2>
              <span className="text-xs text-neutral-500 font-mono">
                · Specialized Analysis Perspectives
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
              Examine the architecture through domain-specific lenses: SRE error budgets, DevOps canary safety, Platform
              blueprints, Data Science capacity forecasting, Applied Science formulas, and Solutions Architect trade-offs.
            </p>
          </div>
        </div>

        {/* Persona Selector Buttons */}
        <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-neutral-800/80">
          <button
            onClick={() => setActivePersona('sre')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
              activePersona === 'sre'
                ? 'bg-rose-950/60 border border-rose-500 text-rose-200'
                : 'bg-neutral-950/80 border border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-rose-400" />
            <span>SRE</span>
          </button>

          <button
            onClick={() => setActivePersona('devops')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
              activePersona === 'devops'
                ? 'bg-amber-950/60 border border-amber-500 text-amber-200'
                : 'bg-neutral-950/80 border border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 text-amber-400" />
            <span>DevOps</span>
          </button>

          <button
            onClick={() => setActivePersona('platform-engineer')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
              activePersona === 'platform-engineer'
                ? 'bg-cyan-950/60 border border-cyan-500 text-cyan-200'
                : 'bg-neutral-950/80 border border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Platform</span>
          </button>

          <button
            onClick={() => setActivePersona('cloud-engineer')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
              activePersona === 'cloud-engineer'
                ? 'bg-blue-950/60 border border-blue-500 text-blue-200'
                : 'bg-neutral-950/80 border border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-blue-400" />
            <span>Cloud Engineer</span>
          </button>

          <button
            onClick={() => setActivePersona('data-scientist')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
              activePersona === 'data-scientist'
                ? 'bg-purple-950/60 border border-purple-500 text-purple-200'
                : 'bg-neutral-950/80 border border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <LineChart className="w-3.5 h-3.5 text-purple-400" />
            <span>Data Scientist</span>
          </button>

          <button
            onClick={() => setActivePersona('applied-scientist')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
              activePersona === 'applied-scientist'
                ? 'bg-emerald-950/60 border border-emerald-500 text-emerald-200'
                : 'bg-neutral-950/80 border border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5 text-emerald-400" />
            <span>Applied Scientist</span>
          </button>

          <button
            onClick={() => setActivePersona('solutions-architect')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
              activePersona === 'solutions-architect'
                ? 'bg-indigo-950/60 border border-indigo-500 text-indigo-200'
                : 'bg-neutral-950/80 border border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
            <span>Solutions Architect</span>
          </button>
        </div>
      </div>

      {/* Persona Specific Body Content */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
        {/* SRE PERSPECTIVE */}
        {activePersona === 'sre' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">SRE Lens: SLO Governance & Blast Radius</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Calculating monthly error budget burns and auditing single points of failure.
                </p>
              </div>
              <div className="text-xs font-mono text-neutral-400">
                Target: {metrics.reliability.sloTargetPct}% Availability
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-neutral-950 p-3 rounded border border-neutral-800">
                <span className="text-neutral-500 block mb-1">Monthly Error Budget</span>
                <div className="text-sm font-bold font-mono text-white">
                  {metrics.reliability.errorBudgetMinutesPerMonth} minutes
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  Consumed: {metrics.reliability.errorBudgetConsumedPct}%
                </div>
              </div>

              <div className="bg-neutral-950 p-3 rounded border border-neutral-800">
                <span className="text-neutral-500 block mb-1">Expected Downtime / Mo</span>
                <div className="text-sm font-bold font-mono text-white">
                  {(43200 * (1 - metrics.reliability.compositeAvailabilityPct / 100)).toFixed(2)} min
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  Availability: {metrics.reliability.compositeAvailabilityPct}%
                </div>
              </div>

              <div className="bg-neutral-950 p-3 rounded border border-neutral-800">
                <span className="text-neutral-500 block mb-1">Estimated MTTR</span>
                <div className="text-sm font-bold font-mono text-white">
                  {metrics.reliability.mttrMinutes} minutes
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  Blast Radius: {metrics.reliability.blastRadiusScore}/100
                </div>
              </div>
            </div>

            {/* SPOF Inventory */}
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-white mb-2">Single Point of Failure (SPOF) Audit</h4>
              {metrics.reliability.singlePointsOfFailure.length === 0 ? (
                <div className="p-3 bg-emerald-950/30 border border-emerald-900/40 rounded text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>No single points of failure detected in active compute, database, or region tiers.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {metrics.reliability.singlePointsOfFailure.map(spof => (
                    <div
                      key={spof.id}
                      className="p-3 bg-rose-950/30 border border-rose-900/40 rounded text-xs text-rose-300 flex items-start gap-2.5"
                    >
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-white">
                          [{spof.type}] {spof.name}
                        </div>
                        <div className="text-rose-200/90 mt-0.5">{spof.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* DEVOPS PERSPECTIVE */}
        {activePersona === 'devops' && (
          <div className="space-y-4">
            <div className="border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-semibold text-white">DevOps Lens: Deployment Safety & Release Strategy</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Evaluation of Canary vs Blue-Green rollout risks based on current instance counts and replica lag.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-neutral-950 p-4 rounded border border-neutral-800">
                <h4 className="font-semibold text-white mb-2 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  Canary Rollout Feasibility
                </h4>
                <p className="text-neutral-400 leading-relaxed mb-3">
                  With {architecture.computeNodes.reduce((a, c) => a + c.instances, 0)} compute units, a 10% canary
                  weight allocates 1 dedicated canary instance.
                </p>
                <div className="text-neutral-300 space-y-1">
                  <div>· Recommended Canary Duration: 15 minutes</div>
                  <div>· Automated Rollback Trigger: Error rate &gt; 0.5% or p95 &gt; {metrics.performance.p95LatencyMs * 2}ms</div>
                  <div>· Session Stickiness: Cookie-based route pinning recommended</div>
                </div>
              </div>

              <div className="bg-neutral-950 p-4 rounded border border-neutral-800">
                <h4 className="font-semibold text-white mb-2 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                  Blue/Green Environment Surge Capacity
                </h4>
                <p className="text-neutral-400 leading-relaxed mb-3">
                  Full Blue/Green deployment requires temporary +100% duplicate compute capacity (+${(metrics.cost.computeCostMonth / 730 * 2).toFixed(2)}/hr).
                </p>
                <div className="text-neutral-300 space-y-1">
                  <div>· Pre-warming duration: 3 minutes</div>
                  <div>· Database schema migration: Backward-compatible column additions only</div>
                  <div>· Instant DNS CNAME flip at target group level</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PLATFORM PERSPECTIVE */}
        {activePersona === 'platform-engineer' && (
          <div className="space-y-4">
            <div className="border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-semibold text-white">Platform Engineer: Standardized Golden Path</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Golden path module definitions, pod anti-affinity policies, and resource quota templates.
              </p>
            </div>

            <div className="bg-neutral-950 p-4 rounded border border-neutral-800 text-xs font-mono text-neutral-300 space-y-2">
              <div className="text-cyan-400 font-sans font-semibold mb-2">
                Standard Platform Compliance Checklist:
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                <span>PodAntiAffinity enabled across topology.kubernetes.io/zone</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                <span>HorizontalPodAutoscaler targets set to 65% CPU target utilization</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                <span>Graceful termination period configured with 30s SIGTERM window</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                <span>Liveness and readiness probes isolated with distinct interval thresholds</span>
              </div>
            </div>
          </div>
        )}

        {/* CLOUD ENGINEER PERSPECTIVE */}
        {activePersona === 'cloud-engineer' && (
          <div className="space-y-4">
            <div className="border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-semibold text-white">Cloud Engineer: Cloud Spend & Egress Optimization</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Cloud bill categorization, inter-region egress penalties, and reserved instance savings opportunities.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-neutral-950 p-3 rounded border border-neutral-800">
                <span className="text-neutral-500 block mb-0.5">Compute Spend</span>
                <div className="text-sm font-mono font-semibold text-white">
                  ${metrics.cost.computeCostMonth.toLocaleString()}/mo
                </div>
              </div>
              <div className="bg-neutral-950 p-3 rounded border border-neutral-800">
                <span className="text-neutral-500 block mb-0.5">Database Spend</span>
                <div className="text-sm font-mono font-semibold text-white">
                  ${metrics.cost.databaseCostMonth.toLocaleString()}/mo
                </div>
              </div>
              <div className="bg-neutral-950 p-3 rounded border border-neutral-800">
                <span className="text-neutral-500 block mb-0.5">Cache & Queues</span>
                <div className="text-sm font-mono font-semibold text-white">
                  ${(metrics.cost.cacheCostMonth + metrics.cost.queueCostMonth).toLocaleString()}/mo
                </div>
              </div>
              <div className="bg-neutral-950 p-3 rounded border border-neutral-800">
                <span className="text-neutral-500 block mb-0.5">Network Egress</span>
                <div className="text-sm font-mono font-semibold text-white">
                  ${metrics.cost.networkEgressCostMonth.toLocaleString()}/mo
                </div>
              </div>
            </div>

            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-300">
              <span className="font-semibold text-white">1-Year Savings Plan Opportunity:</span>
              <p className="mt-1 text-neutral-400">
                Committing to 1-Year Compute Savings Plans can reduce monthly compute costs from
                ${metrics.cost.computeCostMonth.toLocaleString()} to ~${(metrics.cost.computeCostMonth * 0.72).toFixed(0)}/mo
                (approx 28% instant reduction).
              </p>
            </div>
          </div>
        )}

        {/* DATA SCIENTIST PERSPECTIVE */}
        {activePersona === 'data-scientist' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Data Science: Historical Workload Forecast</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Simulated time-series extrapolation projecting future organic capacity exhaustion.
                </p>
              </div>

              {/* Growth Rate Slider */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-neutral-400">Monthly Traffic Growth:</span>
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={1}
                  value={growthRate}
                  onChange={e => setGrowthRate(Number(e.target.value))}
                  className="w-24 accent-purple-500"
                />
                <span className="font-mono text-purple-300 tabular-nums">{growthRate}%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-4">
              <div className="bg-neutral-950 p-3 rounded border border-neutral-800">
                <span className="text-neutral-500 block mb-0.5">Days to Capacity Exhaustion</span>
                <div className={`text-base font-bold font-mono ${forecast.earliestExhaustionDays < 14 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {forecast.earliestExhaustionDays === 999 ? '> 30 Days' : `${forecast.earliestExhaustionDays} Days`}
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  Limiting Factor: {forecast.exhaustionComponent}
                </div>
              </div>

              <div className="bg-neutral-950 p-3 rounded border border-neutral-800">
                <span className="text-neutral-500 block mb-0.5">Actionable Target Date</span>
                <div className="text-base font-bold font-mono text-white">
                  {forecast.recommendedActionDate}
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  Includes 7-day safety lead buffer
                </div>
              </div>

              <div className="bg-neutral-950 p-3 rounded border border-neutral-800">
                <span className="text-neutral-500 block mb-0.5">RPS to CPU Elasticity</span>
                <div className="text-base font-bold font-mono text-white">
                  {forecast.sensitivityCoefficients.rpsToCpuElasticity}
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  Δ CPU% per incoming request
                </div>
              </div>
            </div>

            {/* Time-series Table */}
            <div className="bg-neutral-950 rounded border border-neutral-800 p-3">
              <div className="text-xs font-semibold text-white mb-2">30-Day Forward Projection Data Points</div>
              <div className="grid grid-cols-6 text-[11px] font-mono text-neutral-400 border-b border-neutral-800 pb-1 mb-2">
                <span>Date</span>
                <span>Type</span>
                <span>Ingress RPS</span>
                <span>CPU Load</span>
                <span>IOPS Load</span>
                <span>Status</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-xs tabular-nums text-neutral-300">
                {forecast.timeSeries
                  .filter((_, idx) => idx % 4 === 0)
                  .map(pt => (
                    <div key={pt.day} className="grid grid-cols-6 items-center text-[11px]">
                      <span className="text-neutral-400">{pt.dateStr}</span>
                      <span className="text-neutral-500">{pt.day <= 0 ? 'Historical' : 'Projected'}</span>
                      <span>{pt.projectedRps.toLocaleString()}</span>
                      <span className={pt.cpuProjectedPct >= 85 ? 'text-rose-400' : 'text-neutral-300'}>
                        {pt.cpuProjectedPct.toFixed(1)}%
                      </span>
                      <span className={pt.iopsProjectedPct >= 85 ? 'text-rose-400' : 'text-neutral-300'}>
                        {pt.iopsProjectedPct.toFixed(1)}%
                      </span>
                      <span>
                        {pt.isBreached ? (
                          <span className="text-rose-400 font-semibold">BREACH</span>
                        ) : (
                          <span className="text-emerald-400">Nominal</span>
                        )}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* APPLIED SCIENTIST PERSPECTIVE */}
        {activePersona === 'applied-scientist' && (
          <div className="space-y-4">
            <div className="border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-semibold text-white">Applied Science: Analytical Mathematical Formulations</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Deterministic queuing models, thermodynamics, and reliability block diagram equations.
              </p>
            </div>

            <div className="space-y-3">
              {metrics.mathematicalAssumptions.map((item, idx) => (
                <div key={idx} className="bg-neutral-950 p-3.5 rounded border border-neutral-800 text-xs">
                  <div className="flex items-center justify-between font-semibold text-white mb-1">
                    <span>{item.category}</span>
                  </div>
                  <div className="bg-neutral-900 border border-neutral-800/80 rounded px-2.5 py-1.5 font-mono text-cyan-300 text-[11px] my-1.5">
                    {item.formula}
                  </div>
                  <p className="text-neutral-400 text-xs mt-1">{item.explanation}</p>
                  <div className="mt-2 pt-1.5 border-t border-neutral-800/60 font-mono text-[11px] text-neutral-300">
                    Live Calculation: {item.currentValue}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SOLUTIONS ARCHITECT PERSPECTIVE */}
        {activePersona === 'solutions-architect' && (
          <div className="space-y-4">
            <div className="border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-semibold text-white">Solutions Architect: Strategic Trade-Off Analysis</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Architectural decision record summary and operational trade-off evaluation.
              </p>
            </div>

            <div className="bg-neutral-950 p-4 rounded border border-neutral-800 text-xs space-y-3 leading-relaxed">
              <div className="font-semibold text-white text-sm">Executive Architecture Synthesis</div>
              <p className="text-neutral-300">
                The current architecture <span className="text-cyan-400 font-medium">{architecture.name}</span> satisfies
                the workload demands of {architecture.traffic.ingressRps.toLocaleString()} RPS at an estimated spend of
                ${metrics.cost.monthlyTotal.toLocaleString()}/month. Tail latency is bounded at {metrics.performance.p95LatencyMs}ms.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="border border-neutral-800 p-3 rounded bg-neutral-900/50">
                  <div className="font-medium text-emerald-400 mb-1">Architectural Strengths:</div>
                  <ul className="text-neutral-400 space-y-1 text-[11px]">
                    <li>• Composite availability of {metrics.reliability.compositeAvailabilityPct}% fulfills tier-1 SLOs.</li>
                    <li>• Caching layer provides effective database query isolation.</li>
                    <li>• CPU headroom of {metrics.capacity.cpuHeadroomPct}% tolerates sudden 1.5x traffic surges.</li>
                  </ul>
                </div>

                <div className="border border-neutral-800 p-3 rounded bg-neutral-900/50">
                  <div className="font-medium text-amber-400 mb-1">Architectural Compromises:</div>
                  <ul className="text-neutral-400 space-y-1 text-[11px]">
                    <li>• Power draw of {metrics.dataCenter.itPowerDrawKw} kW requires verified high-density PDU provisioning.</li>
                    <li>• Inter-rack or inter-region network latency contributes {metrics.performance.networkHopLatencyMs}ms baseline.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
