import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  ShieldCheck,
  Hash,
  Clock,
  User,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { AuditRecord } from '../types';
import { api } from '../services/api';

interface AuditProps {
  tenantId: string;
}

export const AuditLogViewer: React.FC<AuditProps> = ({ tenantId }) => {
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [verification, setVerification] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  const fetchLogs = async () => {
    try {
      const data = await api.getAuditLogs(tenantId);
      setLogs(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await api.verifyAuditChain(tenantId);
      setVerification(res);
    } catch (err) {
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    handleVerify();
  }, [tenantId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-bold text-white tracking-tight">
                Cryptographic Audit Log & SHA-256 Hash Chain
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Every system event—telemetry ingestion, anomaly detection, incident creation, remediation execution, and rollback—is linked via cryptographic hash chaining: <code>Current = SHA256(PrevHash + Details + Timestamp)</code>.
            </p>
          </div>

          <button
            onClick={handleVerify}
            disabled={verifying}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            {verifying ? 'Verifying Hashes...' : 'Verify Cryptographic Chain'}
          </button>
        </div>

        {/* Verification status card */}
        {verification && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="text-emerald-400 flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              Hash Chain Status: UNBROKEN ({verification.blocks_count} Blocks Audited)
            </span>
            <span className="text-slate-400">
              Latest Block Hash: <strong className="text-cyan-400">{verification.latest_hash?.slice(0, 24)}...</strong>
            </span>
          </div>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
        <h3 className="text-xs font-semibold text-slate-300 uppercase font-mono mb-4">
          Immutable Audit Blocks
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr>
                <th className="pb-3">Block ID</th>
                <th className="pb-3">Timestamp (UTC)</th>
                <th className="pb-3">Action Type</th>
                <th className="pb-3">Actor</th>
                <th className="pb-3">Previous Hash</th>
                <th className="pb-3">Current Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {logs.map((block) => (
                <tr key={block.id} className="hover:bg-slate-800/30">
                  <td className="py-2.5 font-bold text-white">{block.id}</td>
                  <td className="py-2.5 text-slate-400">{new Date(block.timestamp).toLocaleTimeString()}</td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold">
                      {block.action_type}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-400">{block.actor}</td>
                  <td className="py-2.5 text-slate-500">{block.prev_hash.slice(0, 12)}...</td>
                  <td className="py-2.5 text-cyan-400 font-bold">{block.current_hash.slice(0, 12)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
