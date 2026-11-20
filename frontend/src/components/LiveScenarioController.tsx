import React, { useState, useEffect } from 'react';
import {
  PlayCircle,
  Cpu,
  Flame,
  HardDrive,
  Activity,
  ShieldAlert,
  Radio,
  ServerCrash,
  Zap,
  CheckCircle2,
  Bell,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../services/api';
import { twilioService, TwilioAlertRecord } from '../services/twilio';

interface ScenarioProps {
  tenantId: string;
  onScenarioTriggered?: () => void;
}

export const LiveScenarioController: React.FC<ScenarioProps> = ({ tenantId, onScenarioTriggered }) => {
  const [intensity, setIntensity] = useState<number>(1.0);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<any>(null);
  const [resetting, setResetting] = useState(false);
  const [alertsHistory, setAlertsHistory] = useState<TwilioAlertRecord[]>(twilioService.getHistory());

  useEffect(() => {
    // Subscribe to incoming Twilio alert records
    const unsub = twilioService.subscribe((alert) => {
      setAlertsHistory((prev) => [alert, ...prev.slice(0, 19)]);
    });
    return unsub;
  }, []);

  const scenarios = [
    {
      id: 'cpu_spike',
      name: 'CPU Spike & Thread Starvation (95%)',
      icon: Cpu,
      color: 'text-rose-400',
      border: 'hover:border-rose-500/50',
      desc: 'Simulates heavy compute thread locking pushing CPU past 95%, triggering critical alert.',
    },
    {
      id: 'memory_leak',
      name: 'Memory Leak & Heap Thrashing (98%)',
      icon: Flame,
      color: 'text-amber-400',
      border: 'hover:border-amber-500/50',
      desc: 'Linear RAM allocation growth to 98% triggering GC pauses and threshold breach.',
    },
    {
      id: 'disk_saturation',
      name: 'Disk I/O Saturation (99.2%)',
      icon: HardDrive,
      color: 'text-purple-400',
      border: 'hover:border-purple-500/50',
      desc: 'Simulates storage volume filling to capacity with unrotated logs & buffer backlog.',
    },
    {
      id: 'latency_surge',
      name: 'Network Latency Surge (>240ms)',
      icon: Activity,
      color: 'text-cyan-400',
      border: 'hover:border-cyan-500/50',
      desc: 'Egress route packet degradation and DNS retry wave causing critical P99 latency spike.',
    },
    {
      id: 'packet_loss',
      name: 'Packet Loss Burst (>7%)',
      icon: Radio,
      color: 'text-amber-400',
      border: 'hover:border-amber-500/50',
      desc: 'Packet drop burst triggering TCP window collapse and socket retransmission storms.',
    },
    {
      id: 'db_slowdown',
      name: 'DB Query Lock Contention (160ms)',
      icon: Zap,
      color: 'text-rose-400',
      border: 'hover:border-rose-500/50',
      desc: 'Slow sequential table scans holding exclusive row locks blocking connection pool.',
    },
    {
      id: 'failed_login_flood',
      name: 'Credential Stuffing Auth Storm (74/5m)',
      icon: ShieldAlert,
      color: 'text-rose-400',
      border: 'hover:border-rose-500/50',
      desc: '65+ distributed failed auth attempts saturating cryptographic password hashing.',
    },
    {
      id: 'ddos',
      name: 'Volumetric DDoS Wave (55,000 KB/s)',
      icon: ServerCrash,
      color: 'text-rose-500',
      border: 'hover:border-rose-500/50',
      desc: 'Massive ingress traffic wave overwhelming edge routers with SYN flood packets.',
    },
  ];

  const handleTrigger = async (scenarioId: string) => {
    setTriggering(scenarioId);
    try {
      const res = await api.triggerScenario(scenarioId, intensity, tenantId);
      setLastResult(res);
      setActiveScenario(scenarioId);
      if (onScenarioTriggered) onScenarioTriggered();
    } catch (err) {
      console.error('Failed to trigger scenario:', err);
    } finally {
      setTriggering(null);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await api.resetScenario(tenantId);
      setActiveScenario(null);
      setLastResult(null);
      if (onScenarioTriggered) onScenarioTriggered();
    } catch (err) {
      console.error('Failed to reset scenario:', err);
    } finally {
      setResetting(false);
    }
  };

  const severityColor = (s: string) => {
    if (s === 'critical') return 'bg-rose-500 text-white';
    if (s === 'high') return 'bg-orange-500 text-white';
    if (s === 'warning') return 'bg-yellow-500 text-black';
    return 'bg-slate-700 text-slate-200';
  };

  const statusColor = (s: string) => {
    if (s === 'sent') return 'bg-emerald-950 text-emerald-400 border border-emerald-800';
    if (s === 'simulated') return 'bg-blue-950 text-blue-400 border border-blue-800';
    return 'bg-rose-950 text-rose-400 border border-rose-800';
  };

  return (
    <div className="space-y-6">
      {/* ── Active Scenario Banner ─────────────────────────── */}
      {activeScenario && (
        <div className="p-5 rounded-2xl border-2 border-rose-500/80 bg-rose-950/40 shadow-2xl backdrop-blur-md animate-pulse">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-rose-500 text-white font-bold tracking-wider">
                    CRITICAL ANOMALY ACTIVE
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {scenarios.find((s) => s.id === activeScenario)?.name || activeScenario}
                  </h3>
                </div>
                <p className="text-xs text-rose-200/80 mt-1">
                  WhatsApp &amp; SMS alert dispatched automatically. Reset to restore baseline.
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              disabled={resetting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold transition-all disabled:opacity-50"
            >
              {resetting ? (
                <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4 text-cyan-400" />
              )}
              Reset Baseline
            </button>
          </div>
        </div>
      )}

      {/* ── Intensity Slider ───────────────────────────────── */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Injection Intensity
          </label>
          <span className="text-xs font-mono text-cyan-400 font-bold">
            {(intensity * 100).toFixed(0)}%
          </span>
        </div>
        <input
          type="range"
          min={0.1}
          max={2.0}
          step={0.05}
          value={intensity}
          onChange={(e) => setIntensity(parseFloat(e.target.value))}
          className="w-full accent-cyan-500"
        />
        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
          <span>Low (10%)</span>
          <span>Nominal (100%)</span>
          <span>Extreme (200%)</span>
        </div>
      </div>

      {/* ── Scenario Cards Grid ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {scenarios.map((scenario) => {
          const Icon = scenario.icon;
          const isRunning = triggering === scenario.id;
          const isCurrentActive = activeScenario === scenario.id;

          return (
            <div
              key={scenario.id}
              className={`group relative p-5 rounded-2xl border transition-all duration-200 cursor-default
                bg-slate-900/70 backdrop-blur-sm
                ${isCurrentActive
                  ? 'border-rose-500/70 shadow-rose-900/40 shadow-lg'
                  : `border-slate-800 ${scenario.border}`
                }`}
            >
              {isCurrentActive && (
                <div className="absolute top-3 right-3">
                  <span className="flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                  </span>
                </div>
              )}

              <div className="flex items-start gap-3 mb-3">
                <div
                  className={`p-2 rounded-xl border ${
                    isCurrentActive
                      ? 'bg-rose-900/40 border-rose-500/40'
                      : 'bg-slate-800/80 border-slate-700/50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${scenario.color}`} />
                </div>
                <h3 className="text-sm font-bold text-slate-100 leading-tight">{scenario.name}</h3>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed mb-4">{scenario.desc}</p>

              <button
                onClick={() => handleTrigger(scenario.id)}
                disabled={!!triggering}
                className={`w-full py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                  isCurrentActive
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md'
                    : 'bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40'
                }`}
              >
                {isRunning ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    <span>Injecting &amp; Alerting...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isCurrentActive ? 'Re-Inject Spike' : 'Trigger Scenario'}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Execution Feedback ─────────────────────────────── */}
      {lastResult && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-xs font-mono">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              Scenario Executed &amp; Alert Dispatched: {lastResult.scenario}
            </div>
            <span className="text-[11px] text-slate-400">
              Incident:{' '}
              <strong className="text-cyan-400">{lastResult.incident?.id}</strong>
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-300">
            <div>
              Telemetry Spike:{' '}
              <strong className="text-rose-400">
                {lastResult.incident?.probable_cause?.slice(0, 35)}...
              </strong>
            </div>
            <div>
              Notification:{' '}
              <strong className="text-emerald-400">WhatsApp &amp; SMS dispatched</strong>
            </div>
            <div>
              Watchdog:{' '}
              <strong className="text-cyan-400">Active (&gt;=90% auto-alert)</strong>
            </div>
          </div>
        </div>
      )}

      {/* ── Alert Dispatch History ─────────────────────────── */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-semibold text-white">Recent Alert Dispatches</h4>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-mono">{alertsHistory.length} events</span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              WhatsApp + SMS
            </span>
          </div>
        </div>

        {alertsHistory.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500 font-mono">
            No alerts yet. Trigger any scenario above, or let live telemetry touch 90% — alerts fire
            automatically via WhatsApp &amp; SMS.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80 mt-3">
            {alertsHistory.slice(0, 6).map((alert) => (
              <div
                key={alert.id}
                className="py-3 text-xs flex flex-col md:flex-row md:items-start justify-between gap-2 font-mono"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${severityColor(
                        alert.severity
                      )}`}
                    >
                      {alert.severity}
                    </span>
                    <strong className="text-slate-200">{alert.title}</strong>
                    {alert.metric && (
                      <span className="text-cyan-400 text-[11px]">
                        [{alert.metric}: {alert.value}]
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-[11px] truncate max-w-2xl font-sans">
                    <strong>Cause:</strong> {alert.triggerCause}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 text-[11px]">
                  <span className="text-slate-500">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 capitalize">
                    {alert.channel}
                  </span>
                  <span className={`px-2 py-0.5 rounded uppercase ${statusColor(alert.status)}`}>
                    {alert.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
