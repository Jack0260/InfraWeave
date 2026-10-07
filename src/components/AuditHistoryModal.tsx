import React from 'react';
import { ArchitectureAuditEntry } from '../types/infrastructure';
import { X, History, RotateCcw, Clock } from 'lucide-react';

interface AuditHistoryModalProps {
  auditLog: ArchitectureAuditEntry[];
  onClose: () => void;
  onClearHistory: () => void;
}

export const AuditHistoryModal: React.FC<AuditHistoryModalProps> = ({
  auditLog,
  onClose,
  onClearHistory,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-xl w-full p-5 shadow-2xl relative text-xs flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Simulation Decision & Audit Trail</h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Audit Log Entries List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {auditLog.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              No parameter changes recorded yet. Adjust knobs or topologies to populate the trail.
            </div>
          ) : (
            auditLog.map(entry => (
              <div
                key={entry.id}
                className="bg-neutral-950 border border-neutral-800 rounded p-3 flex flex-col gap-1 text-xs"
              >
                <div className="flex items-center justify-between font-mono text-[11px] text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {entry.timestamp}
                  </span>
                  <span className="text-cyan-400 uppercase tracking-wider">{entry.authorPersona}</span>
                </div>
                <div className="font-medium text-white">{entry.summary}</div>
                <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-400 pt-1 border-t border-neutral-900">
                  <span>
                    Δ Cost: {entry.deltaCost >= 0 ? `+$${entry.deltaCost.toFixed(0)}` : `-$${Math.abs(entry.deltaCost).toFixed(0)}`}
                  </span>
                  <span>·</span>
                  <span>
                    Δ p95: {entry.deltaLatencyP95 >= 0 ? `+${entry.deltaLatencyP95.toFixed(1)}ms` : `${entry.deltaLatencyP95.toFixed(1)}ms`}
                  </span>
                  <span>·</span>
                  <span>
                    Δ Avail: {entry.deltaAvailability >= 0 ? `+${entry.deltaAvailability.toFixed(4)}%` : `${entry.deltaAvailability.toFixed(4)}%`}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-800 pt-3 mt-4 flex items-center justify-between">
          <button
            onClick={onClearHistory}
            className="text-neutral-400 hover:text-neutral-300 text-xs flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear Trail</span>
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
