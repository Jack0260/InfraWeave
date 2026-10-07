import React from 'react';
import { SimulationResult } from '../types/infrastructure';
import { DollarSign, Clock, Gauge, ShieldCheck, Zap, AlertTriangle } from 'lucide-react';

interface MetricsBarProps {
  metrics: SimulationResult;
  onOpenBottleneckInspector?: () => void;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({ metrics, onOpenBottleneckInspector }) => {
  const { cost, performance, capacity, reliability, dataCenter } = metrics;

  const hasRackOverload = dataCenter.rackStatus.some(r => r.isOverloaded);
  const sloColor =
    reliability.sloStatus === 'healthy'
      ? 'text-emerald-400'
      : reliability.sloStatus === 'at-risk'
      ? 'text-amber-400'
      : 'text-rose-400';

  return (
    <div className="border-b border-neutral-800 bg-neutral-900/60 px-4 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Metric 1: Monthly & Hourly Cost */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <DollarSign className="w-3.5 h-3.5 text-neutral-400" />
            <span>Estimated Cost</span>
          </div>
          <div className="mt-0.5 text-sm font-semibold font-mono tabular-nums text-white">
            ${cost.monthlyTotal.toLocaleString()}
            <span className="text-xs text-neutral-400 font-normal ml-1">/mo</span>
          </div>
          <div className="text-[11px] text-neutral-500 font-mono tabular-nums">
            ${cost.hourlyTotal}/hr · ${cost.annualTotal.toLocaleString()}/yr
          </div>
        </div>

        {/* Metric 2: Latency Spectrum */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            <span>Latency (p95)</span>
          </div>
          <div className="mt-0.5 text-sm font-semibold font-mono tabular-nums text-white">
            {performance.p95LatencyMs}
            <span className="text-xs text-neutral-400 font-normal ml-1">ms</span>
          </div>
          <div className="text-[11px] text-neutral-500 font-mono tabular-nums">
            p50: {performance.p50LatencyMs}ms · p99: {performance.p99LatencyMs}ms
          </div>
        </div>

        {/* Metric 3: Capacity Headroom */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Gauge className="w-3.5 h-3.5 text-neutral-400" />
            <span>CPU Headroom</span>
          </div>
          <div className="mt-0.5 text-sm font-semibold font-mono tabular-nums text-white flex items-center gap-2">
            <span className={capacity.cpuHeadroomPct < 20 ? 'text-rose-400' : 'text-emerald-400'}>
              {capacity.cpuHeadroomPct}%
            </span>
            <span className="text-xs text-neutral-500 font-normal">
              ({capacity.cpuUtilizationPct}% used)
            </span>
          </div>
          <div className="text-[11px] text-neutral-500 font-mono tabular-nums">
            IOPS buffer: {capacity.iopsHeadroomPct}% · RAM: {capacity.memoryHeadroomPct}%
          </div>
        </div>

        {/* Metric 4: Availability & SLO */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
            <span>Availability SLO</span>
          </div>
          <div className="mt-0.5 text-sm font-semibold font-mono tabular-nums text-white flex items-center gap-2">
            <span className={sloColor}>{reliability.compositeAvailabilityPct}%</span>
            <span className="text-xs text-neutral-400 font-normal">
              ({reliability.availabilityNines} 9s)
            </span>
          </div>
          <div className="text-[11px] text-neutral-500 font-mono tabular-nums">
            MTTR: {reliability.mttrMinutes}m · Budget burn: {reliability.errorBudgetConsumedPct}%
          </div>
        </div>

        {/* Metric 5: Data Center Power & Heat */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Zap className="w-3.5 h-3.5 text-neutral-400" />
            <span>IT Power & Heat</span>
          </div>
          <div className="mt-0.5 text-sm font-semibold font-mono tabular-nums text-white">
            {dataCenter.itPowerDrawKw}
            <span className="text-xs text-neutral-400 font-normal ml-1">kW</span>
            <span className="text-xs text-neutral-500 ml-1.5 font-normal">
              (PUE {dataCenter.pueEffective})
            </span>
          </div>
          <div className="text-[11px] text-neutral-500 font-mono tabular-nums">
            {dataCenter.totalBtuPerHour.toLocaleString()} BTU/hr · {dataCenter.coolingHeadroomPct}% cool buffer
          </div>
        </div>

        {/* Metric 6: Bottlenecks & Blast Radius */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <AlertTriangle className="w-3.5 h-3.5 text-neutral-400" />
            <span>Failure Risk</span>
          </div>
          <div className="mt-0.5 text-sm font-semibold font-mono tabular-nums text-white flex items-center gap-2">
            <span className={reliability.blastRadiusScore > 50 ? 'text-rose-400' : 'text-emerald-400'}>
              {reliability.blastRadiusScore}
              <span className="text-xs font-normal text-neutral-500">/100 score</span>
            </span>
          </div>
          <div className="text-[11px] text-neutral-400 truncate">
            {reliability.singlePointsOfFailure.length > 0 ? (
              <span className="text-amber-400">
                {reliability.singlePointsOfFailure.length} SPOF identified
              </span>
            ) : hasRackOverload ? (
              <span className="text-rose-400">Rack PDU over capacity</span>
            ) : (
              <span className="text-neutral-500">No critical SPOFs</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
