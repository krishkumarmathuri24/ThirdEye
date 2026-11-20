import React from 'react';
import {
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Lock,
  FileCheck2,
  Activity,
  Wrench,
  PlayCircle,
  MessageSquare,
  Code2,
  Globe,
  Radio,
  Eye,
  X,
  Server,
  Layers
} from 'lucide-react';

interface NavigationSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tenantId: string;
  setTenantId: (tenant: string) => void;
  isConnected: boolean;
  activeIncidentsCount: number;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activeTab,
  setActiveTab,
  tenantId,
  setTenantId,
  isConnected,
  activeIncidentsCount,
  mobileOpen,
  setMobileOpen,
}) => {
  const navSections: NavSection[] = [
    {
      title: 'OBSERVABILITY & METRICS',
      items: [
        { id: 'trust', label: 'Trust Dashboard', icon: ShieldCheck },
        { id: 'telemetry', label: 'Telemetry & Forecast', icon: TrendingUp },
        { id: 'incidents', label: 'Incidents & RCA', icon: AlertTriangle, badge: activeIncidentsCount },
      ],
    },
    {
      title: 'ZERO-RAW SECURITY',
      items: [
        { id: 'privacy', label: 'Privacy Center', icon: Lock },
        { id: 'egress', label: 'Egress Proof', icon: FileCheck2 },
        { id: 'audit', label: 'Audit Chain', icon: Activity },
      ],
    },
    {
      title: 'OPERATIONS & AUTOMATION',
      items: [
        { id: 'remediation', label: 'Safe Remediation', icon: Wrench },
        { id: 'scenarios', label: 'Scenario Injector', icon: PlayCircle },
        { id: 'copilot', label: 'AI Copilot', icon: MessageSquare },
        { id: 'integrate', label: 'Connect Website', icon: Code2 },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 md:w-72 bg-slate-950/95 border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Eye className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-bold text-white tracking-tight">
                  Third<span className="text-indigo-400">Eye</span>
                </h1>
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-medium">
                  v2.4
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Zero Raw Data SaaS</p>
            </div>
          </div>

          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Stream Heartbeat Banner */}
        <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio
              className={`w-3.5 h-3.5 ${
                isConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'
              }`}
            />
            <span className="text-[11px] font-mono text-slate-300">
              {isConnected ? 'LIVE STREAM (<1s)' : 'CONNECTING...'}
            </span>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
            SYNCED
          </span>
        </div>

        {/* Tenant Selector */}
        <div className="px-4 py-3 border-b border-slate-800/60">
          <label className="text-[10px] uppercase font-mono text-slate-400 mb-1 block">Active Region Tenant</label>
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 text-xs text-slate-300">
            <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer font-mono w-full"
            >
              <option value="tenant_prod_us_east_1" className="bg-slate-900 text-slate-200">
                US-East (prod_01)
              </option>
              <option value="tenant_prod_eu_central_1" className="bg-slate-900 text-slate-200">
                EU-Central (eu_02)
              </option>
              <option value="tenant_prod_ap_south_1" className="bg-slate-900 text-slate-200">
                AP-South (apac_03)
              </option>
            </select>
          </div>
        </div>

        {/* Navigation Sections (Vertical Tabs) */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
          {navSections.map((section) => (
            <div key={section.title}>
              <div className="px-2 mb-1.5 text-[10px] font-semibold tracking-wider uppercase text-slate-500 font-mono">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all text-left cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-600/30 to-cyan-600/10 text-white border-l-4 border-indigo-400 bg-slate-900/90 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-indigo-400' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {typeof item.badge === 'number' && item.badge > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 space-y-2">
          {/* Quick toggle to SaaS Overview landing page */}
          <button
            onClick={() => {
              setActiveTab('landing');
              setMobileOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 border border-indigo-800/40 text-xs font-semibold transition-all hover:border-indigo-700 cursor-pointer shadow"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>SaaS Overview Landing</span>
          </button>

          <div className="flex items-center justify-between px-2 pt-1 text-[10px] font-mono text-slate-500">
            <span className="flex items-center gap-1">
              <Server className="w-3 h-3 text-emerald-400" />
              Agent: node_alpha
            </span>
            <span className="text-cyan-400">HMAC-SHA256</span>
          </div>
        </div>
      </aside>
    </>
  );
};
