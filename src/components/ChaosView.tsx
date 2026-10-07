import React, { useState } from 'react';
import {
  InfrastructureArchitecture,
  ChaosTriggerType,
  ChaosExperimentReport,
} from '../types/infrastructure';
import { runChaosExperiment } from '../simulator/chaos';
import {
  Zap,
  Play,
  RotateCcw,
  AlertOctagon,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Server,
  Layers,
  Activity,
  Cpu,
} from 'lucide-react';

interface ChaosViewProps {
  architecture: InfrastructureArchitecture;
}

export const ChaosView: React.FC<ChaosViewProps> = ({ architecture }) => {
  const [selectedTrigger, setSelectedTrigger] = useState<ChaosTriggerType>('node-failure');
  const [report, setReport] = useState<ChaosExperimentReport>(() =>
    runChaosExperiment(architecture, 'node-failure')
  );
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  const handleRunExperiment = (trigger: ChaosTriggerType) => {
    setSelectedTrigger(trigger);
    const newReport = runChaosExperiment(architecture, trigger);
    setReport(newReport);
    setActiveStepIndex(0);
  };

  const currentStep = report.steps[activeStepIndex] || report.steps[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-semibold text-white">Failure Simulation & Chaos Cascades</h2>
              <span className="text-xs text-neutral-500 font-mono">
                · Blast Radius & Sequence Dynamics
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
              Inject deterministic infrastructure faults to uncover cascading dependencies, queue saturation, and MTTR
              failover timings before incidents occur in production.
            </p>
          </div>
        </div>

        {/* Chaos Experiment Triggers */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-4 pt-3 border-t border-neutral-800/80">
          <button
            onClick={() => handleRunExperiment('node-failure')}
            className={`p-2.5 rounded text-left border text-xs transition-all ${
              selectedTrigger === 'node-failure'
                ? 'bg-amber-950/40 border-amber-500 text-white shadow-sm'
                : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div className="font-semibold truncate">Node SIGKILL</div>
            <div className="text-[11px] text-neutral-500 mt-0.5">Instance Crash</div>
          </button>

          <button
            onClick={() => handleRunExperiment('rack-failure')}
            className={`p-2.5 rounded text-left border text-xs transition-all ${
              selectedTrigger === 'rack-failure'
                ? 'bg-amber-950/40 border-amber-500 text-white shadow-sm'
                : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div className="font-semibold truncate">Rack PDU Trip</div>
            <div className="text-[11px] text-neutral-500 mt-0.5">Power Zone Loss</div>
          </button>

          <button
            onClick={() => handleRunExperiment('region-failure')}
            className={`p-2.5 rounded text-left border text-xs transition-all ${
              selectedTrigger === 'region-failure'
                ? 'bg-amber-950/40 border-amber-500 text-white shadow-sm'
                : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div className="font-semibold truncate">Region Transit Loss</div>
            <div className="text-[11px] text-neutral-500 mt-0.5">Backbone Blackhole</div>
          </button>

          <button
            onClick={() => handleRunExperiment('database-primary-failure')}
            className={`p-2.5 rounded text-left border text-xs transition-all ${
              selectedTrigger === 'database-primary-failure'
                ? 'bg-amber-950/40 border-amber-500 text-white shadow-sm'
                : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div className="font-semibold truncate">DB Primary Crash</div>
            <div className="text-[11px] text-neutral-500 mt-0.5">Leader Election</div>
          </button>

          <button
            onClick={() => handleRunExperiment('network-degradation')}
            className={`p-2.5 rounded text-left border text-xs transition-all ${
              selectedTrigger === 'network-degradation'
                ? 'bg-amber-950/40 border-amber-500 text-white shadow-sm'
                : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div className="font-semibold truncate">Transit Degradation</div>
            <div className="text-[11px] text-neutral-500 mt-0.5">120ms, 8% Drop</div>
          </button>

          <button
            onClick={() => handleRunExperiment('traffic-spike')}
            className={`p-2.5 rounded text-left border text-xs transition-all ${
              selectedTrigger === 'traffic-spike'
                ? 'bg-amber-950/40 border-amber-500 text-white shadow-sm'
                : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div className="font-semibold truncate">5x Traffic Surge</div>
            <div className="text-[11px] text-neutral-500 mt-0.5">Flash Burst</div>
          </button>
        </div>
      </div>

      {/* Interactive Timeline Cascade Playback */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Cascade Progression Timeline</h3>
            <span className="text-xs text-neutral-500">
              · Target: {report.targetName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">Step {activeStepIndex + 1} of {report.steps.length}</span>
          </div>
        </div>

        {/* Step Buttons Scrubber */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {report.steps.map((step, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStepIndex(idx)}
              className={`p-2.5 rounded border text-left text-xs transition-all ${
                activeStepIndex === idx
                  ? 'bg-cyan-950/50 border-cyan-500 text-white'
                  : 'bg-neutral-950/70 border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <div className="flex items-center justify-between font-mono text-[11px] text-neutral-500 mb-1">
                <span>T+{step.timeOffsetSec}s</span>
                <span
                  className={
                    step.severity === 'critical'
                      ? 'text-rose-400'
                      : step.severity === 'warning'
                      ? 'text-amber-400'
                      : step.severity === 'recovery'
                      ? 'text-emerald-400'
                      : 'text-neutral-400'
                  }
                >
                  {step.severity.toUpperCase()}
                </span>
              </div>
              <div className="font-medium truncate text-white">{step.headline}</div>
            </button>
          ))}
        </div>

        {/* Current Step Detailed Snapshot */}
        {currentStep && (
          <div className="bg-neutral-950 border border-neutral-800/80 rounded-lg p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
              <div>
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">
                  Timeline Offset: T+{currentStep.timeOffsetSec} Seconds
                </span>
                <h4 className="text-base font-semibold text-white mt-0.5">{currentStep.headline}</h4>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-neutral-500">Affected:</span>
                {currentStep.affectedComponents.map((c, i) => (
                  <span key={i} className="text-neutral-300 font-mono text-[11px] bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed mb-4">
              {currentStep.description}
            </p>

            {/* Step Live Metrics Snapshot */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-neutral-800/80 text-xs">
              <div className="bg-neutral-900/80 p-2 rounded border border-neutral-800">
                <div className="text-[11px] text-neutral-500">Effective RPS</div>
                <div className="font-mono font-semibold text-white mt-0.5 tabular-nums">
                  {Math.round(currentStep.metricsSnapshot.rps).toLocaleString()}
                </div>
              </div>
              <div className="bg-neutral-900/80 p-2 rounded border border-neutral-800">
                <div className="text-[11px] text-neutral-500">p95 Latency</div>
                <div className="font-mono font-semibold text-white mt-0.5 tabular-nums">
                  {currentStep.metricsSnapshot.p95LatencyMs} ms
                </div>
              </div>
              <div className="bg-neutral-900/80 p-2 rounded border border-neutral-800">
                <div className="text-[11px] text-neutral-500">CPU Load</div>
                <div className="font-mono font-semibold text-white mt-0.5 tabular-nums">
                  {currentStep.metricsSnapshot.cpuUtilizationPct}%
                </div>
              </div>
              <div className="bg-neutral-900/80 p-2 rounded border border-neutral-800">
                <div className="text-[11px] text-neutral-500">Error Rate</div>
                <div className={`font-mono font-semibold mt-0.5 tabular-nums ${currentStep.metricsSnapshot.errorRatePct > 1 ? 'text-rose-400' : 'text-neutral-300'}`}>
                  {currentStep.metricsSnapshot.errorRatePct}%
                </div>
              </div>
              <div className="bg-neutral-900/80 p-2 rounded border border-neutral-800">
                <div className="text-[11px] text-neutral-500">Live Availability</div>
                <div className="font-mono font-semibold text-white mt-0.5 tabular-nums">
                  {currentStep.metricsSnapshot.availabilityPct}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Post-Mortem & Architectural Hardening */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Outcome Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            {report.survived ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertOctagon className="w-4 h-4 text-rose-400" />
            )}
            <h4 className="text-sm font-semibold text-white">
              Survivability Post-Mortem Assessment
            </h4>
          </div>
          <div className="text-xs text-neutral-300 leading-relaxed mb-3">
            {report.recoverySummary}
          </div>
          <div className="text-xs font-mono text-neutral-400 pt-2 border-t border-neutral-800 flex items-center justify-between">
            <span>Observed MTTR: {report.mttrObservedMin} minutes</span>
            <span className={report.sloBreached ? 'text-rose-400' : 'text-emerald-400'}>
              {report.sloBreached ? 'SLO Error Budget Depleted' : 'SLO Budget Maintained'}
            </span>
          </div>
        </div>

        {/* Hardening Recommendations */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-semibold text-white">
              SRE & Architectural Hardening Directives
            </h4>
          </div>
          <ul className="text-xs text-neutral-300 space-y-2">
            {report.architecturalHardeningRecommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5 font-bold">✓</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
