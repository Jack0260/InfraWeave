import React, { useState } from 'react';
import {
  InfrastructureArchitecture,
  SolverConstraints,
  SolverCandidate,
  SimulationResult,
} from '../types/infrastructure';
import { solveConstraints } from '../simulator/solver';
import {
  Sliders,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
  DollarSign,
} from 'lucide-react';

interface ConstraintSolverViewProps {
  currentArch: InfrastructureArchitecture;
  currentMetrics: SimulationResult;
  onApplyCandidate: (arch: InfrastructureArchitecture, title: string) => void;
}

export const ConstraintSolverView: React.FC<ConstraintSolverViewProps> = ({
  currentArch,
  currentMetrics,
  onApplyCandidate,
}) => {
  const [constraints, setConstraints] = useState<SolverConstraints>({
    maxCostMonthly: Math.round(currentMetrics.cost.monthlyTotal * 1.25),
    minAvailabilityPct: 99.95,
    maxLatencyP95Ms: 25,
    minCapacityHeadroomPct: 35,
    objective: 'balanced',
  });

  const [candidates, setCandidates] = useState<SolverCandidate[]>(() =>
    solveConstraints(currentArch, {
      maxCostMonthly: Math.round(currentMetrics.cost.monthlyTotal * 1.25),
      minAvailabilityPct: 99.95,
      maxLatencyP95Ms: 25,
      minCapacityHeadroomPct: 35,
      objective: 'balanced',
    })
  );

  const handleRunSolver = () => {
    const results = solveConstraints(currentArch, constraints);
    setCandidates(results);
  };

  return (
    <div className="space-y-6">
      {/* Signature Header Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-semibold text-white">Design Under Constraints</h2>
              <span className="text-xs text-neutral-500 font-mono">
                · Applied Science Optimizer
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
              Define your business and engineering boundaries. The solver navigates the combinatorial parameter space
              (compute scaling, replica topology, memory caching, and multi-rack fault zones) to identify Pareto-optimal configurations.
            </p>
          </div>
          <button
            onClick={handleRunSolver}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Search Feasible Topologies</span>
          </button>
        </div>

        {/* Constraint Inputs Grid */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-4 border-t border-neutral-800/80 text-xs">
          {/* Constraint 1: Monthly Cost Ceiling */}
          <div className="bg-neutral-950/80 border border-neutral-800/80 rounded p-2.5">
            <label className="text-neutral-400 block mb-1">
              Max Monthly Budget ($)
            </label>
            <input
              type="number"
              step={100}
              value={constraints.maxCostMonthly}
              onChange={e =>
                setConstraints({ ...constraints, maxCostMonthly: Math.max(100, Number(e.target.value)) })
              }
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white font-mono tabular-nums focus:outline-none focus:border-emerald-500"
            />
            <div className="text-[11px] text-neutral-500 mt-1">
              Current: ${currentMetrics.cost.monthlyTotal.toLocaleString()}/mo
            </div>
          </div>

          {/* Constraint 2: Min Availability */}
          <div className="bg-neutral-950/80 border border-neutral-800/80 rounded p-2.5">
            <label className="text-neutral-400 block mb-1">
              Min Availability (%)
            </label>
            <input
              type="number"
              step={0.01}
              value={constraints.minAvailabilityPct}
              onChange={e =>
                setConstraints({ ...constraints, minAvailabilityPct: Number(e.target.value) })
              }
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white font-mono tabular-nums focus:outline-none focus:border-emerald-500"
            />
            <div className="text-[11px] text-neutral-500 mt-1">
              Current: {currentMetrics.reliability.compositeAvailabilityPct}%
            </div>
          </div>

          {/* Constraint 3: Max p95 Latency */}
          <div className="bg-neutral-950/80 border border-neutral-800/80 rounded p-2.5">
            <label className="text-neutral-400 block mb-1">
              Max Latency p95 (ms)
            </label>
            <input
              type="number"
              value={constraints.maxLatencyP95Ms}
              onChange={e =>
                setConstraints({ ...constraints, maxLatencyP95Ms: Number(e.target.value) })
              }
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white font-mono tabular-nums focus:outline-none focus:border-emerald-500"
            />
            <div className="text-[11px] text-neutral-500 mt-1">
              Current: {currentMetrics.performance.p95LatencyMs} ms
            </div>
          </div>

          {/* Constraint 4: Min Capacity Headroom */}
          <div className="bg-neutral-950/80 border border-neutral-800/80 rounded p-2.5">
            <label className="text-neutral-400 block mb-1">
              Min Headroom Buffer (%)
            </label>
            <input
              type="number"
              value={constraints.minCapacityHeadroomPct}
              onChange={e =>
                setConstraints({ ...constraints, minCapacityHeadroomPct: Number(e.target.value) })
              }
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white font-mono tabular-nums focus:outline-none focus:border-emerald-500"
            />
            <div className="text-[11px] text-neutral-500 mt-1">
              Current: {currentMetrics.capacity.cpuHeadroomPct}%
            </div>
          </div>

          {/* Objective Goal */}
          <div className="bg-neutral-950/80 border border-neutral-800/80 rounded p-2.5">
            <label className="text-neutral-400 block mb-1">
              Optimization Goal
            </label>
            <select
              value={constraints.objective}
              onChange={e =>
                setConstraints({ ...constraints, objective: e.target.value as any })
              }
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="balanced">Pareto Balanced</option>
              <option value="cost-min">Minimize Cost</option>
              <option value="performance-max">Ultra-Low Latency</option>
              <option value="reliability-max">Max Availability</option>
            </select>
            <div className="text-[11px] text-neutral-500 mt-1">
              Weighted objective ranking
            </div>
          </div>
        </div>
      </div>

      {/* Candidate Solutions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">
            Proposed Architectures ({candidates.filter(c => c.isFeasible).length} Feasible Options Found)
          </h3>
          <span className="text-xs text-neutral-500">
            Ranked by Pareto score & constraint compliance
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {candidates.map(candidate => {
            const m = candidate.metrics;

            return (
              <div
                key={candidate.id}
                className={`bg-neutral-900 border rounded-lg p-5 flex flex-col justify-between transition-all ${
                  candidate.isFeasible
                    ? 'border-neutral-800 hover:border-emerald-500/50'
                    : 'border-rose-900/60 opacity-80'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h4 className="text-sm font-semibold text-white">{candidate.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                        {candidate.isFeasible ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Feasible Solution
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" />
                            Constraint Breached
                          </span>
                        )}
                        <span>·</span>
                        <span className="font-mono tabular-nums text-neutral-300">
                          Score: {candidate.score}/100
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onApplyCandidate(candidate.architecture, candidate.title)}
                      className="px-3 py-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 text-white rounded border border-neutral-700 flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      <span>Apply</span>
                      <ArrowRight className="w-3 h-3 text-cyan-400" />
                    </button>
                  </div>

                  {/* Violations List if any */}
                  {candidate.violations.length > 0 && (
                    <div className="my-2 p-2 bg-rose-950/40 border border-rose-900/50 rounded text-xs text-rose-300 space-y-1">
                      {candidate.violations.map((viol, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                          <span>{viol}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Algorithmic Reasoning */}
                  <p className="text-xs text-neutral-300 my-2 leading-relaxed">
                    {candidate.reasoning}
                  </p>

                  {/* Metrics Snapshot Bar */}
                  <div className="grid grid-cols-4 gap-2 bg-neutral-950/70 border border-neutral-800/80 rounded p-2 text-center text-xs my-3">
                    <div>
                      <div className="text-[11px] text-neutral-500">Cost/mo</div>
                      <div className="font-mono font-semibold tabular-nums text-white mt-0.5">
                        ${m.cost.monthlyTotal.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-neutral-500">p95 Latency</div>
                      <div className="font-mono font-semibold tabular-nums text-white mt-0.5">
                        {m.performance.p95LatencyMs}ms
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-neutral-500">Availability</div>
                      <div className="font-mono font-semibold tabular-nums text-white mt-0.5">
                        {m.reliability.compositeAvailabilityPct}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-neutral-500">Headroom</div>
                      <div className="font-mono font-semibold tabular-nums text-white mt-0.5">
                        {m.capacity.cpuHeadroomPct}%
                      </div>
                    </div>
                  </div>

                  {/* Tradeoffs Breakdown */}
                  <div className="text-xs mt-3">
                    <span className="text-neutral-400 font-medium">Tradeoff Consequences:</span>
                    <ul className="mt-1 space-y-1 text-neutral-400 text-[11px]">
                      {candidate.tradeoffs.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-neutral-600 mt-1">▪</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Recommended Topology Modifications */}
                <div className="mt-3 pt-2.5 border-t border-neutral-800/60 text-xs">
                  <span className="text-neutral-500 text-[11px] font-mono">Actionable Changes:</span>
                  <div className="text-neutral-300 text-[11px] mt-0.5 truncate">
                    {candidate.recommendedChanges.join(' · ')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
