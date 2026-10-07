import React, { useState } from 'react';
import {
  InfrastructureArchitecture,
  SimulationResult,
} from '../types/infrastructure';
import {
  generateTerraformHcl,
  generateKubernetesYaml,
  generateAdrRecord,
} from '../simulator/exportEngine';
import { X, Copy, Check, Download, FileCode, Layers } from 'lucide-react';

interface ExportModalProps {
  architecture: InfrastructureArchitecture;
  metrics: SimulationResult;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  architecture,
  metrics,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'terraform' | 'k8s' | 'adr' | 'json'>('terraform');
  const [copied, setCopied] = useState(false);

  const terraformCode = generateTerraformHcl(architecture, metrics);
  const k8sCode = generateKubernetesYaml(architecture);
  const adrObj = generateAdrRecord(architecture, metrics);
  const adrMarkdown = `# Architecture Decision Record: ${adrObj.title}

* **Status:** ${adrObj.status}
* **Date:** ${adrObj.date}
* **Author:** ${adrObj.author}

## Context & Problem Statement
${adrObj.context}

## Decision
${adrObj.decision}

## Evidence & Key Metrics
* **Monthly Cost:** ${adrObj.metricsEvidence.monthlyCost}
* **Tail Latency (p95):** ${adrObj.metricsEvidence.p95Latency}
* **Availability SLO:** ${adrObj.metricsEvidence.availability}
* **Power Draw:** ${adrObj.metricsEvidence.powerKw}

## Consequences
### Positive
${adrObj.consequences.positive.map(p => `* ${p}`).join('\n')}

### Negative
${adrObj.consequences.negative.map(n => `* ${n}`).join('\n')}

### Operational & Neutral
${adrObj.consequences.neutral.map(m => `* ${m}`).join('\n')}
`;

  const jsonCode = JSON.stringify(architecture, null, 2);

  let currentContent = '';
  let filename = '';
  if (activeTab === 'terraform') {
    currentContent = terraformCode;
    filename = 'infraweave-blueprint.tf';
  } else if (activeTab === 'k8s') {
    currentContent = k8sCode;
    filename = 'infraweave-k8s-manifests.yaml';
  } else if (activeTab === 'adr') {
    currentContent = adrMarkdown;
    filename = `${adrObj.id.toLowerCase()}-decision-record.md`;
  } else {
    currentContent = jsonCode;
    filename = 'infraweave-architecture.json';
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-3xl w-full p-5 shadow-2xl relative text-xs flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Export Infrastructure Artifacts</h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center justify-between mb-3 border-b border-neutral-800 pb-2 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('terraform')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeTab === 'terraform'
                  ? 'bg-neutral-800 text-white border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Terraform (HCL)
            </button>
            <button
              onClick={() => setActiveTab('k8s')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeTab === 'k8s'
                  ? 'bg-neutral-800 text-white border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Kubernetes (YAML)
            </button>
            <button
              onClick={() => setActiveTab('adr')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeTab === 'adr'
                  ? 'bg-neutral-800 text-white border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Decision Record (ADR)
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeTab === 'json'
                  ? 'bg-neutral-800 text-white border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Architecture (JSON)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded border border-neutral-700 flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded flex items-center gap-1 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Code Viewport */}
        <pre className="flex-1 overflow-auto bg-neutral-950 border border-neutral-800 rounded p-4 text-[11px] font-mono text-neutral-300 leading-relaxed selection:bg-cyan-500/30">
          {currentContent}
        </pre>
      </div>
    </div>
  );
};
