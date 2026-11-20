import React from 'react';
import { Menu, Globe, Radio, ShieldCheck } from 'lucide-react';

interface NavigationHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tenantId: string;
  setTenantId: (tenant: string) => void;
  isConnected: boolean;
  activeIncidentsCount: number;
  onToggleMobileMenu?: () => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  activeTab,
  setActiveTab,
  tenantId,
  setTenantId,
  isConnected,
  activeIncidentsCount,
  onToggleMobileMenu,
}) => {
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'trust':
        return 'Trust Dashboard';
      case 'telemetry':
        return 'Telemetry & Forecast';
      case 'incidents':
        return 'Incidents & Root Cause Analysis';
      case 'privacy':
        return 'Privacy Transparency Center';
      case 'egress':
        return 'Cryptographic Egress Proofs';
      case 'audit':
        return 'Immutable Audit Chain';
      case 'remediation':
        return 'Safe Remediation Hub';
      case 'scenarios':
        return 'Live Scenario Injector';
      case 'copilot':
        return 'AIOps Infrastructure Copilot';
      case 'integrate':
        return 'Website Integration Hub';
      default:
        return 'Platform Console';
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 py-3 flex items-center justify-between gap-4">
      {/* Left: Mobile Hamburger & Active Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 hidden sm:inline">Platform /</span>
            <h2 className="text-sm font-bold text-slate-100">{getTabTitle(activeTab)}</h2>
          </div>
          <p className="text-[11px] text-slate-400 font-mono hidden md:block">
            Tenant: <span className="text-cyan-400">{tenantId}</span> • Zero Raw Customer Egress Enforced
          </p>
        </div>
      </div>

      {/* Right: Quick actions & SaaS overview link */}
      <div className="flex items-center gap-3">
        {/* SaaS Landing Switcher Button */}
        <button
          onClick={() => setActiveTab('landing')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-800/60 text-indigo-300 text-xs font-semibold transition-all hover:border-indigo-700 cursor-pointer shadow-sm"
        >
          <Globe className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">SaaS Overview</span>
        </button>

        {/* Live Event Stream Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/70">
          <Radio
            className={`w-3.5 h-3.5 ${
              isConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'
            }`}
          />
          <span className="text-[11px] font-mono text-slate-300 hidden sm:inline">
            {isConnected ? 'EVENT-DRIVEN (<1s)' : 'CONNECTING...'}
          </span>
        </div>
      </div>
    </header>
  );
};
