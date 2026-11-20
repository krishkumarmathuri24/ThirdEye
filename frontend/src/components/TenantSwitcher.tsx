import React, { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check, Copy, Plus, Terminal, Globe, Server } from 'lucide-react';

interface TenantSwitcherProps {
  tenantId: string;
  setTenantId: (tenant: string) => void;
  compact?: boolean;
}

const PRESET_TENANTS = [
  { id: 'tenant_prod_us_east_1', name: 'US-East Production (Local Host)', region: 'AWS us-east-1', flag: '🇺🇸' },
  { id: 'tenant_prod_eu_central_1', name: 'EU-Central DC (Frankfurt)', region: 'Equinix FR2', flag: '🇪🇺' },
  { id: 'tenant_prod_ap_south_1', name: 'Asia-South DC (Mumbai)', region: 'AWS ap-south-1', flag: '🇮🇳' },
  { id: 'tenant_acme_corp', name: 'Acme Corp Private Cloud', region: 'Enterprise Rack 12', flag: '🏢' },
  { id: 'tenant_fintech_cloud', name: 'Fintech High-Frequency Core', region: 'Hybrid Bare-Metal', flag: '🏦' },
];

export const TenantSwitcher: React.FC<TenantSwitcherProps> = ({ tenantId, setTenantId, compact = false }) => {
  const [open, setOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeTenantObj = PRESET_TENANTS.find((t) => t.id === tenantId);
  const displayName = activeTenantObj ? activeTenantObj.name : tenantId;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    setTenantId(id);
    // Update URL query param without reload
    const url = new URL(window.location.href);
    url.searchParams.set('tenant', id);
    window.history.replaceState({}, '', url.toString());
    setOpen(false);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customInput.trim().replace(/\s+/g, '_').toLowerCase();
    if (clean) {
      const finalId = clean.startsWith('tenant_') ? clean : `tenant_${clean}`;
      handleSelect(finalId);
      setCustomInput('');
    }
  };

  const copyCommand = () => {
    const cmd = `TENANT_ID="${tenantId}" python -m collector.agent`;
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 rounded-xl transition-all cursor-pointer border shadow-sm ${
          compact
            ? 'px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 text-xs'
            : 'px-3.5 py-2 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 hover:border-indigo-500/50 border-slate-800 text-xs'
        }`}
        title="Switch Company / Datacenter Tenant"
      >
        <Server className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <div className="text-left leading-tight">
          <div className="text-[10px] uppercase font-mono text-slate-400">Datacenter Tenant</div>
          <div className="text-xs font-bold text-white flex items-center gap-1.5 max-w-[160px] md:max-w-[210px] truncate">
            <span>{activeTenantObj?.flag || '🌐'}</span>
            <span className="truncate">{displayName}</span>
          </div>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ml-1 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-80 md:w-96 rounded-2xl bg-slate-950/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl z-50 p-4 divide-y divide-slate-800/80">
          
          {/* Header */}
          <div className="pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-400" />
                Company &amp; Datacenter Selector
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 border border-cyan-800/50 px-1.5 py-0.5 rounded">
                Live Isolated
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Each company or rack runs in an isolated cryptographic telemetry room.
            </p>
          </div>

          {/* Preset Companies / Datacenters */}
          <div className="py-2.5 space-y-1 max-h-56 overflow-y-auto">
            <div className="text-[10px] font-mono uppercase text-slate-500 px-2 py-1">Pre-configured Datacenters</div>
            {PRESET_TENANTS.map((t) => {
              const isSelected = t.id === tenantId;
              return (
                <button
                  key={t.id}
                  onClick={() => handleSelect(t.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600/30 border border-indigo-500/60 text-white font-bold'
                      : 'hover:bg-slate-900 text-slate-300 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base shrink-0">{t.flag}</span>
                    <div className="min-w-0 truncate">
                      <div className="text-xs font-semibold truncate">{t.name}</div>
                      <div className="text-[10px] font-mono text-slate-400 truncate">{t.id} • {t.region}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>

          {/* Connect Custom Company / Datacenter */}
          <div className="py-3">
            <form onSubmit={handleAddCustom} className="space-y-2">
              <label className="text-[10px] font-mono uppercase text-slate-400 block">
                + Connect Any Company / Datacenter ID
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. acme_corp or dc_chicago_02"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 focus:border-indigo-500 text-xs text-white rounded-lg px-2.5 py-1.5 outline-none font-mono"
                />
                <button
                  type="submit"
                  disabled={!customInput.trim()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-all cursor-pointer shrink-0"
                >
                  Switch
                </button>
              </div>
            </form>
          </div>

          {/* Deployment Command Quick Copy */}
          <div className="pt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
                <Terminal className="w-3 h-3 text-cyan-400" />
                Run On Target Server:
              </span>
              <button
                onClick={copyCommand}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-mono"
              >
                <Copy className="w-3 h-3" />
                {copied ? 'Copied!' : 'Copy Command'}
              </button>
            </div>
            <pre className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto select-all">
              TENANT_ID="{tenantId}" python -m collector.agent
            </pre>
          </div>

        </div>
      )}
    </div>
  );
};
