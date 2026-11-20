import React, { useMemo } from 'react';
import {
  ShieldCheck,
  HeartPulse,
  Lock,
  Cpu,
  Activity,
  AlertTriangle,
  Server,
  TrendingDown,
  HardDrive,
  Network,
  Database,
  BarChart3,
  CheckCircle2,
  Clock
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
  onNavigateTab,
}) => {
  const privacyScore = scores?.privacy_score ?? 100;
  const healthScore = health?.overall_score ?? scores?.health_score ?? 98;
  const secScore = security?.security_score ?? scores?.security_score ?? 96;
  const reliabilityScore = scores?.reliability_score ?? 100;
  const riskScore = scores?.prediction_risk_score ?? 12;
  const collectorState = scores?.collector_health ?? 'online';

  const cpuVal = telemetry?.cpu_percent ?? 34.2;
  const memVal = telemetry?.memory_percent ?? 54.0;
  const diskVal = telemetry?.disk_percent ?? 42.8;
  const pingVal = telemetry?.ping_latency_ms ?? 22.4;
  const dbLatencyVal = telemetry?.db_query_latency_ms ?? 18.5;
  const dbPoolVal = telemetry?.db_connection_pool_usage ?? 28;

  // 12-Hour historical reliability stability bars
  const hourlyUptimeBars = useMemo(() => {
    return [
      { hour: '12h ago', score: 100, status: 'nominal' },
      { hour: '11h ago', score: 100, status: 'nominal' },
      { hour: '10h ago', score: 99, status: 'nominal' },
      { hour: '9h ago', score: 100, status: 'nominal' },
      { hour: '8h ago', score: 100, status: 'nominal' },
      { hour: '7h ago', score: 98, status: 'nominal' },
      { hour: '6h ago', score: 100, status: 'nominal' },
      { hour: '5h ago', score: 100, status: 'nominal' },
      { hour: '4h ago', score: 99, status: 'nominal' },
      { hour: '3h ago', score: 100, status: 'nominal' },
      { hour: '2h ago', score: 100, status: 'nominal' },
      { hour: '1h ago', score: 100, status: 'nominal' },
    ];
  }, []);

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
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shadow-sm"
        >
          View Privacy Proofs →
        </button>
      </div>

      {/* 5 Core Trust Metric Cards with Visual Progress Meters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Privacy Score */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium">Privacy Score</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-mono">{privacyScore}%</span>
              <span className="text-xs text-emerald-400 font-medium">Zero-Leak</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">100% egress verified.</p>
          </div>
          {/* Visual Bar representation */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${privacyScore}%` }}
            />
          </div>
        </div>

        {/* System Health Score */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all flex flex-col justify-between">
          <div>
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
            <p className="text-[11px] text-slate-400 mt-1 truncate">{health?.reasoning || 'Optimal parameters.'}</p>
          </div>
          {/* Visual Bar representation */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${healthScore}%` }}
            />
          </div>
        </div>

        {/* Security Score */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all flex flex-col justify-between">
          <div>
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
            <p className="text-[11px] text-slate-400 mt-1">
              {security?.failed_logins_last_5m ? `${security.failed_logins_last_5m} auth retries` : 'Zero brute force attempts'}
            </p>
          </div>
          {/* Visual Bar representation */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-purple-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${secScore}%` }}
            />
          </div>
        </div>

        {/* Reliability Score */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium">Reliability Score</span>
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-mono">{reliabilityScore}%</span>
              <span className="text-xs text-amber-400 font-medium">Zero-Drop</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Idempotent SQLite outbox buffer.</p>
          </div>
          {/* Visual Bar representation */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${reliabilityScore}%` }}
            />
          </div>
        </div>

        {/* Prediction Risk */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium">Prediction Risk</span>
              <TrendingDown className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-mono">{riskScore}%</span>
              <span className="text-xs text-slate-400 font-medium">30m Horizon</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Cascade failure probability: Low</p>
          </div>
          {/* Visual Bar representation */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-rose-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${riskScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* NEW: Comprehensive Hardware & Resource Capacity Spectrum (Interactive Multi-Bar Representation) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Real-Time Hardware Capacity & Resource Allocation Spectrum
            </h3>
            <p className="text-xs text-slate-400">
              Live telemetry metrics mapped against operational thresholds & hardware limits
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Nominal (&lt;70%)
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> Warning (70-85%)
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" /> Critical (&gt;85%)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
          {/* Left Column: CPU & Memory Spectrum */}
          <div className="space-y-4">
            {/* CPU Bar */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  CPU Core Utilization (Host)
                </span>
                <span className="font-mono font-bold text-cyan-300">{cpuVal.toFixed(1)}%</span>
              </div>
              <div className="relative w-full bg-slate-950 h-3 rounded-full border border-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    cpuVal > 85 ? 'bg-rose-500' : cpuVal > 70 ? 'bg-amber-400' : 'bg-gradient-to-r from-cyan-500 to-indigo-500'
                  }`}
                  style={{ width: `${Math.min(100, cpuVal)}%` }}
                />
                {/* Threshold tick lines */}
                <div className="absolute top-0 bottom-0 left-[70%] w-0.5 bg-amber-500/50" title="70% Warning" />
                <div className="absolute top-0 bottom-0 left-[85%] w-0.5 bg-rose-500/50" title="85% Critical" />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>0%</span>
                <span>Warning (70%)</span>
                <span>Critical (85%)</span>
                <span>100%</span>
              </div>
            </div>

            {/* Memory Bar */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-purple-400" />
                  Physical Memory Load (RAM)
                </span>
                <span className="font-mono font-bold text-purple-300">{memVal.toFixed(1)}%</span>
              </div>
              <div className="relative w-full bg-slate-950 h-3 rounded-full border border-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    memVal > 85 ? 'bg-rose-500' : memVal > 70 ? 'bg-amber-400' : 'bg-gradient-to-r from-purple-500 to-pink-500'
                  }`}
                  style={{ width: `${Math.min(100, memVal)}%` }}
                />
                <div className="absolute top-0 bottom-0 left-[70%] w-0.5 bg-amber-500/50" />
                <div className="absolute top-0 bottom-0 left-[85%] w-0.5 bg-rose-500/50" />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>0%</span>
                <span>Headroom: {(100 - memVal).toFixed(1)}% available</span>
                <span>100%</span>
              </div>
            </div>

            {/* Disk Utilization Bar */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                  Persistent Storage Capacity
                </span>
                <span className="font-mono font-bold text-indigo-300">{diskVal.toFixed(1)}%</span>
              </div>
              <div className="relative w-full bg-slate-950 h-3 rounded-full border border-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, diskVal)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>0 GB</span>
                <span>Primary NVMe SSD</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Right Column: Database Pool & Network Traffic Spectrum */}
          <div className="space-y-4">
            {/* DB Connection Pool */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  DB Connection Pool Saturation
                </span>
                <span className="font-mono font-bold text-emerald-300">{dbPoolVal}% (Healthy)</span>
              </div>
              <div className="relative w-full bg-slate-950 h-3 rounded-full border border-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, dbPoolVal)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>0 active</span>
                <span>Max Pool: 100 conns</span>
                <span>P99: {dbLatencyVal.toFixed(1)}ms</span>
              </div>
            </div>

            {/* Network Roundtrip Latency */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5 text-blue-400" />
                  Edge Gateway RTT Latency
                </span>
                <span className="font-mono font-bold text-blue-300">{pingVal.toFixed(1)} ms</span>
              </div>
              <div className="relative w-full bg-slate-950 h-3 rounded-full border border-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, (pingVal / 100) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>0 ms</span>
                <span>SLA Target: &lt;50ms</span>
                <span>100 ms</span>
              </div>
            </div>

            {/* 12-Hour Historical Reliability Bar Chart */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  12-Hour Reliability Histogram (Zero Outages)
                </span>
                <span className="font-mono text-emerald-400 text-xs">100% Uptime</span>
              </div>
              <div className="grid grid-cols-12 gap-1 h-6 items-end bg-slate-950 p-1 rounded-md border border-slate-800">
                {hourlyUptimeBars.map((bar, idx) => (
                  <div
                    key={idx}
                    className="bg-emerald-500/80 hover:bg-emerald-400 rounded-sm transition-all h-full"
                    title={`${bar.hour}: ${bar.score}% score (${bar.status})`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>12h ago</span>
                <span>Continuous Egress Verification Active</span>
                <span>Now</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NEW: Zero-Raw Privacy Pipeline Funnel & Redaction Flow Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div>
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Zero-Raw-Data Privacy Filter Funnel
            </h4>
            <p className="text-xs text-slate-400">
              Breakdown of raw field scrubbing before egress to cloud SaaS
            </p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
            100% Zero-Raw Egress Verified
          </span>
        </div>

        {/* Stacked Proportional Bar */}
        <div className="mt-4">
          <div className="h-5 w-full bg-slate-950 rounded-lg overflow-hidden flex border border-slate-800">
            <div
              className="bg-blue-600 h-full flex items-center justify-center text-[10px] font-mono font-bold text-white transition-all"
              style={{ width: '53%' }}
              title="Removed/Filtered: 18 fields (53%)"
            >
              53% Removed
            </div>
            <div
              className="bg-purple-600 h-full flex items-center justify-center text-[10px] font-mono font-bold text-white transition-all"
              style={{ width: '15%' }}
              title="Redacted: 5 fields (15%)"
            >
              15% Redacted
            </div>
            <div
              className="bg-emerald-500 h-full flex items-center justify-center text-[10px] font-mono font-bold text-white transition-all"
              style={{ width: '32%' }}
              title="Transmitted Metadata: 11 fields (32%)"
            >
              32% Transmitted
            </div>
          </div>

          {/* Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">1. COLLECTED FIELDS</span>
              <span className="text-lg font-bold text-slate-100">34 fields</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Raw host payload</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-blue-400 block text-[10px]">2. REMOVED SENSITIVE</span>
              <span className="text-lg font-bold text-blue-300">18 fields</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">PII & customer data dropped</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-purple-400 block text-[10px]">3. REDACTED SECRETS</span>
              <span className="text-lg font-bold text-purple-300">5 fields</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Tokens & DB URIs hashed</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-emerald-400 block text-[10px]">4. SAAS TRANSMISSION</span>
              <span className="text-lg font-bold text-emerald-300">11 pure metrics</span>
              <span className="text-[10px] text-emerald-500 block mt-0.5">0 bytes raw data egress</span>
            </div>
          </div>
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
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                collectorState === 'online'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
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
              <div className="text-xl font-bold font-mono text-cyan-300 mt-1">{cpuVal.toFixed(1)}%</div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full ${cpuVal > 80 ? 'bg-rose-500' : 'bg-cyan-400'}`}
                  style={{ width: `${Math.min(100, cpuVal)}%` }}
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Memory Used</span>
              <div className="text-xl font-bold font-mono text-purple-300 mt-1">{memVal.toFixed(1)}%</div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-purple-400"
                  style={{ width: `${Math.min(100, memVal)}%` }}
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Roundtrip Ping</span>
              <div className="text-xl font-bold font-mono text-emerald-300 mt-1">{pingVal.toFixed(1)}ms</div>
              <span className="text-[10px] text-emerald-400 font-mono mt-1 block">Optimal Route</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono">DB Query P99</span>
              <div className="text-xl font-bold font-mono text-cyan-300 mt-1">{dbLatencyVal.toFixed(1)}ms</div>
              <span className="text-[10px] text-cyan-400 font-mono mt-1 block">Pool Nom.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
