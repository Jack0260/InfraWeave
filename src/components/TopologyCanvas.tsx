import React from 'react';
import {
  InfrastructureArchitecture,
  ComputeNode,
  DatabaseNode,
  CacheNode,
  QueueNode,
  StorageNode,
} from '../types/infrastructure';
import {
  Server,
  Database,
  Zap,
  Layers,
  HardDrive,
  Plus,
  Cpu,
  MapPin,
  Settings,
  Trash2,
  Activity,
  ArrowRight,
} from 'lucide-react';

interface TopologyCanvasProps {
  architecture: InfrastructureArchitecture;
  onSelectNode: (nodeType: string, nodeId: string) => void;
  onAddNode: (type: 'compute' | 'database' | 'cache' | 'queue' | 'storage') => void;
  onDeleteNode: (type: string, id: string) => void;
  selectedNodeId: string | null;
}

export const TopologyCanvas: React.FC<TopologyCanvasProps> = ({
  architecture,
  onSelectNode,
  onAddNode,
  onDeleteNode,
  selectedNodeId,
}) => {
  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-lg p-5 flex flex-col">
      {/* Canvas Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-neutral-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white">Physical & Logical Topology Graph</h2>
            <span className="text-xs text-neutral-500">
              · Interactive Architecture Canvas
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Nodes grouped by Cloud Region & Data Center Rack. Click any component to inspect and calibrate parameters.
          </p>
        </div>

        {/* Add Node Palette Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-neutral-500 mr-1">Add:</span>
          <button
            onClick={() => onAddNode('compute')}
            className="px-2.5 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded border border-neutral-700 flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3 text-cyan-400" />
            <span>Compute</span>
          </button>
          <button
            onClick={() => onAddNode('database')}
            className="px-2.5 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded border border-neutral-700 flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3 text-amber-400" />
            <span>Database</span>
          </button>
          <button
            onClick={() => onAddNode('cache')}
            className="px-2.5 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded border border-neutral-700 flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3 text-emerald-400" />
            <span>Cache</span>
          </button>
          <button
            onClick={() => onAddNode('queue')}
            className="px-2.5 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded border border-neutral-700 flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3 text-purple-400" />
            <span>Queue</span>
          </button>
          <button
            onClick={() => onAddNode('storage')}
            className="px-2.5 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded border border-neutral-700 flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3 text-blue-400" />
            <span>Storage</span>
          </button>
        </div>
      </div>

      {/* Traffic Ingress Indicator Banner */}
      <div className="mb-4 bg-neutral-950/80 border border-neutral-800 rounded-md p-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-cyan-300 font-mono">
          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>Ingress Gateway</span>
          <span className="text-neutral-500">→</span>
          <span>{architecture.traffic.ingressRps.toLocaleString()} RPS Baseline</span>
          <span className="text-neutral-500">·</span>
          <span>{(architecture.traffic.readWriteRatio * 100).toFixed(0)}% Reads</span>
          <span className="text-neutral-500">·</span>
          <span>{architecture.traffic.payloadSizeKb} KB Payload</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-neutral-400 text-[11px]">
          <span>Flow Routing: Anycast DNS → Region → ToR Switch → Microservice</span>
        </div>
      </div>

      {/* Region Groups */}
      <div className="space-y-6">
        {architecture.regions.map(region => {
          const regionRacks = architecture.racks.filter(r => r.regionId === region.id);

          return (
            <div
              key={region.id}
              className="bg-neutral-950/50 border border-neutral-800 rounded-lg p-4 relative"
            >
              {/* Region Label */}
              <div className="flex items-center justify-between mb-3 border-b border-neutral-800/60 pb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold text-white tracking-wide">
                    {region.name}
                  </span>
                  <span className="text-xs font-mono text-neutral-500">
                    ({region.code})
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    · Power: ${region.gridPowerCostKwh}/kWh · {region.carbonGramsKwh}g CO2/kWh · {region.ambientTempC}°C
                  </span>
                </div>
              </div>

              {/* Racks Grid within Region */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {regionRacks.map(rack => {
                  // Find all nodes assigned to this rack
                  const compNodes = architecture.computeNodes.filter(c => c.rackId === rack.id);
                  const dbNodes = architecture.databaseNodes.filter(d => d.rackId === rack.id);
                  const cacheNodes = architecture.cacheNodes.filter(c => c.rackId === rack.id);
                  const queueNodes = architecture.queueNodes.filter(q => q.rackId === rack.id);

                  // Calculate rack total power
                  let rackWatts = 0;
                  compNodes.forEach(c => (rackWatts += c.instances * c.powerWattsPerUnit));
                  dbNodes.forEach(d => (rackWatts += (d.primaryInstances + d.readReplicas) * d.powerWatts));
                  cacheNodes.forEach(c => c.enabled && (rackWatts += c.nodes * c.powerWatts));
                  queueNodes.forEach(q => (rackWatts += q.powerWatts));
                  const rackKw = +(rackWatts / 1000).toFixed(2);
                  const isOverload = rackKw > rack.maxPowerKw;

                  return (
                    <div
                      key={rack.id}
                      className={`bg-neutral-900 border rounded-md p-3 flex flex-col transition-all ${
                        isOverload
                          ? 'border-rose-500/80 shadow-sm shadow-rose-950'
                          : 'border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      {/* Rack Header */}
                      <div className="flex items-center justify-between mb-3 text-xs border-b border-neutral-800/60 pb-1.5">
                        <div className="flex items-center gap-1.5 font-medium text-neutral-200">
                          <Server className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{rack.code}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono tabular-nums text-[11px]">
                          <span className={isOverload ? 'text-rose-400 font-bold' : 'text-neutral-400'}>
                            {rackKw} / {rack.maxPowerKw} kW
                          </span>
                          <span className="text-neutral-500">· {rack.pduRedundancy}</span>
                        </div>
                      </div>

                      {/* Node List inside Rack */}
                      <div className="space-y-2 flex-1">
                        {/* Compute Nodes */}
                        {compNodes.map(node => (
                          <div
                            key={node.id}
                            onClick={() => onSelectNode('compute', node.id)}
                            className={`p-2.5 rounded border text-xs cursor-pointer transition-all ${
                              selectedNodeId === node.id
                                ? 'bg-cyan-950/40 border-cyan-500 text-white'
                                : 'bg-neutral-950/80 border-neutral-800/80 text-neutral-300 hover:border-cyan-500/50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 font-medium">
                                <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                <span className="truncate">{node.name}</span>
                              </div>
                              <span className="font-mono tabular-nums text-cyan-300 text-[11px]">
                                {node.instances}x units
                              </span>
                            </div>
                            <div className="mt-1 text-[11px] text-neutral-500 font-mono flex items-center justify-between">
                              <span>
                                {node.vCpuPerInstance} vCPU · {node.ramGbPerInstance} GB · ${node.unitCostPerHour}/hr
                              </span>
                              <span>{node.powerWattsPerUnit * node.instances}W</span>
                            </div>
                          </div>
                        ))}

                        {/* Database Nodes */}
                        {dbNodes.map(node => (
                          <div
                            key={node.id}
                            onClick={() => onSelectNode('database', node.id)}
                            className={`p-2.5 rounded border text-xs cursor-pointer transition-all ${
                              selectedNodeId === node.id
                                ? 'bg-amber-950/40 border-amber-500 text-white'
                                : 'bg-neutral-950/80 border-neutral-800/80 text-neutral-300 hover:border-amber-500/50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 font-medium">
                                <Database className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span className="truncate">{node.name}</span>
                              </div>
                              <span className="font-mono tabular-nums text-amber-300 text-[11px]">
                                1P + {node.readReplicas}R ({node.replicationMode})
                              </span>
                            </div>
                            <div className="mt-1 text-[11px] text-neutral-500 font-mono flex items-center justify-between">
                              <span>
                                {node.storageGb}GB · {node.iopsProvisioned} IOPS
                              </span>
                              <span>{node.powerWatts * (1 + node.readReplicas)}W</span>
                            </div>
                          </div>
                        ))}

                        {/* Cache Nodes */}
                        {cacheNodes.map(node => (
                          <div
                            key={node.id}
                            onClick={() => onSelectNode('cache', node.id)}
                            className={`p-2.5 rounded border text-xs cursor-pointer transition-all ${
                              selectedNodeId === node.id
                                ? 'bg-emerald-950/40 border-emerald-500 text-white'
                                : 'bg-neutral-950/80 border-neutral-800/80 text-neutral-300 hover:border-emerald-500/50'
                            } ${!node.enabled ? 'opacity-50 line-through' : ''}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 font-medium">
                                <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span className="truncate">{node.name}</span>
                              </div>
                              <span className="font-mono tabular-nums text-emerald-300 text-[11px]">
                                {node.enabled ? `${node.nodes}x (${(node.hitRateTarget * 100).toFixed(0)}% hit)` : 'Disabled'}
                              </span>
                            </div>
                            <div className="mt-1 text-[11px] text-neutral-500 font-mono flex items-center justify-between">
                              <span>
                                {node.ramGbPerNode * node.nodes}GB RAM · ${node.unitCostPerHour}/hr
                              </span>
                              <span>{node.enabled ? `${node.powerWatts * node.nodes}W` : '0W'}</span>
                            </div>
                          </div>
                        ))}

                        {/* Queue Nodes */}
                        {queueNodes.map(node => (
                          <div
                            key={node.id}
                            onClick={() => onSelectNode('queue', node.id)}
                            className={`p-2.5 rounded border text-xs cursor-pointer transition-all ${
                              selectedNodeId === node.id
                                ? 'bg-purple-950/40 border-purple-500 text-white'
                                : 'bg-neutral-950/80 border-neutral-800/80 text-neutral-300 hover:border-purple-500/50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 font-medium">
                                <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                <span className="truncate">{node.name}</span>
                              </div>
                              <span className="font-mono tabular-nums text-purple-300 text-[11px]">
                                {node.partitions} part.
                              </span>
                            </div>
                            <div className="mt-1 text-[11px] text-neutral-500 font-mono flex items-center justify-between">
                              <span>
                                {node.throughputMsgPerSec.toLocaleString()} msg/s · {node.retentionHours}h
                              </span>
                              <span>{node.powerWatts}W</span>
                            </div>
                          </div>
                        ))}

                        {compNodes.length === 0 &&
                          dbNodes.length === 0 &&
                          cacheNodes.length === 0 &&
                          queueNodes.length === 0 && (
                            <div className="py-6 text-center text-xs text-neutral-600">
                              No components assigned to this rack
                            </div>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Regional Storage Nodes */}
              {architecture.storageNodes.filter(s => s.regionId === region.id).length > 0 && (
                <div className="mt-4 pt-3 border-t border-neutral-800/60">
                  <div className="text-xs text-neutral-400 mb-2 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                    <span>Regional Storage & Object Stores</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {architecture.storageNodes
                      .filter(s => s.regionId === region.id)
                      .map(store => (
                        <div
                          key={store.id}
                          onClick={() => onSelectNode('storage', store.id)}
                          className={`p-2.5 rounded border text-xs cursor-pointer ${
                            selectedNodeId === store.id
                              ? 'bg-blue-950/40 border-blue-500 text-white'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-blue-500/50'
                          }`}
                        >
                          <div className="flex items-center justify-between font-medium">
                            <span className="truncate">{store.name}</span>
                            <span className="font-mono text-blue-300">{store.sizeTb} TB</span>
                          </div>
                          <div className="mt-1 text-[11px] text-neutral-500 font-mono flex items-center justify-between">
                            <span>
                              ${store.costPerGbMonth}/GB · {store.durabilityNines} 9s durability
                            </span>
                            <span>{store.egressGbPerMonth} GB egress</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
