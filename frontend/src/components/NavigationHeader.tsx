import React from 'react';
import {
  ShieldCheck,
  Activity,
  AlertTriangle,
  Lock,
  PlayCircle,
  MessageSquare,
  FileCheck2,
  TrendingUp,
  Wrench,
  Radio,
  Eye,
  Globe
} from 'lucide-react';

interface NavigationHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tenantId: string;
  setTenantId: (tenant: string) => void;
  isConnected: boolean;
  activeIncidentsCount: number;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  activeTab,
  setActiveTab,
  tenantId,
  setTenantId,
  isConnected,
  activeIncidentsCount
}) => {
  const tabs = [
    { id: 'trust', label: 'Trust Dashboard', icon: ShieldCheck },
    { id: 'privacy', label: 'Privacy Center', icon: Lock },
    { id: 'egress', label: 'Egress Proof', icon: FileCheck2 },
    { id: 'incidents', label: 'Incidents & RCA', icon: AlertTriangle, badge: activeIncidentsCount },
    { id: 'telemetry', label: 'Telemetry & Forecast', icon: TrendingUp },
    { id: 'remediation', label: 'Safe Remediation', icon: Wrench },
    { id: 'scenarios', label: 'Scenario Injector', icon: PlayCircle },
    { id: 'copilot', label: 'AI Copilot', icon: MessageSquare },
    { id: 'audit', label: 'Audit Chain', icon: Activity },
    { id: 'landing', label: 'SaaS Overview', icon: Globe },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Eye className="h-5 w-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">
                Third<span className="text-indigo-400">Eye</span>
              </h1>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                Metadata-Only SaaS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">Zero Raw Data Observability</p>
          </div>
        </div>

        {/* Tenant Switcher & Realtime Live Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900/60 text-xs text-slate-300">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer font-mono"
            >
              <option value="tenant_prod_us_east_1" className="bg-slate-900 text-slate-200">US-East (tenant_prod_01)</option>
              <option value="tenant_prod_eu_central_1" className="bg-slate-900 text-slate-200">EU-Central (tenant_eu_02)</option>
              <option value="tenant_prod_ap_south_1" className="bg-slate-900 text-slate-200">AP-South (tenant_apac_03)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-lg border border-slate-800 bg-slate-900/60">
            <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <span className="text-[11px] font-mono text-slate-300">
              {isConnected ? 'LIVE EVENT STREAM (<1s)' : 'CONNECTING...'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs navigation bar */}
      <div className="border-t border-slate-800/60 bg-slate-900/40 px-4 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-1 py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
