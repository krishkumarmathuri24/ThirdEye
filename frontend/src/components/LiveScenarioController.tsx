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
  MessageSquare,
  Smartphone,
  Send,
  RotateCcw,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { twilioService, TwilioConfig, TwilioAlertRecord } from '../services/twilio';

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

  // Twilio Configuration state
  const [twilioConfig, setTwilioConfig] = useState<TwilioConfig>(twilioService.getConfig());
  const [showTwilioConfig, setShowTwilioConfig] = useState<boolean>(true);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [alertsHistory, setAlertsHistory] = useState<TwilioAlertRecord[]>(twilioService.getHistory());
  const [configSaved, setConfigSaved] = useState(false);

  useEffect(() => {
    // Listen for incoming alerts
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
      desc: 'Simulates heavy compute thread locking pushing CPU past 95%, triggering critical Twilio alert.',
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
      if (onScenarioTriggered) {
        onScenarioTriggered();
      }
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
      if (onScenarioTriggered) {
        onScenarioTriggered();
      }
    } catch (err) {
      console.error('Failed to reset scenario:', err);
    } finally {
      setResetting(false);
    }
  };

  const handleSaveTwilio = (e: React.FormEvent) => {
    e.preventDefault();
    twilioService.saveConfig(twilioConfig);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2500);
  };

  const handleSendTestTwilio = async () => {
    setTestSending(true);
    setTestResult(null);
    try {
      const alert = await twilioService.dispatchAlert({
        title: 'Twilio Verification Test Notification',
        severity: 'high',
        metric: 'Synthetic Ping',
        value: '100% OK',
        triggerCause: 'Operator verified live Twilio sandbox integration from the ThirdEye Scenario Console.',
        preventionSteps: [
          'Verify WhatsApp Sandbox active by replying "join <keyword>" to +1 415 523 8886',
          'Keep recipient phone number in international E.164 format (e.g. +14155552671 or +919876543210)',
          'Automated threshold watchdog will notify whenever CPU/RAM >= 90%'
        ],
        tenantId,
      });

      if (alert.status === 'sent') {
        setTestResult(`Alert sent successfully to ${twilioConfig.recipientNumber}!`);
      } else {
        setTestResult(`Notification logged (Mode: ${alert.status}). Recipient: ${alert.recipient}`);
      }
    } catch (err: any) {
      setTestResult(`Notice: ${err.message || 'Notification queued'}`);
    } finally {
      setTestSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Injected Scenario Banner */}
      {activeScenario && (
        <div className="p-5 rounded-2xl border-2 border-rose-500/80 bg-rose-950/40 shadow-2xl backdrop-blur-md animate-pulse">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-rose-500 text-white font-bold tracking-wider">
                    CRITICAL ANOMALY ACTIVE
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {scenarios.find((s) => s.id === activeScenario)?.name || activeScenario}
                  </h3>
                </div>
                <p className="text-xs text-rose-200/80 mt-1">
                  Live hardware metrics spiked past critical safety threshold (&gt;90%). Automated incident ticket created & Twilio alerts dispatched.
                </p>
              </div>
            </div>

            <button
              onClick={handleReset}
              disabled={resetting}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
              <span>{resetting ? 'Restoring System...' : 'Recover / Reset to Nominal'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Twilio Notification Sandbox Setup Hub */}
      <div className="p-6 rounded-2xl border border-indigo-500/30 bg-slate-900/90 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
              <Smartphone className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Twilio Sandbox Alerts (WhatsApp & SMS)
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Threshold Watchdog (&gt;=90%) Active
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Receive instant mobile notifications whenever scenarios are triggered or live telemetry touches 90%+
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowTwilioConfig(!showTwilioConfig)}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono p-1 rounded hover:bg-slate-800 cursor-pointer"
          >
            <span>{showTwilioConfig ? 'Hide Config' : 'Configure Twilio'}</span>
            {showTwilioConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Twilio Instructions & Form */}
        {showTwilioConfig && (
          <div className="mt-5 space-y-4 text-xs">
            {/* Step-by-step WhatsApp Sandbox Instructions */}
            <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/40 flex items-start gap-3">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-slate-300">
                <span className="font-semibold text-white">How to connect Twilio WhatsApp Sandbox:</span>
                <p className="text-slate-400 leading-relaxed">
                  1. From your mobile phone, open WhatsApp and text your Twilio Sandbox join code (e.g.{' '}
                  <code className="text-cyan-300 bg-slate-950 px-1 py-0.5 rounded">join &lt;keyword&gt;</code>) to{' '}
                  <strong className="text-white">+1 415 523 8886</strong>.
                  <br />
                  2. Enter your phone number below with country code (e.g.{' '}
                  <code className="text-cyan-300 bg-slate-950 px-1 py-0.5 rounded">+14155552671</code> or{' '}
                  <code className="text-cyan-300 bg-slate-950 px-1 py-0.5 rounded">+919876543210</code>).
                  <br />
                  3. Enter your Twilio Account SID & Auth Token (or use preview mode). Click{' '}
                  <strong className="text-emerald-300">Save & Test Alert</strong>!
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveTwilio} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Twilio Account SID</label>
                <input
                  type="text"
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={twilioConfig.accountSid}
                  onChange={(e) => setTwilioConfig({ ...twilioConfig, accountSid: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Twilio Auth Token</label>
                <input
                  type="password"
                  placeholder="••••••••••••••••••••••••••••••••"
                  value={twilioConfig.authToken}
                  onChange={(e) => setTwilioConfig({ ...twilioConfig, authToken: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Twilio / Sandbox Number</label>
                <input
                  type="text"
                  placeholder="+14155238886"
                  value={twilioConfig.phoneNumber}
                  onChange={(e) => setTwilioConfig({ ...twilioConfig, phoneNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Your Mobile Number (To)</label>
                <input
                  type="text"
                  placeholder="+919876543210 or +1..."
                  value={twilioConfig.recipientNumber}
                  onChange={(e) => setTwilioConfig({ ...twilioConfig, recipientNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Channel Selector */}
              <div className="lg:col-span-2 flex items-center gap-3">
                <span className="text-[11px] font-mono text-slate-400">Dispatch Channels:</span>
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {(['whatsapp', 'sms', 'both'] as const).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setTwilioConfig({ ...twilioConfig, channel: ch })}
                      className={`px-3 py-1 rounded text-xs font-semibold capitalize transition-all cursor-pointer ${
                        twilioConfig.channel === ch
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="lg:col-span-2 flex items-center justify-end gap-3 pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {configSaved ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  <span>{configSaved ? 'Saved Settings' : 'Save Twilio Config'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendTestTwilio}
                  disabled={testSending}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${testSending ? 'animate-pulse' : ''}`} />
                  <span>{testSending ? 'Sending Test...' : 'Send Test Alert'}</span>
                </button>
              </div>
            </form>

            {testResult && (
              <div className="p-3 rounded-lg bg-slate-950 border border-emerald-500/40 text-emerald-400 text-xs font-mono">
                ✓ {testResult}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Header & Intensity Slider */}
      <div className="p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
              <PlayCircle className="w-3.5 h-3.5" />
              Active Chaos & Anomaly Injection Engine
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Interactive Failure Scenarios</h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">
              Trigger operational failure scenarios to demonstrate end-to-end anomaly detection, automated root cause analysis, live telemetry spikes, and automated Twilio WhatsApp & SMS alerts.
            </p>
          </div>

          {/* Intensity Slider */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-1 w-full sm:w-48 shrink-0">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Injection Intensity:</span>
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
          const isCurrentActive = activeScenario === sc.id;

          return (
            <div
              key={sc.id}
              className={`p-5 rounded-xl border bg-slate-900/70 flex flex-col justify-between transition-all ${
                isCurrentActive
                  ? 'border-rose-500 shadow-lg shadow-rose-950/40'
                  : `border-slate-800 ${sc.border}`
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-5 h-5 ${sc.color}`} />
                  {isCurrentActive ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold uppercase animate-pulse">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Live Anomaly</span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-white">{sc.name}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{sc.desc}</p>
              </div>

              <div className="mt-4 space-y-2">
                <button
                  onClick={() => handleTrigger(sc.id)}
                  disabled={isRunning}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                    isCurrentActive
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md'
                      : 'bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      <span>Injecting & Alerting...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{isCurrentActive ? 'Re-Inject Spike' : 'Trigger Scenario'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Execution Feedback Banner */}
      {lastResult && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-xs font-mono">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              Scenario Executed & Alert Dispatched: {lastResult.scenario}
            </div>
            <span className="text-[11px] text-slate-400">
              Correlated Incident: <strong className="text-cyan-400">{lastResult.incident?.id}</strong>
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-300">
            <div>
              Telemetry Spike: <strong className="text-rose-400">{lastResult.incident?.probable_cause?.slice(0, 35)}...</strong>
            </div>
            <div>
              Twilio Notification:{' '}
              <strong className="text-emerald-400">Dispatched via {twilioConfig.channel}</strong>
            </div>
            <div>
              Watchdog Status: <strong className="text-cyan-400">Active Monitoring (&gt;=90%)</strong>
            </div>
          </div>
        </div>
      )}

      {/* Recent Twilio Alerts History Table */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-semibold text-white">Recent Twilio Alert Dispatches</h4>
          </div>
          <span className="text-xs text-slate-500 font-mono">{alertsHistory.length} events logged</span>
        </div>

        {alertsHistory.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500 font-mono">
            No alerts triggered yet. Trigger any scenario above or let live telemetry touch 90% to generate real-time WhatsApp & SMS notifications.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80 mt-3">
            {alertsHistory.slice(0, 5).map((alert) => (
              <div key={alert.id} className="py-3 text-xs flex flex-col md:flex-row md:items-center justify-between gap-2 font-mono">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500 text-white uppercase">
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

                <div className="flex items-center gap-3 shrink-0 text-[11px]">
                  <span className="text-slate-500">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 capitalize">
                    {alert.channel}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 uppercase">
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
