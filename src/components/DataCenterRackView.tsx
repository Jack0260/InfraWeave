import React from 'react';
import {
  InfrastructureArchitecture,
  SimulationResult,
} from '../types/infrastructure';
import { Server, Zap, Thermometer, Wind, AlertTriangle, ShieldCheck } from 'lucide-react';

interface DataCenterRackViewProps {
  architecture: InfrastructureArchitecture;
  metrics: SimulationResult;
}

export const DataCenterRackView: React.FC<DataCenterRackViewProps> = ({
  architecture,
  metrics,
}) => {
  const { dataCenter } = metrics;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-400" />
              <h2 className="text-base font-semibold text-white">Data Center Facility & Power Plane</h2>
              <span className="text-xs text-neutral-500 font-mono">
                · Physical 42U Racks, PDUs, Thermal Dissipation & PUE
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
              Transparent physical modeling converting compute workload into thermal cooling demand (1 kW = 3,412.14 BTU/hr)
              and verifying rack PDU electrical boundaries.
            </p>
          </div>
        </div>

        {/* High-level Facilities KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-neutral-800/80 text-xs">
          <div className="bg-neutral-950/70 border border-neutral-800/80 rounded p-2.5">
            <span className="text-neutral-500 block mb-0.5">Total IT Load</span>
            <div className="text-sm font-semibold font-mono text-white tabular-nums">
              {dataCenter.itPowerDrawKw} kW
            </div>
            <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
              Facility: {dataCenter.facilityPowerDrawKw} kW (PUE {dataCenter.pueEffective})
            </div>
          </div>

          <div className="bg-neutral-950/70 border border-neutral-800/80 rounded p-2.5">
            <span className="text-neutral-500 block mb-0.5">Thermal Output</span>
            <div className="text-sm font-semibold font-mono text-white tabular-nums">
              {dataCenter.totalBtuPerHour.toLocaleString()} BTU/hr
            </div>
            <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
              Cooling Headroom: {dataCenter.coolingHeadroomPct}%
            </div>
          </div>

          <div className="bg-neutral-950/70 border border-neutral-800/80 rounded p-2.5">
            <span className="text-neutral-500 block mb-0.5">Carbon Footprint</span>
            <div className="text-sm font-semibold font-mono text-white tabular-nums">
              {dataCenter.carbonFootprintKgPerMonth.toLocaleString()} kg CO2/mo
            </div>
            <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
              Scope 2 Electricity
            </div>
          </div>

          <div className="bg-neutral-950/70 border border-neutral-800/80 rounded p-2.5">
            <span className="text-neutral-500 block mb-0.5">Rack PDU Status</span>
            <div className="text-sm font-semibold font-mono text-white tabular-nums flex items-center gap-1.5">
              {dataCenter.rackStatus.some(r => r.isOverloaded) ? (
                <span className="text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Overload Detected
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Within Safe Thresholds
                </span>
              )}
            </div>
            <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
              {dataCenter.rackStatus.length} physical racks provisioned
            </div>
          </div>
        </div>
      </div>

      {/* 42U Server Racks Elevation Diagrams */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-white mb-1">Physical 42U Rack Elevations</h3>
        <p className="text-xs text-neutral-400 mb-4">
          Visualizing equipment slotting, PDU dual-feed power loading, and rack space occupancy.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dataCenter.rackStatus.map(rack => {
            const rackObj = architecture.racks.find(r => r.id === rack.rackId);
            const compNodes = architecture.computeNodes.filter(c => c.rackId === rack.rackId);
            const dbNodes = architecture.databaseNodes.filter(d => d.rackId === rack.rackId);
            const cacheNodes = architecture.cacheNodes.filter(c => c.rackId === rack.rackId);

            return (
              <div
                key={rack.rackId}
                className={`bg-neutral-950 border rounded-lg p-4 flex flex-col ${
                  rack.isOverloaded ? 'border-rose-500/80' : 'border-neutral-800'
                }`}
              >
                {/* Rack Title & Power Bar */}
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{rack.rackCode}</span>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400">
                    {rack.regionCode}
                  </span>
                </div>

                {/* Power Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                    <span className="text-neutral-400">PDU Load:</span>
                    <span className={rack.isOverloaded ? 'text-rose-400 font-bold' : 'text-neutral-300'}>
                      {rack.usedKw} / {rack.maxKw} kW ({rack.utilizationPct}%)
                    </span>
                  </div>
                  <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        rack.isOverloaded
                          ? 'bg-rose-500'
                          : rack.utilizationPct > 80
                          ? 'bg-amber-500'
                          : 'bg-cyan-500'
                      }`}
                      style={{ width: `${Math.min(100, rack.utilizationPct)}%` }}
                    />
                  </div>
                </div>

                {/* 42U Visual Chassis Column */}
                <div className="border border-neutral-800 bg-neutral-900/90 rounded p-2 flex flex-col space-y-1.5 font-mono text-[11px]">
                  {/* Top of Rack Switch (ToR) */}
                  <div className="bg-neutral-800 border border-neutral-700/80 p-1.5 rounded text-neutral-300 flex items-center justify-between">
                    <span>U42: ToR 100GbE Switch A/B</span>
                    <span className="text-neutral-500">1U</span>
                  </div>

                  {/* Compute Slots */}
                  {compNodes.map(c => (
                    <div
                      key={c.id}
                      className="bg-cyan-950/40 border border-cyan-800/50 p-1.5 rounded text-cyan-200 flex items-center justify-between"
                    >
                      <span className="truncate">{c.name} ({c.instances} units)</span>
                      <span className="text-cyan-400 shrink-0 font-mono">
                        {c.instances * 1}U · {(c.instances * c.powerWattsPerUnit)}W
                      </span>
                    </div>
                  ))}

                  {/* Database Slots */}
                  {dbNodes.map(d => (
                    <div
                      key={d.id}
                      className="bg-amber-950/40 border border-amber-800/50 p-1.5 rounded text-amber-200 flex items-center justify-between"
                    >
                      <span className="truncate">{d.name}</span>
                      <span className="text-amber-400 shrink-0 font-mono">
                        {(1 + d.readReplicas) * 2}U · {(1 + d.readReplicas) * d.powerWatts}W
                      </span>
                    </div>
                  ))}

                  {/* Cache Slots */}
                  {cacheNodes.filter(c => c.enabled).map(c => (
                    <div
                      key={c.id}
                      className="bg-emerald-950/40 border border-emerald-800/50 p-1.5 rounded text-emerald-200 flex items-center justify-between"
                    >
                      <span className="truncate">{c.name} ({c.nodes}x)</span>
                      <span className="text-emerald-400 shrink-0 font-mono">
                        {c.nodes}U · {c.nodes * c.powerWatts}W
                      </span>
                    </div>
                  ))}

                  {/* Empty Space Filler */}
                  <div className="border border-dashed border-neutral-800 p-2 text-center text-neutral-600 rounded">
                    {Math.max(0, 42 - (rack.assignedUnitsU + 1))}U Unallocated Chassis Space
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-neutral-500 font-mono flex items-center justify-between">
                  <span>PDU Feed: {rackObj?.pduRedundancy || 'dual-A/B'}</span>
                  <span>Occupancy: {rack.assignedUnitsU + 1} / 42 U</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
