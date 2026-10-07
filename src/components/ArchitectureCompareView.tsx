import React, { useState } from 'react';
import {
  InfrastructureArchitecture,
  SimulationResult,
} from '../types/infrastructure';
import { simulateArchitecture } from '../simulator/engine';
import { ARCHITECTURE_PRESETS } from '../simulator/presets';
import {
  Scale,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Clock,
  Shield,
  Zap,
  Gauge,
  Copy,
  Check,
} from 'lucide-react';

interface ArchitectureCompareViewProps {
  archA: InfrastructureArchitecture;
  metricsA: SimulationResult;
  onPromoteArchB: (archB: InfrastructureArchitecture) => void;
}

export const ArchitectureCompareView: React.FC<ArchitectureCompareViewProps> = ({
  archA,
  metricsA,
  onPromoteArchB,
}) => {
  // Branch B state
  const [archBKey, setArchBKey] = useState<string>('financial-core');
  const [archB, setArchB] = useState<InfrastructureArchitecture>(
    () => ARCHITECTURE_PRESETS['financial-core'] || archA
  );

  const metricsB = simulateArchitecture(archB);

  const handleSelectPresetB = (key: string) => {
    setArchBKey(key);
    if (ARCHITECTURE_PRESETS[key]) {
      setArchB(ARCHITECTURE_PRESETS[key]);
    }
  };

  const handleCloneAToB = () => {
    const cloned = JSON.parse(JSON.stringify(archA));
    cloned.id = `${archA.id}-branch-b`;
    cloned.name = `${archA.name} (Branch B Variant)`;
    setArchB(cloned);
  };

  // Deltas (B minus A)
  const deltaCost = metricsB.cost.monthlyTotal - metricsA.cost.monthlyTotal;
  const deltaP95 = +(metricsB.performance.p95LatencyMs - metricsA.performance.p95LatencyMs).toFixed(1);
  const deltaAvail = +(metricsB.reliability.compositeAvailabilityPct - metricsA.reliability.compositeAvailabilityPct).toFixed(4);
  const deltaHeadroom = +(metricsB.capacity.cpuHeadroomPct - metricsA.capacity.cpuHeadroomPct).toFixed(1);
  const deltaPower = +(metricsB.dataCenter.itPowerDrawKw - metricsA.dataCenter.itPowerDrawKw).toFixed(2);
  const deltaMttr = +(metricsB.reliability.mttrMinutes - metricsA.reliability.mttrMinutes).toFixed(1);

  // Complexity score (based on node types, regions, links)
  const complexityA = Math.min(10, Math.round(
    archA.computeNodes.length + archA.databaseNodes.length + (archA.regions.length * 2) + (archA.links.length)
  ));
  const complexityB = Math.min(10, Math.round(
    archB.computeNodes.length + archB.databaseNodes.length + (archB.regions.length * 2) + (archB.links.length)
  ));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-400" />
              <h2 className="text-base font-semibold text-white">Architecture Comparison Matrix</h2>
              <span className="text-xs text-neutral-500 font-mono">
                · Branch A vs Branch B Multi-Dimensional Diff
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
              Evaluate architecture decisions across cost, reliability, performance, complexity, recovery, and operational burden.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCloneAToB}
              className="px-3 py-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded border border-neutral-700 flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-neutral-400" />
              <span>Clone Branch A to B</span>
            </button>
            <button
              onClick={() => onPromoteArchB(archB)}
              className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Promote Branch B to Active</span>
            </button>
          </div>
        </div>

        {/* Branch Selector Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 pt-4 border-t border-neutral-800/80">
          <div className="bg-neutral-950/70 border border-neutral-800/80 rounded p-3">
            <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider block mb-1">
              Branch A (Active Baseline)
            </span>
            <div className="text-sm font-semibold text-white">{archA.name}</div>
            <div className="text-xs text-neutral-500 mt-0.5">
              {archA.regions.length} regions · {archA.computeNodes.reduce((a, c) => a + c.instances, 0)} compute units · {archA.databaseNodes.reduce((a, d) => a + d.readReplicas, 0)} DB replicas
            </div>
          </div>

          <div className="bg-neutral-950/70 border border-neutral-800/80 rounded p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider block">
                Branch B (Comparison Target)
              </span>
              <select
                value={archBKey}
                onChange={e => handleSelectPresetB(e.target.value)}
                className="text-xs bg-neutral-900 border border-neutral-800 text-neutral-200 rounded px-2 py-0.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="financial-core">Financial Core (Sync)</option>
                <option value="ecommerce-scale">E-Commerce Scale</option>
                <option value="ai-inference">AI Inference Pipeline</option>
                <option value="lean-startup">Lean Startup MVP</option>
              </select>
            </div>
            <div className="text-sm font-semibold text-white">{archB.name}</div>
            <div className="text-xs text-neutral-500 mt-0.5">
              {archB.regions.length} regions · {archB.computeNodes.reduce((a, c) => a + c.instances, 0)} compute units · {archB.databaseNodes.reduce((a, d) => a + d.readReplicas, 0)} DB replicas
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Detailed Metric Comparison Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-neutral-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Multi-Dimensional Comparison Matrix</h3>
          <span className="text-xs text-neutral-500 font-mono">Delta = Branch B - Branch A</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 bg-neutral-950/60 font-mono">
                <th className="py-2.5 px-4 font-normal">Dimension / Metric</th>
                <th className="py-2.5 px-4 font-normal">Branch A (Current)</th>
                <th className="py-2.5 px-4 font-normal">Branch B (Candidate)</th>
                <th className="py-2.5 px-4 font-normal text-right">Variance (Δ)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-mono tabular-nums text-neutral-300">
              {/* Cost */}
              <tr className="hover:bg-neutral-850/40">
                <td className="py-2.5 px-4 font-sans font-medium text-white flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Monthly Spend</span>
                </td>
                <td className="py-2.5 px-4">${metricsA.cost.monthlyTotal.toLocaleString()}/mo</td>
                <td className="py-2.5 px-4 text-white">${metricsB.cost.monthlyTotal.toLocaleString()}/mo</td>
                <td className="py-2.5 px-4 text-right">
                  <span className={deltaCost > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                    {deltaCost > 0 ? `+$${deltaCost.toLocaleString()}` : `-$${Math.abs(deltaCost).toLocaleString()}`}
                  </span>
                </td>
              </tr>

              {/* Latency p95 */}
              <tr className="hover:bg-neutral-850/40">
                <td className="py-2.5 px-4 font-sans font-medium text-white flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  <span>p95 Latency</span>
                </td>
                <td className="py-2.5 px-4">{metricsA.performance.p95LatencyMs} ms</td>
                <td className="py-2.5 px-4 text-white">{metricsB.performance.p95LatencyMs} ms</td>
                <td className="py-2.5 px-4 text-right">
                  <span className={deltaP95 > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                    {deltaP95 > 0 ? `+${deltaP95}ms` : `${deltaP95}ms`}
                  </span>
                </td>
              </tr>

              {/* Availability */}
              <tr className="hover:bg-neutral-850/40">
                <td className="py-2.5 px-4 font-sans font-medium text-white flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Composite Availability</span>
                </td>
                <td className="py-2.5 px-4">{metricsA.reliability.compositeAvailabilityPct}%</td>
                <td className="py-2.5 px-4 text-white">{metricsB.reliability.compositeAvailabilityPct}%</td>
                <td className="py-2.5 px-4 text-right">
                  <span className={deltaAvail >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {deltaAvail >= 0 ? `+${deltaAvail}%` : `${deltaAvail}%`}
                  </span>
                </td>
              </tr>

              {/* Capacity Headroom */}
              <tr className="hover:bg-neutral-850/40">
                <td className="py-2.5 px-4 font-sans font-medium text-white flex items-center gap-2">
                  <Gauge className="w-3.5 h-3.5 text-neutral-400" />
                  <span>CPU Safety Headroom</span>
                </td>
                <td className="py-2.5 px-4">{metricsA.capacity.cpuHeadroomPct}%</td>
                <td className="py-2.5 px-4 text-white">{metricsB.capacity.cpuHeadroomPct}%</td>
                <td className="py-2.5 px-4 text-right">
                  <span className={deltaHeadroom >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {deltaHeadroom >= 0 ? `+${deltaHeadroom}%` : `${deltaHeadroom}%`}
                  </span>
                </td>
              </tr>

              {/* MTTR */}
              <tr className="hover:bg-neutral-850/40">
                <td className="py-2.5 px-4 font-sans font-medium text-white">Mean Time to Recover (MTTR)</td>
                <td className="py-2.5 px-4">{metricsA.reliability.mttrMinutes} min</td>
                <td className="py-2.5 px-4 text-white">{metricsB.reliability.mttrMinutes} min</td>
                <td className="py-2.5 px-4 text-right">
                  <span className={deltaMttr <= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {deltaMttr <= 0 ? `${deltaMttr} min` : `+${deltaMttr} min`}
                  </span>
                </td>
              </tr>

              {/* IT Power & Heat */}
              <tr className="hover:bg-neutral-850/40">
                <td className="py-2.5 px-4 font-sans font-medium text-white flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-neutral-400" />
                  <span>IT Power Draw</span>
                </td>
                <td className="py-2.5 px-4">{metricsA.dataCenter.itPowerDrawKw} kW</td>
                <td className="py-2.5 px-4 text-white">{metricsB.dataCenter.itPowerDrawKw} kW</td>
                <td className="py-2.5 px-4 text-right">
                  <span className={deltaPower <= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {deltaPower <= 0 ? `${deltaPower} kW` : `+${deltaPower} kW`}
                  </span>
                </td>
              </tr>

              {/* Complexity Score */}
              <tr className="hover:bg-neutral-850/40">
                <td className="py-2.5 px-4 font-sans font-medium text-white">Architectural Complexity</td>
                <td className="py-2.5 px-4">{complexityA} / 10</td>
                <td className="py-2.5 px-4 text-white">{complexityB} / 10</td>
                <td className="py-2.5 px-4 text-right text-neutral-400">
                  {complexityB - complexityA > 0 ? `+${complexityB - complexityA}` : `${complexityB - complexityA}`}
                </td>
              </tr>

              {/* Operational Burden */}
              <tr className="hover:bg-neutral-850/40">
                <td className="py-2.5 px-4 font-sans font-medium text-white">Operational Burden (SRE)</td>
                <td className="py-2.5 px-4">
                  {archA.regions.length > 1 ? 'High (Multi-Region mesh)' : 'Moderate (Single-Region)'}
                </td>
                <td className="py-2.5 px-4 text-white">
                  {archB.regions.length > 1 ? 'High (Multi-Region mesh)' : 'Moderate (Single-Region)'}
                </td>
                <td className="py-2.5 px-4 text-right text-neutral-400">
                  {archB.regions.length > archA.regions.length ? 'Higher' : archB.regions.length < archA.regions.length ? 'Lower' : 'Parity'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
