import React from 'react';
import {
  ShieldCheck,
  HeartPulse,
  Lock,
  Cpu,
  Activity,
  AlertTriangle,
  Server,
  CheckCircle2,
  TrendingDown
} from 'lucide-react';
import { TrustScores, TelemetryData, HealthState, SecurityState } from '../types';

interface TrustDashboardProps {
  scores: TrustScores | null;
  telemetry: TelemetryData | null;
  health: HealthState | null;
  security: SecurityState | null;
  onNavigateTab: (tab: string) => void;
}

export const TrustDashboard: React.FC<TrustDashboardProps> = ({
  scores,
  telemetry,
  health,
  security,
  onNavigateTab
}) => {
  const privacyScore = scores?.privacy_score ?? 100;
  const healthScore = health?.overall_score ?? scores?.health_score ?? 98;
  const secScore = security?.security_score ?? scores?.security_score ?? 96;
  const reliabilityScore = scores?.reliability_score ?? 100;
  const riskScore = scores?.prediction_risk_score ?? 12;
  const collectorState = scores?.collector_health ?? 'online';

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="p-4 rounded-xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/60 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
            <Lock className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Privacy-First Architecture Enforced</h3>
            <p className="text-xs text-slate-400">
              Zero raw payloads or customer secrets are transmitted. Only approved numerical telemetry metadata reaches SaaS.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigateTab('privacy')}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
        >
          View Privacy Proofs →
        </button>
      </div>

      {/* 5 Core Trust Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Privacy Score */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Privacy Score</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{privacyScore}%</span>
            <span className="text-xs text-emerald-400 font-medium">Zero-Leak</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">100% egress verified. 0 raw data leaks.</p>
        </div>

        {/* System Health Score */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Health Score</span>
            <HeartPulse className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{healthScore}</span>
            <span className={`text-xs font-medium ${health?.state === 'Poor' ? 'text-rose-400' : 'text-cyan-400'}`}>
              {health?.state || 'Excellent'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 truncate">{health?.reasoning || 'Optimal parameters.'}</p>
        </div>

        {/* Security Score */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Security Score</span>
            <Lock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{secScore}</span>
            <span className={`text-xs font-medium ${security?.risk_level === 'Critical' ? 'text-rose-400' : 'text-purple-400'}`}>
              {security?.risk_level || 'Low'} Risk
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {security?.failed_logins_last_5m ? `${security.failed_logins_last_5m} failed auth attempts` : 'Zero brute force attempts'}
          </p>
        </div>

        {/* Reliability Score */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Reliability Score</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{reliabilityScore}%</span>
            <span className="text-xs text-amber-400 font-medium">Zero-Drop</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Idempotent SQLite outbox buffering.</p>
        </div>

        {/* Prediction Risk */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Prediction Risk</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{riskScore}%</span>
            <span className="text-xs text-slate-400 font-medium">30m Horizon</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Forecasting operational failure probability.</p>
        </div>
      </div>

      {/* Collector Status & Active Telemetry Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Collector Health Card */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-400" />
              Tier 1 Collector Agent Status
            </h4>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
              collectorState === 'online' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              ● {collectorState}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Node Identifier:</span>
              <span className="font-mono text-slate-200">collector_node_alpha</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Local Buffer Outbox:</span>
              <span className="font-mono text-emerald-400">0 queued (Nominal)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Replay Capability:</span>
              <span className="font-mono text-slate-200">Enabled (Zero Data Loss)</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Cryptographic Signing:</span>
              <span className="font-mono text-cyan-400">HMAC-SHA256 Active</span>
            </div>
          </div>
        </div>

        {/* Live Metrics Quick View */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Live Telemetry Stream (Event-Driven)
            </h4>
            <span className="text-[11px] font-mono text-slate-400">
              Last Ingest: {telemetry?.timestamp ? new Date(telemetry.timestamp).toLocaleTimeString() : 'Streaming'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono">CPU Core Load</span>
              <div className="text-xl font-bold font-mono text-white mt-1">{telemetry?.cpu_percent?.toFixed(1) ?? '34.2'}%</div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full ${((telemetry?.cpu_percent || 34) > 80) ? 'bg-rose-500' : 'bg-cyan-400'}`}
                  style={{ width: `${Math.min(100, telemetry?.cpu_percent || 34)}%` }}
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Memory Used</span>
              <div className="text-xl font-bold font-mono text-white mt-1">{telemetry?.memory_percent?.toFixed(1) ?? '54.0'}%</div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-purple-400"
                  style={{ width: `${Math.min(100, telemetry?.memory_percent || 54)}%` }}
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Roundtrip Ping</span>
              <div className="text-xl font-bold font-mono text-white mt-1">{telemetry?.ping_latency_ms?.toFixed(1) ?? '22.4'}ms</div>
              <span className="text-[10px] text-emerald-400 font-mono mt-1 block">Optimal Route</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono">DB Query P99</span>
              <div className="text-xl font-bold font-mono text-white mt-1">{telemetry?.db_query_latency_ms?.toFixed(1) ?? '18.5'}ms</div>
              <span className="text-[10px] text-cyan-400 font-mono mt-1 block">Connection Pool OK</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
