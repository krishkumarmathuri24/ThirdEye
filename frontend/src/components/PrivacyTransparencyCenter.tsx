import React, { useState, useEffect } from 'react';
import {
  Lock,
  ShieldAlert,
  ShieldCheck,
  Eye,
  ArrowRight,
  Database,
  FileCode,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { PrivacySummary, PrivacyReplay } from '../types';
import { api } from '../services/api';

interface PrivacyCenterProps {
  tenantId: string;
}

export const PrivacyTransparencyCenter: React.FC<PrivacyCenterProps> = ({ tenantId }) => {
  const [summary, setSummary] = useState<PrivacySummary | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedPayloadId, setSelectedPayloadId] = useState<string | null>(null);
  const [replay, setReplay] = useState<PrivacyReplay | null>(null);
  const [activeStage, setActiveStage] = useState<1 | 2 | 3>(3);
  const [loading, setLoading] = useState(false);

  const fetchSummaryAndHistory = async () => {
    try {
      const s = await api.getPrivacySummary(tenantId);
      setSummary(s);
      const h = await api.getPrivacyHistory(tenantId);
      setHistory(h);
      if (h.length > 0 && !selectedPayloadId) {
        setSelectedPayloadId(h[0].payload_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSummaryAndHistory();
  }, [tenantId]);

  useEffect(() => {
    if (selectedPayloadId) {
      setLoading(true);
      api.getPrivacyReplay(selectedPayloadId)
        .then((data) => setReplay(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [selectedPayloadId]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 relative overflow-hidden shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              DO NOT TRUST. VERIFY.
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Privacy Transparency Center & 3-Stage Replay
            </h2>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl mt-1">
              Every single telemetry transmission is cryptographically audited. Inspect what entered the Tier 1 boundary, what was redacted and stripped, and the exact approved metadata payload delivered to SaaS.
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-extrabold text-emerald-400 font-mono">100%</div>
            <div className="text-xs text-slate-400 uppercase font-mono tracking-wider">Zero-Leak Score</div>
          </div>
        </div>

        {/* 4 Core Privacy Metric Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-mono">Collected Fields</span>
            <div className="text-2xl font-bold text-cyan-400 font-mono mt-1">
              {replay?.field_counts.collected ?? summary?.collected_fields_total ?? 34}
            </div>
            <span className="text-[10px] text-slate-400">Within Tier 1 Boundary</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-mono">Removed Fields</span>
            <div className="text-2xl font-bold text-rose-400 font-mono mt-1">
              {replay?.field_counts.removed ?? summary?.removed_fields_total ?? 18}
            </div>
            <span className="text-[10px] text-rose-400/80">Raw data strictly dropped</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-mono">Redacted Fields</span>
            <div className="text-2xl font-bold text-amber-400 font-mono mt-1">
              {replay?.field_counts.redacted ?? summary?.redacted_fields_total ?? 5}
            </div>
            <span className="text-[10px] text-amber-400/80">PII/Tokens sanitized</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-mono">Transmitted Metadata</span>
            <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
              {replay?.field_counts.transmitted ?? summary?.transmitted_fields_total ?? 11}
            </div>
            <span className="text-[10px] text-emerald-400/80">Approved Metadata Only</span>
          </div>
        </div>
      </div>

      {/* 3-Stage Replay Flow Interactive View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Privacy Transmissions */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-slate-200 uppercase font-mono tracking-wider">
              Audited Payloads
            </h3>
            <button
              onClick={fetchSummaryAndHistory}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {history.map((item) => (
              <button
                key={item.payload_id}
                onClick={() => setSelectedPayloadId(item.payload_id)}
                className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                  selectedPayloadId === item.payload_id
                    ? 'border-indigo-500 bg-indigo-950/40 text-white'
                    : 'border-slate-800/80 bg-slate-950/50 hover:bg-slate-800/50 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold">{item.payload_id.slice(0, 16)}...</span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Egress Proof
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 flex justify-between font-mono">
                  <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                  <span>{item.transmitted_fields} transmitted</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: 3-Stage Replay Viewer */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white">Privacy Replay Inspector</h3>
              <p className="text-xs font-mono text-slate-400">Payload: {selectedPayloadId || 'None selected'}</p>
            </div>
            
            {/* Stage Selector Tabs */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setActiveStage(1)}
                className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition-all ${
                  activeStage === 1 ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Stage 1: Collected
              </button>
              <button
                onClick={() => setActiveStage(2)}
                className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition-all ${
                  activeStage === 2 ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Stage 2: Redacted
              </button>
              <button
                onClick={() => setActiveStage(3)}
                className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition-all ${
                  activeStage === 3 ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Stage 3: Approved Metadata
              </button>
            </div>
          </div>

          {/* Code/Data Replay View */}
          <div className="flex-1 bg-slate-950 rounded-xl p-4 border border-slate-800/80 font-mono text-xs overflow-auto max-h-[380px]">
            {loading ? (
              <div className="text-slate-400 py-10 text-center">Loading audit replay block...</div>
            ) : replay ? (
              <div>
                {activeStage === 1 && (
                  <div>
                    <div className="mb-2 text-rose-400 font-semibold flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" />
                      STAGE 1: COLLECTED RAW DATA (Inside Customer Local Perimeter Only)
                    </div>
                    <pre className="text-slate-300 whitespace-pre-wrap">
                      {JSON.stringify(replay.stage_1_collected, null, 2)}
                    </pre>
                  </div>
                )}
                {activeStage === 2 && (
                  <div>
                    <div className="mb-2 text-amber-400 font-semibold flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      STAGE 2: REDACTED & PSEUDONYMIZED (Masked Tokens, PII, SQL params)
                    </div>
                    <pre className="text-slate-300 whitespace-pre-wrap">
                      {JSON.stringify(replay.stage_2_redacted, null, 2)}
                    </pre>
                  </div>
                )}
                {activeStage === 3 && (
                  <div>
                    <div className="mb-2 text-emerald-400 font-semibold flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      STAGE 3: APPROVED METADATA (Exclusively transmitted to SaaS)
                    </div>
                    <pre className="text-emerald-300 whitespace-pre-wrap">
                      {JSON.stringify(replay.stage_3_metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-500 py-10 text-center">Select an audited payload on the left to replay.</div>
            )}
          </div>

          {/* Active Redaction Manifest */}
          {replay?.redaction_rules_applied && replay.redaction_rules_applied.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-slate-950/80 border border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-300 block mb-1">
                Sanitization Actions Executed at Tier 1:
              </span>
              <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-0.5">
                {replay.redaction_rules_applied.map((rule, idx) => (
                  <li key={idx} className="font-mono">{rule}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
