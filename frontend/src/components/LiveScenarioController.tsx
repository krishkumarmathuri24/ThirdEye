import React, { useState } from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';

interface ScenarioProps {
  tenantId: string;
  onScenarioTriggered?: () => void;
}

export const LiveScenarioController: React.FC<ScenarioProps> = ({ tenantId, onScenarioTriggered }) => {
  const [intensity, setIntensity] = useState<number>(1.0);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<any>(null);

  const scenarios = [
    { id: 'cpu_spike', name: 'CPU Spike & Starvation', icon: Cpu, color: 'text-rose-400', desc: 'Simulates heavy compute thread locking pushing CPU past 95%' },
    { id: 'memory_leak', name: 'Memory Leak & Thrashing', icon: Flame, color: 'text-amber-400', desc: 'Linear RAM allocation growth to 98% triggering GC pauses' },
    { id: 'disk_saturation', name: 'Disk I/O Saturation (99%)', icon: HardDrive, color: 'text-purple-400', desc: 'Simulates storage volume filling and queue backlog' },
    { id: 'latency_surge', name: 'Network Latency Surge (>240ms)', icon: Activity, color: 'text-cyan-400', desc: 'Network jitter and egress route packet degradation' },
    { id: 'packet_loss', name: 'Packet Loss Burst (>6%)', icon: Radio, color: 'text-amber-400', desc: 'Packet drop burst triggering TCP window retransmissions' },
    { id: 'db_slowdown', name: 'DB Query Contention & Lock', icon: Zap, color: 'text-rose-400', desc: 'Slow sequential table scans blocking connection pool' },
    { id: 'failed_login_flood', name: 'Credential Stuffing & Auth Storm', icon: ShieldAlert, color: 'text-rose-400', desc: '60+ failed auth attempts in window saturating crypto CPU' },
    { id: 'ddos', name: 'DDoS Traffic Flood Simulation', icon: ServerCrash, color: 'text-rose-500', desc: 'Extreme ingress wave: 55,000 KB/s RX rate with packet drops' }
  ];

  const handleTrigger = async (scenarioId: string) => {
    setTriggering(scenarioId);
    try {
      const res = await api.triggerScenario(scenarioId, intensity, tenantId);
      setLastResult(res);
      if (onScenarioTriggered) {
        onScenarioTriggered();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTriggering(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
              <PlayCircle className="w-3.5 h-3.5" />
              Live Scenario Engine
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Interactive Live Scenario Injection Panel
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">
              Trigger realistic operational failure scenarios to demonstrate end-to-end detection, alert noise reduction, root cause graph traversal, safe remediation proposals, and sub-second realtime propagation.
            </p>
          </div>

          {/* Intensity Slider */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-1 w-48">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Scenario Intensity:</span>
              <span className="text-indigo-400 font-bold">{intensity}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={intensity}
              onChange={(e) => setIntensity(parseFloat(e.target.value))}
              className="accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          const isRunning = triggering === sc.id;
          return (
            <div
              key={sc.id}
              className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-5 h-5 ${sc.color}`} />
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Interactive</span>
                </div>
                <h4 className="text-sm font-bold text-white">{sc.name}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{sc.desc}</p>
              </div>

              <button
                onClick={() => handleTrigger(sc.id)}
                disabled={isRunning}
                className="mt-4 w-full py-2 px-3 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    Injecting...
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    Trigger Scenario
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Execution Feedback Banner */}
      {lastResult && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-xs font-mono">
          <div className="flex items-center gap-2 text-emerald-400 font-bold mb-2">
            <CheckCircle2 className="w-4 h-4" />
            Scenario Executed End-to-End: {lastResult.scenario}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-300">
            <div>Anomalies Detected: <strong className="text-rose-400">{lastResult.anomalies?.length || 0}</strong></div>
            <div>Correlated Incident: <strong className="text-indigo-400">{lastResult.incident?.title?.slice(0, 30) || 'None'}</strong></div>
            <div>Realtime Broadcast: <strong className="text-emerald-400">Dispatched (&lt;1s)</strong></div>
          </div>
        </div>
      )}
    </div>
  );
};
