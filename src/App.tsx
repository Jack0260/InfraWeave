import React, { useState, useEffect } from 'react';
import {
  InfrastructureArchitecture,
  SimulationResult,
  ArchitectureAuditEntry,
  ComputeNode,
  DatabaseNode,
  CacheNode,
  QueueNode,
  StorageNode,
} from './types/infrastructure';
import { ARCHITECTURE_PRESETS } from './simulator/presets';
import { simulateArchitecture } from './simulator/engine';
import { Header, ActiveTab } from './components/Header';
import { MetricsBar } from './components/MetricsBar';
import { WhatIfKnobs } from './components/WhatIfKnobs';
import { TopologyCanvas } from './components/TopologyCanvas';
import { NodeInspectorModal } from './components/NodeInspectorModal';
import { ConstraintSolverView } from './components/ConstraintSolverView';
import { ChaosView } from './components/ChaosView';
import { ArchitectureCompareView } from './components/ArchitectureCompareView';
import { DataCenterRackView } from './components/DataCenterRackView';
import { RolePerspectivesView } from './components/RolePerspectivesView';
import { ExportModal } from './components/ExportModal';
import { AuditHistoryModal } from './components/AuditHistoryModal';
import { AuthProvider } from './context/AuthContext';

function InfraWeaveApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('topology');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [currentPresetKey, setCurrentPresetKey] = useState<string>('ecommerce-scale');

  const [architecture, setArchitecture] = useState<InfrastructureArchitecture>(
    () => ARCHITECTURE_PRESETS['ecommerce-scale']
  );

  const [metrics, setMetrics] = useState<SimulationResult>(() =>
    simulateArchitecture(ARCHITECTURE_PRESETS['ecommerce-scale'])
  );

  const [auditLog, setAuditLog] = useState<ArchitectureAuditEntry[]>([
    {
      id: 'audit-0',
      timestamp: '21:45:00',
      authorPersona: 'solutions-architect',
      action: 'init',
      summary: 'Initialized baseline architecture topology (E-Commerce Scale)',
      deltaCost: 0,
      deltaLatencyP95: 0,
      deltaAvailability: 0,
    },
  ]);

  // Modals & Drawers
  const [selectedNode, setSelectedNode] = useState<{ type: string; id: string } | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);

  // Re-run deterministic simulation whenever architecture changes
  const updateArchitectureWithAudit = (newArch: InfrastructureArchitecture, summary: string) => {
    const newMetrics = simulateArchitecture(newArch);
    const deltaCost = newMetrics.cost.monthlyTotal - metrics.cost.monthlyTotal;
    const deltaLatency = +(newMetrics.performance.p95LatencyMs - metrics.performance.p95LatencyMs).toFixed(1);
    const deltaAvail = +(newMetrics.reliability.compositeAvailabilityPct - metrics.reliability.compositeAvailabilityPct).toFixed(4);

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    const newAuditEntry: ArchitectureAuditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: timeStr,
      authorPersona: 'cloud-engineer',
      action: 'modify',
      summary,
      deltaCost,
      deltaLatencyP95: deltaLatency,
      deltaAvailability: deltaAvail,
    };

    setArchitecture(newArch);
    setMetrics(newMetrics);
    setAuditLog(prev => [newAuditEntry, ...prev]);
  };

  const handleSelectPreset = (key: string) => {
    setCurrentPresetKey(key);
    if (ARCHITECTURE_PRESETS[key]) {
      const selected = ARCHITECTURE_PRESETS[key];
      setArchitecture(selected);
      const newMetrics = simulateArchitecture(selected);
      setMetrics(newMetrics);

      const newAuditEntry: ArchitectureAuditEntry = {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toTimeString().split(' ')[0],
        authorPersona: 'solutions-architect',
        action: 'switch-preset',
        summary: `Switched architecture preset to ${selected.name}`,
        deltaCost: newMetrics.cost.monthlyTotal - metrics.cost.monthlyTotal,
        deltaLatencyP95: +(newMetrics.performance.p95LatencyMs - metrics.performance.p95LatencyMs).toFixed(1),
        deltaAvailability: +(newMetrics.reliability.compositeAvailabilityPct - metrics.reliability.compositeAvailabilityPct).toFixed(4),
      };
      setAuditLog(prev => [newAuditEntry, ...prev]);
    }
  };

  const handleLoadSavedArchitecture = (savedArch: InfrastructureArchitecture) => {
    setArchitecture(savedArch);
    const newMetrics = simulateArchitecture(savedArch);
    setMetrics(newMetrics);

    const newAuditEntry: ArchitectureAuditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toTimeString().split(' ')[0],
      authorPersona: 'solutions-architect',
      action: 'load-saved',
      summary: `Loaded architecture ${savedArch.name} from database`,
      deltaCost: newMetrics.cost.monthlyTotal - metrics.cost.monthlyTotal,
      deltaLatencyP95: +(newMetrics.performance.p95LatencyMs - metrics.performance.p95LatencyMs).toFixed(1),
      deltaAvailability: +(newMetrics.reliability.compositeAvailabilityPct - metrics.reliability.compositeAvailabilityPct).toFixed(4),
    };
    setAuditLog(prev => [newAuditEntry, ...prev]);
  };

  const handleResetToDefault = () => {
    handleSelectPreset(currentPresetKey);
  };

  const handleAddNode = (type: 'compute' | 'database' | 'cache' | 'queue' | 'storage') => {
    const updated: InfrastructureArchitecture = JSON.parse(JSON.stringify(architecture));
    const targetRack = updated.racks[0]?.id || 'rack-a1';
    const targetRegion = updated.regions[0]?.id || 'reg-us-east';

    if (type === 'compute') {
      const newNode: ComputeNode = {
        id: `comp-custom-${Date.now().toString().slice(-4)}`,
        name: `Service Worker #${updated.computeNodes.length + 1}`,
        role: 'worker',
        vCpuPerInstance: 4,
        ramGbPerInstance: 8,
        instances: 2,
        unitCostPerHour: 0.192,
        powerWattsPerUnit: 160,
        maxQpsPerInstance: 1500,
        rackId: targetRack,
        regionId: targetRegion,
      };
      updated.computeNodes.push(newNode);
    } else if (type === 'database') {
      const newNode: DatabaseNode = {
        id: `db-custom-${Date.now().toString().slice(-4)}`,
        name: `Replica Shard #${updated.databaseNodes.length + 1}`,
        engine: 'postgres',
        primaryInstances: 1,
        readReplicas: 1,
        storageGb: 500,
        iopsProvisioned: 5000,
        unitCostPerHour: 0.54,
        maxReadQps: 4000,
        maxWriteQps: 1500,
        replicationMode: 'async',
        replicationLagMs: 20,
        powerWatts: 350,
        rackId: targetRack,
        regionId: targetRegion,
      };
      updated.databaseNodes.push(newNode);
    } else if (type === 'cache') {
      const newNode: CacheNode = {
        id: `cache-custom-${Date.now().toString().slice(-4)}`,
        name: `Redis Sub-cluster #${updated.cacheNodes.length + 1}`,
        engine: 'redis',
        nodes: 2,
        ramGbPerNode: 16,
        unitCostPerHour: 0.16,
        hitRateTarget: 0.85,
        powerWatts: 120,
        rackId: targetRack,
        regionId: targetRegion,
        enabled: true,
      };
      updated.cacheNodes.push(newNode);
    } else if (type === 'queue') {
      const newNode: QueueNode = {
        id: `queue-custom-${Date.now().toString().slice(-4)}`,
        name: `Kafka Ingestion Bus #${updated.queueNodes.length + 1}`,
        engine: 'kafka',
        partitions: 8,
        throughputMsgPerSec: 15000,
        retentionHours: 48,
        unitCostPerHour: 0.35,
        powerWatts: 250,
        rackId: targetRack,
        regionId: targetRegion,
      };
      updated.queueNodes.push(newNode);
    } else if (type === 'storage') {
      const newNode: StorageNode = {
        id: `store-custom-${Date.now().toString().slice(-4)}`,
        name: `Cold Archive Bucket #${updated.storageNodes.length + 1}`,
        type: 'cold-archive',
        sizeTb: 10,
        egressGbPerMonth: 500,
        costPerGbMonth: 0.005,
        durabilityNines: 11,
        powerWatts: 60,
        regionId: targetRegion,
      };
      updated.storageNodes.push(newNode);
    }

    updateArchitectureWithAudit(updated, `Added new ${type} component to topology`);
  };

  const handleDeleteNode = (type: string, id: string) => {
    const updated: InfrastructureArchitecture = JSON.parse(JSON.stringify(architecture));
    if (type === 'compute') updated.computeNodes = updated.computeNodes.filter(n => n.id !== id);
    else if (type === 'database') updated.databaseNodes = updated.databaseNodes.filter(n => n.id !== id);
    else if (type === 'cache') updated.cacheNodes = updated.cacheNodes.filter(n => n.id !== id);
    else if (type === 'queue') updated.queueNodes = updated.queueNodes.filter(n => n.id !== id);
    else if (type === 'storage') updated.storageNodes = updated.storageNodes.filter(n => n.id !== id);

    updateArchitectureWithAudit(updated, `Removed ${type} component (${id})`);
  };

  const handleApplyCandidate = (candidateArch: InfrastructureArchitecture, title: string) => {
    updateArchitectureWithAudit(candidateArch, `Adopted solver candidate: ${title}`);
    setActiveTab('topology');
  };

  const handlePromoteArchB = (archB: InfrastructureArchitecture) => {
    updateArchitectureWithAudit(archB, `Promoted Branch B (${archB.name}) to active architecture`);
    setActiveTab('topology');
  };

  // Sync theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [isDarkMode]);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-neutral-950 text-neutral-100' : 'bg-slate-50 text-slate-900'} flex flex-col font-sans transition-colors`}>
      {/* 3-Zone Header Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentArch={architecture}
        onSelectPreset={handleSelectPreset}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenAudit={() => setIsAuditOpen(true)}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onLoadSavedArchitecture={handleLoadSavedArchitecture}
      />

      {/* Primary KPI Strip */}
      <MetricsBar metrics={metrics} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Tab 1: Simulator & Interactive Canvas */}
        {activeTab === 'topology' && (
          <div className="space-y-6">
            {/* Quick Interactive What-If Knobs */}
            <WhatIfKnobs
              architecture={architecture}
              baseMetrics={metrics}
              onChangeArchitecture={updateArchitectureWithAudit}
              onResetToDefault={handleResetToDefault}
            />

            {/* Visual Infrastructure Graph Canvas */}
            <TopologyCanvas
              architecture={architecture}
              onSelectNode={(type, id) => setSelectedNode({ type, id })}
              onAddNode={handleAddNode}
              onDeleteNode={handleDeleteNode}
              selectedNodeId={selectedNode?.id || null}
            />
          </div>
        )}

        {/* Tab 2: Constraint Solver (Applied Science) */}
        {activeTab === 'solver' && (
          <ConstraintSolverView
            currentArch={architecture}
            currentMetrics={metrics}
            onApplyCandidate={handleApplyCandidate}
          />
        )}

        {/* Tab 3: Failure & Chaos Engineering */}
        {activeTab === 'chaos' && (
          <ChaosView architecture={architecture} />
        )}

        {/* Tab 4: Architecture Comparison (Branch A vs B) */}
        {activeTab === 'compare' && (
          <ArchitectureCompareView
            archA={architecture}
            metricsA={metrics}
            onPromoteArchB={handlePromoteArchB}
          />
        )}

        {/* Tab 5: Data Center Racks & Thermal Power */}
        {activeTab === 'datacenter' && (
          <DataCenterRackView
            architecture={architecture}
            metrics={metrics}
          />
        )}

        {/* Tab 6: Cross-Disciplinary Role Perspectives */}
        {activeTab === 'perspectives' && (
          <RolePerspectivesView
            architecture={architecture}
            metrics={metrics}
          />
        )}
      </main>

      {/* Modals & Inspectors */}
      {selectedNode && (
        <NodeInspectorModal
          architecture={architecture}
          nodeType={selectedNode.type}
          nodeId={selectedNode.id}
          onClose={() => setSelectedNode(null)}
          onUpdateArchitecture={updateArchitectureWithAudit}
          onDeleteNode={handleDeleteNode}
        />
      )}

      {isExportOpen && (
        <ExportModal
          architecture={architecture}
          metrics={metrics}
          onClose={() => setIsExportOpen(false)}
        />
      )}

      {isAuditOpen && (
        <AuditHistoryModal
          auditLog={auditLog}
          onClose={() => setIsAuditOpen(false)}
          onClearHistory={() => setAuditLog([])}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <InfraWeaveApp />
    </AuthProvider>
  );
}
