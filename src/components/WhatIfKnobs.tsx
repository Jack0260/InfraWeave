import React from 'react';
import {
  InfrastructureArchitecture,
  SimulationResult,
} from '../types/infrastructure';
import {
  Activity,
  Plus,
  Minus,
  Database,
  Server,
  Zap,
  RotateCcw,
  Layers,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';

interface WhatIfKnobsProps {
  architecture: InfrastructureArchitecture;
  baseMetrics: SimulationResult;
  onChangeArchitecture: (newArch: InfrastructureArchitecture, actionSummary: string) => void;
  onResetToDefault: () => void;
}

export const WhatIfKnobs: React.FC<WhatIfKnobsProps> = ({
  architecture,
  baseMetrics,
  onChangeArchitecture,
  onResetToDefault,
}) => {
  const currentRps = architecture.traffic.ingressRps;
  const currentBurst = architecture.traffic.burstMultiplier;
  const primaryCompute = architecture.computeNodes[0];
  const primaryDb = architecture.databaseNodes[0];
  const primaryCache = architecture.cacheNodes[0];

  const handleTrafficChange = (newRps: number) => {
    const updated: InfrastructureArchitecture = JSON.parse(JSON.stringify(architecture));
    updated.traffic.ingressRps = Math.max(100, newRps);
    onChangeArchitecture(updated, `Adjusted traffic ingress to ${newRps.toLocaleString()} RPS`);
  };

  const handleBurstMultiplier = (mult: number) => {
    const updated: InfrastructureArchitecture = JSON.parse(JSON.stringify(architecture));
    updated.traffic.burstMultiplier = mult;
    onChangeArchitecture(updated, `Applied ${mult}x traffic burst multiplier`);
  };

  const handleComputeInstanceDelta = (delta: number) => {
    if (!primaryCompute) return;
    const updated: InfrastructureArchitecture = JSON.parse(JSON.stringify(architecture));
    const target = updated.computeNodes.find(c => c.id === primaryCompute.id);
    if (target) {
      target.instances = Math.max(1, target.instances + delta);
      onChangeArchitecture(
        updated,
        `${delta > 0 ? 'Scaled up' : 'Scaled down'} ${target.name} instances to ${target.instances}`
      );
    }
  };

  const handleDbReplicaDelta = (delta: number) => {
    if (!primaryDb) return;
    const updated: InfrastructureArchitecture = JSON.parse(JSON.stringify(architecture));
    const target = updated.databaseNodes.find(d => d.id === primaryDb.id);
    if (target) {
      target.readReplicas = Math.max(0, target.readReplicas + delta);
      onChangeArchitecture(
        updated,
        `${delta > 0 ? 'Added' : 'Removed'} DB read replica (total: ${target.readReplicas})`
      );
    }
  };

  const handleToggleDbSync = () => {
    if (!primaryDb) return;
    const updated: InfrastructureArchitecture = JSON.parse(JSON.stringify(architecture));
    const target = updated.databaseNodes.find(d => d.id === primaryDb.id);
    if (target) {
      target.replicationMode = target.replicationMode === 'sync' ? 'async' : 'sync';
      onChangeArchitecture(
        updated,
        `Switched database replication to ${target.replicationMode.toUpperCase()}`
      );
    }
  };

  const handleToggleCache = () => {
    if (!primaryCache) return;
    const updated: InfrastructureArchitecture = JSON.parse(JSON.stringify(architecture));
    const target = updated.cacheNodes.find(c => c.id === primaryCache.id);
    if (target) {
      target.enabled = !target.enabled;
      onChangeArchitecture(
        updated,
        `${target.enabled ? 'Enabled' : 'Bypassed/Disabled'} distributed cache tier`
      );
    }
  };

  const handleMoveComputeRack = () => {
    if (!primaryCompute || architecture.racks.length <= 1) return;
    const updated: InfrastructureArchitecture = JSON.parse(JSON.stringify(architecture));
    const target = updated.computeNodes.find(c => c.id === primaryCompute.id);
    if (target) {
      const currentRackIdx = architecture.racks.findIndex(r => r.id === target.rackId);
      const nextRack = architecture.racks[(currentRackIdx + 1) % architecture.racks.length];
      target.rackId = nextRack.id;
      onChangeArchitecture(
        updated,
        `Relocated ${target.name} to rack ${nextRack.code}`
      );
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3 border-b border-neutral-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">What Happens If I Change This?</h2>
          <span className="text-xs text-neutral-500 hidden sm:inline">
            · Real-time parametric simulation
          </span>
        </div>
        <button
          onClick={onResetToDefault}
          className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Model</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Knob 1: Traffic Scale & Burst */}
        <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-md p-3">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
            <span className="flex items-center gap-1.5 font-medium text-neutral-200">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Traffic Workload
            </span>
            <span className="font-mono tabular-nums text-cyan-300 font-semibold">
              {(currentRps * currentBurst).toLocaleString()} RPS
            </span>
          </div>

          <input
            type="range"
            min={1000}
            max={60000}
            step={1000}
            value={currentRps}
            aria-label="Traffic Ingress RPS"
            onChange={e => handleTrafficChange(Number(e.target.value))}
            className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 mb-2"
          />

          <div className="flex items-center justify-between gap-1 text-[11px]">
            <span className="text-neutral-500">Multiplier:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 5, 10].map(mult => (
                <button
                  key={mult}
                  onClick={() => handleBurstMultiplier(mult)}
                  className={`px-1.5 py-0.5 rounded font-mono text-[11px] transition-colors ${
                    currentBurst === mult
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {mult}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Knob 2: Compute Node Capacity */}
        <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-md p-3">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span className="flex items-center gap-1.5 font-medium text-neutral-200">
              <Server className="w-3.5 h-3.5 text-indigo-400" />
              Compute Instances
            </span>
            <span className="font-mono tabular-nums text-white font-semibold">
              {primaryCompute?.instances ?? 1} units
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 mt-2">
            <button
              onClick={() => handleComputeInstanceDelta(-1)}
              disabled={!primaryCompute || primaryCompute.instances <= 1}
              className="flex-1 py-1 px-2 text-xs bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-300 rounded flex items-center justify-center gap-1 transition-colors"
            >
              <Minus className="w-3 h-3" />
              <span>Remove Node</span>
            </button>
            <button
              onClick={() => handleComputeInstanceDelta(1)}
              className="flex-1 py-1 px-2 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded flex items-center justify-center gap-1 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Add Node</span>
            </button>
          </div>
          <div className="mt-2 text-[11px] text-neutral-500 font-mono">
            {primaryCompute ? `${primaryCompute.vCpuPerInstance * primaryCompute.instances} vCPUs · ${primaryCompute.ramGbPerInstance * primaryCompute.instances} GB RAM` : 'None'}
          </div>
        </div>

        {/* Knob 3: Database Replicas & Replication */}
        <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-md p-3">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span className="flex items-center gap-1.5 font-medium text-neutral-200">
              <Database className="w-3.5 h-3.5 text-amber-400" />
              Database Replicas
            </span>
            <span className="font-mono tabular-nums text-white font-semibold">
              {primaryDb?.readReplicas ?? 0} replicas
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 flex-1">
              <button
                onClick={() => handleDbReplicaDelta(-1)}
                disabled={!primaryDb || primaryDb.readReplicas <= 0}
                className="py-1 px-2 text-xs bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-300 rounded flex-1 flex items-center justify-center transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleDbReplicaDelta(1)}
                className="py-1 px-2 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded flex-1 flex items-center justify-center transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <button
              onClick={handleToggleDbSync}
              className={`px-2 py-1 text-xs rounded font-mono transition-colors ${
                primaryDb?.replicationMode === 'sync'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {primaryDb?.replicationMode.toUpperCase()}
            </button>
          </div>
          <div className="mt-2 text-[11px] text-neutral-500">
            {primaryDb?.replicationMode === 'sync' ? 'Sync: Zero RPO, +4ms commit' : 'Async: High QPS, <30ms WAL lag'}
          </div>
        </div>

        {/* Knob 4: Cache Layer & Rack Placement */}
        <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-md p-3">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span className="flex items-center gap-1.5 font-medium text-neutral-200">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              Cache & Rack Routing
            </span>
            <span className="font-mono text-white text-xs">
              {primaryCache?.enabled ? 'Active' : 'Bypassed'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              onClick={handleToggleCache}
              className={`flex-1 py-1 px-2 text-xs rounded transition-colors ${
                primaryCache?.enabled
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {primaryCache?.enabled ? 'Disable Cache' : 'Enable Cache'}
            </button>

            {architecture.racks.length > 1 && (
              <button
                onClick={handleMoveComputeRack}
                className="py-1 px-2 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded flex items-center gap-1 transition-colors"
                title="Move workload to another physical rack"
              >
                <span>Move Rack</span>
                <ArrowRight className="w-3 h-3 text-neutral-400" />
              </button>
            )}
          </div>

          <div className="mt-2 text-[11px] text-neutral-500 truncate">
            {primaryCompute ? `Placed on ${architecture.racks.find(r => r.id === primaryCompute.rackId)?.code ?? 'Rack'}` : ''}
          </div>
        </div>
      </div>
    </div>
  );
};
