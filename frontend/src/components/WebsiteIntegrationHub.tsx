import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Globe,
  Sparkles,
  ExternalLink,
  Laptop,
  Layers,
  Terminal,
  Zap
} from 'lucide-react';
import { ThirdEyeEmbedWidget } from './ThirdEyeEmbedWidget';

interface WebsiteIntegrationHubProps {
  tenantId: string;
}

export const WebsiteIntegrationHub: React.FC<WebsiteIntegrationHubProps> = ({ tenantId }) => {
  const [activeSnippetTab, setActiveSnippetTab] = useState<'script' | 'iframe' | 'react' | 'supabase'>('script');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right'>('bottom-right');
  const [copied, setCopied] = useState(false);
  const [badgeTested, setBadgeTested] = useState(false);

  const vercelDomain = 'https://third-eye-eta.vercel.app';

  const snippets = {
    script: `<!-- 👁️ Third Eye Live Floating Badge (Drop before </body>) -->
<script 
  src="${vercelDomain}/embed.js" 
  data-tenant="${tenantId}" 
  data-theme="${theme}" 
  data-position="${position}">
</script>`,

    iframe: `<!-- 👁️ Third Eye Inline Dashboard Card -->
<iframe 
  src="${vercelDomain}/?mode=embed&tenant=${tenantId}&theme=${theme}" 
  width="100%" 
  height="460" 
  style="border: none; border-radius: 16px; max-width: 480px; box-shadow: 0 4px 24px rgba(0,0,0,0.5);"
  title="Third Eye Live Observability">
</iframe>`,

    react: `// 👁️ Third Eye Native React / Next.js Integration
import React from 'react';

export function ObservabilityWidget() {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <iframe 
        src="${vercelDomain}/?mode=embed&tenant=${tenantId}&theme=${theme}" 
        width="100%" 
        height="460" 
        style={{ border: 'none', borderRadius: 16 }}
        title="Third Eye System Health"
      />
    </div>
  );
}`,

    supabase: `// 👁️ Direct Realtime Stream via Supabase Client (Zero UI Overhead)
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://YOUR_PROJECT.supabase.co',
  'YOUR_SUPABASE_ANON_KEY'
);

// Listen to sub-second telemetry updates
supabase
  .channel('realtime:${tenantId}:telemetry_updates')
  .on('broadcast', { event: 'update' }, ({ payload }) => {
    console.log('CPU Percent:', payload.data.cpu_percent);
    console.log('Ping Latency:', payload.data.ping_latency_ms);
  })
  .subscribe();`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[activeSnippetTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestBadge = () => {
    if (document.querySelector('.thirdeye-badge')) {
      alert('The floating badge is already active on this page! Look at the bottom-right corner.');
      return;
    }
    const script = document.createElement('script');
    script.src = '/embed.js';
    script.setAttribute('data-tenant', tenantId);
    script.setAttribute('data-theme', theme);
    script.setAttribute('data-position', position);
    document.body.appendChild(script);
    setBadgeTested(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-cyan-950/40 border border-indigo-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono uppercase">
              1-Click Integration Hub
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
              Production Ready • 100% Free
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Connect Third Eye to Any Website
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Drop the live, privacy-first AIOps status card into your portfolio, SaaS app, or company portal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`${vercelDomain}/?mode=embed&tenant=${tenantId}&theme=${theme}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition-all border border-slate-700"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            Direct Embed URL
          </a>
          <button
            onClick={handleTestBadge}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-indigo-500/20 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            {badgeTested ? 'Badge Active 🟢' : 'Test Floating Badge Here'}
          </button>
        </div>
      </div>

      {/* Main Grid: Controls & Code vs Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration & Code Snippets */}
        <div className="lg:col-span-7 space-y-4">
          {/* Customization Options Bar */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">Theme:</span>
              <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
                <button
                  onClick={() => setTheme('dark')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    theme === 'dark' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Dark
                </button>
                <button
                  onClick={() => setTheme('light')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    theme === 'light' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Light
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">Badge Position:</span>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as any)}
                className="bg-slate-950 text-xs text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-800 outline-none cursor-pointer font-mono"
              >
                <option value="bottom-right">bottom-right</option>
                <option value="bottom-left">bottom-left</option>
                <option value="top-right">top-right</option>
              </select>
            </div>
          </div>

          {/* Snippet Selector Tabs */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-4 py-2.5">
              <div className="flex items-center gap-1">
                {[
                  { id: 'script', label: '1-Line Script', icon: Zap },
                  { id: 'iframe', label: 'HTML Iframe', icon: Layers },
                  { id: 'react', label: 'React / Next.js', icon: Code2 },
                  { id: 'supabase', label: 'Supabase Stream', icon: Terminal },
                ].map((t) => {
                  const Icon = t.icon;
                  const isActive = activeSnippetTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveSnippetTab(t.id as any)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                        isActive
                          ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {t.label}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow cursor-pointer active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Code
                  </>
                )}
              </button>
            </div>

            {/* Code Block */}
            <div className="p-4 bg-slate-950 font-mono text-xs text-indigo-200 overflow-x-auto leading-relaxed scrollbar-thin">
              <pre>{snippets[activeSnippetTab]}</pre>
            </div>

            <div className="p-3 bg-slate-900/40 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Tenant Scoped: <strong className="font-mono text-indigo-300">{tenantId}</strong></span>
              <span>Zero Raw Data Guarantee • Sub-Second Broadcast</span>
            </div>
          </div>

          {/* Quick Explanation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800">
              <div className="text-emerald-400 font-bold text-xs mb-1">0% Performance Impact</div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Asynchronous event listener running outside main execution thread.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800">
              <div className="text-indigo-400 font-bold text-xs mb-1">100% Privacy Verified</div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Only numeric metrics and health scores are shown. Zero raw customer data.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800">
              <div className="text-cyan-400 font-bold text-xs mb-1">Sub-Second Realtime</div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Connects directly to live broadcast streams with zero polling.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Preview */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-200">Live Widget Preview</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Live Data Stream Active
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center p-2">
              <ThirdEyeEmbedWidget tenantId={tenantId} theme={theme} />
            </div>

            <p className="text-center text-[11px] text-slate-500 font-mono mt-3">
              This card reflects your exact live system telemetry and health status.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebsiteIntegrationHub;
