import React, { useState, useEffect } from 'react';
import {
  InfrastructureArchitecture,
  ComputeNode,
  DatabaseNode,
  CacheNode,
  QueueNode,
  StorageNode,
} from '../types/infrastructure';
import { X, Trash2, Check, Sliders } from 'lucide-react';

interface NodeInspectorModalProps {
  architecture: InfrastructureArchitecture;
  nodeType: string;
  nodeId: string;
  onClose: () => void;
  onUpdateArchitecture: (newArch: InfrastructureArchitecture, summary: string) => void;
  onDeleteNode: (type: string, id: string) => void;
}

export const NodeInspectorModal: React.FC<NodeInspectorModalProps> = ({
  architecture,
  nodeType,
  nodeId,
  onClose,
  onUpdateArchitecture,
  onDeleteNode,
}) => {
  // Find node
  let nodeObj: any = null;
  if (nodeType === 'compute') nodeObj = architecture.computeNodes.find(n => n.id === nodeId);
  else if (nodeType === 'database') nodeObj = architecture.databaseNodes.find(n => n.id === nodeId);
  else if (nodeType === 'cache') nodeObj = architecture.cacheNodes.find(n => n.id === nodeId);
  else if (nodeType === 'queue') nodeObj = architecture.queueNodes.find(n => n.id === nodeId);
  else if (nodeType === 'storage') nodeObj = architecture.storageNodes.find(n => n.id === nodeId);

  const [formData, setFormData] = useState<any>(nodeObj ? { ...nodeObj } : null);

  useEffect(() => {
    if (nodeObj) setFormData({ ...nodeObj });
  }, [nodeId, nodeType]);

  if (!formData || !nodeObj) return null;

  const handleChange = (field: string, val: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: val }));
  };

  const handleSave = () => {
    const updated: InfrastructureArchitecture = JSON.parse(JSON.stringify(architecture));
    if (nodeType === 'compute') {
      const idx = updated.computeNodes.findIndex(n => n.id === nodeId);
      if (idx !== -1) updated.computeNodes[idx] = { ...formData };
    } else if (nodeType === 'database') {
      const idx = updated.databaseNodes.findIndex(n => n.id === nodeId);
      if (idx !== -1) updated.databaseNodes[idx] = { ...formData };
    } else if (nodeType === 'cache') {
      const idx = updated.cacheNodes.findIndex(n => n.id === nodeId);
      if (idx !== -1) updated.cacheNodes[idx] = { ...formData };
    } else if (nodeType === 'queue') {
      const idx = updated.queueNodes.findIndex(n => n.id === nodeId);
      if (idx !== -1) updated.queueNodes[idx] = { ...formData };
    } else if (nodeType === 'storage') {
      const idx = updated.storageNodes.findIndex(n => n.id === nodeId);
      if (idx !== -1) updated.storageNodes[idx] = { ...formData };
    }

    onUpdateArchitecture(updated, `Calibrated ${formData.name} specifications`);
    onClose();
  };

  const handleDelete = () => {
    onDeleteNode(nodeType, nodeId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-lg w-full p-5 shadow-2xl relative text-xs">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Calibrate Component</h3>
            <span className="text-neutral-500 font-mono">({nodeType})</span>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Form Inputs */}
        <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-neutral-400 mb-1">Component Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Compute Fields */}
          {nodeType === 'compute' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Instances (Units)</label>
                  <input
                    type="number"
                    min={1}
                    max={64}
                    value={formData.instances}
                    onChange={e => handleChange('instances', Math.max(1, Number(e.target.value)))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">vCPUs per Instance</label>
                  <input
                    type="number"
                    min={1}
                    max={128}
                    value={formData.vCpuPerInstance}
                    onChange={e => handleChange('vCpuPerInstance', Math.max(1, Number(e.target.value)))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">RAM per Instance (GB)</label>
                  <input
                    type="number"
                    min={1}
                    max={512}
                    value={formData.ramGbPerInstance}
                    onChange={e => handleChange('ramGbPerInstance', Math.max(1, Number(e.target.value)))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Max QPS per Unit</label>
                  <input
                    type="number"
                    min={100}
                    step={250}
                    value={formData.maxQpsPerInstance}
                    onChange={e => handleChange('maxQpsPerInstance', Math.max(100, Number(e.target.value)))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Unit Cost ($/hr)</label>
                  <input
                    type="number"
                    step={0.01}
                    value={formData.unitCostPerHour}
                    onChange={e => handleChange('unitCostPerHour', Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Power Draw (Watts/Unit)</label>
                  <input
                    type="number"
                    value={formData.powerWattsPerUnit}
                    onChange={e => handleChange('powerWattsPerUnit', Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>
            </>
          )}

          {/* Database Fields */}
          {nodeType === 'database' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Read Replicas</label>
                  <input
                    type="number"
                    min={0}
                    max={12}
                    value={formData.readReplicas}
                    onChange={e => handleChange('readReplicas', Math.max(0, Number(e.target.value)))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Replication Mode</label>
                  <select
                    value={formData.replicationMode}
                    onChange={e => handleChange('replicationMode', e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="async">Asynchronous (Low Latency)</option>
                    <option value="sync">Synchronous (Zero-RPO)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Storage (GB)</label>
                  <input
                    type="number"
                    step={100}
                    value={formData.storageGb}
                    onChange={e => handleChange('storageGb', Math.max(10, Number(e.target.value)))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Provisioned IOPS</label>
                  <input
                    type="number"
                    step={1000}
                    value={formData.iopsProvisioned}
                    onChange={e => handleChange('iopsProvisioned', Math.max(500, Number(e.target.value)))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>
            </>
          )}

          {/* Cache Fields */}
          {nodeType === 'cache' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Cache Nodes</label>
                  <input
                    type="number"
                    min={1}
                    max={16}
                    value={formData.nodes}
                    onChange={e => handleChange('nodes', Math.max(1, Number(e.target.value)))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Target Hit Rate (0.0 - 1.0)</label>
                  <input
                    type="number"
                    min={0.1}
                    max={0.99}
                    step={0.01}
                    value={formData.hitRateTarget}
                    onChange={e => handleChange('hitRateTarget', Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="cacheEnabled"
                  checked={formData.enabled}
                  onChange={e => handleChange('enabled', e.target.checked)}
                  className="rounded bg-neutral-950 border-neutral-800 text-cyan-500 focus:ring-0"
                />
                <label htmlFor="cacheEnabled" className="text-neutral-300">
                  Cache Layer Enabled (absorbs read traffic)
                </label>
              </div>
            </>
          )}

          {/* Rack Assignment */}
          {'rackId' in formData && (
            <div>
              <label className="block text-neutral-400 mb-1">Physical Rack Placement</label>
              <select
                value={formData.rackId}
                onChange={e => handleChange('rackId', e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-cyan-500"
              >
                {architecture.racks.map(rack => (
                  <option key={rack.id} value={rack.id}>
                    {rack.code} ({rack.maxPowerKw} kW cap)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-neutral-800 pt-3 mt-4">
          <button
            onClick={handleDelete}
            className="text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-rose-950/30"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove Node</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
