import React from 'react';
import {
  Layers,
  Cpu,
  Zap,
  Sliders,
  Scale,
  Server,
  FileCode2,
  History,
  Sun,
  Moon,
  Workflow,
  CloudUpload,
  User as UserIcon,
  LogOut,
  FolderOpen,
} from 'lucide-react';
import { InfrastructureArchitecture } from '../types/infrastructure';
import { useAuth } from '../context/AuthContext';

export type ActiveTab =
  | 'topology'
  | 'solver'
  | 'chaos'
  | 'compare'
  | 'datacenter'
  | 'perspectives';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentArch: InfrastructureArchitecture;
  onSelectPreset: (presetKey: string) => void;
  onOpenExport: () => void;
  onOpenAudit: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  onLoadSavedArchitecture?: (arch: InfrastructureArchitecture) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentArch,
  onSelectPreset,
  onOpenExport,
  onOpenAudit,
  isDarkMode,
  setIsDarkMode,
  onLoadSavedArchitecture,
}) => {
  const {
    user,
    signInWithGoogle,
    signOutUser,
    saveToDatabase,
    savedArchitectures,
    syncStatus,
  } = useAuth();

  const handleSaveToCloud = async () => {
    if (!user) {
      await signInWithGoogle();
      return;
    }
    await saveToDatabase(currentArch);
  };

  return (
    <header className="border-b border-neutral-800 bg-neutral-900/95 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-lg tracking-tight">
            <Workflow className="w-5 h-5 text-cyan-400" />
            <span className="text-white font-bold">InfraWeave</span>
          </div>
          <span className="hidden lg:inline text-neutral-500 text-xs font-mono">
            / {currentArch.name}
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setActiveTab('topology')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'topology'
                ? 'bg-neutral-800 text-white border border-neutral-700 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Simulator & Canvas</span>
          </button>

          <button
            onClick={() => setActiveTab('solver')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'solver'
                ? 'bg-neutral-800 text-white border border-neutral-700 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>Constraint Solver</span>
          </button>

          <button
            onClick={() => setActiveTab('chaos')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'chaos'
                ? 'bg-neutral-800 text-white border border-neutral-700 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Failure & Chaos</span>
          </button>

          <button
            onClick={() => setActiveTab('compare')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'compare'
                ? 'bg-neutral-800 text-white border border-neutral-700 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-indigo-400" />
            <span>Architecture Compare</span>
          </button>

          <button
            onClick={() => setActiveTab('datacenter')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'datacenter'
                ? 'bg-neutral-800 text-white border border-neutral-700 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-purple-400" />
            <span>Racks & Power</span>
          </button>

          <button
            onClick={() => setActiveTab('perspectives')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'perspectives'
                ? 'bg-neutral-800 text-white border border-neutral-700 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-pink-400" />
            <span>Role Lenses</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Preset Selector */}
          <select
            onChange={e => onSelectPreset(e.target.value)}
            defaultValue="ecommerce-scale"
            aria-label="Preset Archetype"
            className="text-xs bg-neutral-800 border border-neutral-700 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ecommerce-scale">Preset: E-Commerce Scale</option>
            <option value="financial-core">Preset: Financial Core (Sync)</option>
            <option value="ai-inference">Preset: AI Inference Pipeline</option>
            <option value="lean-startup">Preset: Lean Startup MVP</option>
          </select>

          {/* User Saved Models Dropdown if available */}
          {user && savedArchitectures.length > 0 && onLoadSavedArchitecture && (
            <select
              onChange={e => {
                const found = savedArchitectures.find(s => s.id === e.target.value);
                if (found) onLoadSavedArchitecture(found.data);
              }}
              defaultValue=""
              aria-label="My Saved Architectures"
              className="text-xs bg-neutral-800 border border-cyan-800/80 text-cyan-200 rounded px-2 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer hidden md:inline-block"
            >
              <option value="" disabled>Saved Topologies ({savedArchitectures.length})</option>
              {savedArchitectures.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}

          {/* Save to Cloud Button */}
          <button
            onClick={handleSaveToCloud}
            className="px-2.5 py-1.5 text-xs font-medium text-neutral-200 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded transition-colors whitespace-nowrap flex items-center gap-1.5"
            title="Save architecture to database"
          >
            <CloudUpload className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">
              {syncStatus === 'syncing' ? 'Saving...' : syncStatus === 'synced' ? 'Saved' : 'Save'}
            </span>
          </button>

          {/* Export Button */}
          <button
            onClick={onOpenExport}
            className="px-3 py-1.5 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors whitespace-nowrap flex items-center gap-1.5"
            title="Export Terraform, K8s manifests, or Architecture Decision Record"
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Audit History */}
          <button
            onClick={onOpenAudit}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors"
            title="Audit History & Decision Trail"
            aria-label="Audit History"
          >
            <History className="w-4 h-4" />
          </button>

          {/* User Sign In / Account */}
          {user ? (
            <div className="flex items-center gap-1.5 pl-1 border-l border-neutral-800">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-6 h-6 rounded-full border border-neutral-700"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300 text-[10px] font-semibold">
                  {user.email ? user.email[0].toUpperCase() : 'U'}
                </div>
              )}
              <button
                onClick={signOutUser}
                className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="px-2.5 py-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded transition-colors whitespace-nowrap flex items-center gap-1"
            >
              <UserIcon className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}

          {/* Dark / Light Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors"
            title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
