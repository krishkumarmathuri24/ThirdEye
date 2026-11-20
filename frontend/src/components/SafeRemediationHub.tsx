import React, { useState, useEffect } from 'react';
import {
  Wrench,
  ShieldCheck,
  Play,
  RotateCcw,
  CheckCircle2,
  Terminal,
  AlertOctagon,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Recommendation, RemediationWorkflow } from '../types';
import { api } from '../services/api';

interface RemediationProps {
  tenantId: string;
}

export const SafeRemediationHub: React.FC<RemediationProps> = ({ tenantId }) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [workflows, setWorkflows] = useState<RemediationWorkflow[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const fetchRemediationData = async () => {
    try {
      const recs = await api.getRecommendations(tenantId);
      setRecommendations(recs);
      const wfs = await api.getRemediationWorkflows(tenantId);
      setWorkflows(wfs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRemediationData();
  }, [tenantId]);

  const handlePropose = async (recId: string) => {
    setLoadingAction(recId);
    try {
      await api.proposeRemediation(recId, tenantId, 'operator_oncall');
      await fetchRemediationData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSimulate = async (remId: string) => {
    setLoadingAction(remId);
    try {
      await api.simulateRemediation(remId, tenantId, 'operator_oncall');
      await fetchRemediationData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRollback = async (remId: string) => {
    setLoadingAction(remId);
    try {
      await api.rollbackRemediation(remId, tenantId, 'operator_oncall');
      await fetchRemediationData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Human-in-the-Loop Safe Remediation
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Safe Remediation System (Sandbox Simulation & Rollback)
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">
              Zero direct infrastructure mutations without pre-flight validation. Every proposed remediation executes through a digital twin sandbox with instant rollback guarantees.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase font-mono block">Active Workflows</span>
            <span className="text-3xl font-extrabold text-amber-400 font-mono">{workflows.length}</span>
          </div>
        </div>

        {/* Workflow Lifecycle Step Indicator */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            1. Proposed
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            2. Approved
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-amber-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            3. Simulated Dry-Run
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            4. Rollback Capable
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommended Actions */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60">
          <h3 className="text-xs font-semibold text-slate-300 uppercase font-mono mb-4">
            AI-Generated Recommendations
          </h3>
          <div className="space-y-3">
            {recommendations.length === 0 ? (
              <div className="text-slate-500 text-xs p-6 text-center">No pending recommendations. System is optimal.</div>
            ) : (
              recommendations.map((rec) => (
                <div key={rec.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-sm">{rec.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 font-bold">
                      {Math.round(rec.confidence * 100)}% Conf
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">{rec.reasoning}</p>
                  
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {rec.signals.map((sig, i) => (
                      <span key={i} className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-300 border border-slate-800">
                        {sig}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handlePropose(rec.id)}
                      disabled={loadingAction === rec.id}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Propose Safe Remediation
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Remediation Workflows & Dry-Run Terminal */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col">
          <h3 className="text-xs font-semibold text-slate-300 uppercase font-mono mb-4">
            Remediation Executions & Sandbox Logs
          </h3>
          <div className="space-y-4 flex-1">
            {workflows.length === 0 ? (
              <div className="text-slate-500 text-xs p-6 text-center">No remediation workflows initiated yet.</div>
            ) : (
              workflows.map((wf) => (
                <div key={wf.remediation_id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-slate-400">{wf.remediation_id}</span>
                      <h4 className="font-bold text-white text-xs">{wf.action_name}</h4>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      wf.status === 'simulated' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      wf.status === 'rolled_back' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                      'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    }`}>
                      {wf.status}
                    </span>
                  </div>

                  {/* Terminal Simulation Log */}
                  <div className="p-3 rounded-lg bg-black border border-slate-800/80 font-mono text-[11px] text-emerald-400 whitespace-pre-wrap max-h-36 overflow-y-auto">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] pb-1 mb-1 border-b border-slate-800">
                      <Terminal className="w-3 h-3 text-cyan-400" />
                      Digital Twin Simulation Output:
                    </div>
                    {wf.simulation_output}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-mono text-slate-400">
                      Operator: <strong className="text-slate-200">{wf.operator}</strong>
                    </span>
                    <div className="flex items-center gap-2">
                      {wf.status === 'proposed' && (
                        <button
                          onClick={() => handleSimulate(wf.remediation_id)}
                          disabled={loadingAction === wf.remediation_id}
                          className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs cursor-pointer"
                        >
                          Run Digital Twin Simulation
                        </button>
                      )}
                      {wf.status === 'simulated' && (
                        <button
                          onClick={() => handleRollback(wf.remediation_id)}
                          disabled={loadingAction === wf.remediation_id}
                          className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Rollback to Snapshot
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
