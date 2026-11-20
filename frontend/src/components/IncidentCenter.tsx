import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  GitBranch,
  Clock,
  Sparkles,
  CheckCircle2,
  Cpu,
  Activity,
  Layers,
  HelpCircle,
  Database,
  ArrowRight
} from 'lucide-react';
import { Incident } from '../types';
import { api } from '../services/api';

interface IncidentCenterProps {
  tenantId: string;
}

export const IncidentCenter: React.FC<IncidentCenterProps> = ({ tenantId }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [resolving, setResolving] = useState(false);

  const fetchIncidents = async () => {
    try {
      const data = await api.getIncidents(tenantId);
      setIncidents(data);
      if (data.length > 0 && !selectedIncident) {
        // Fetch full detail for the first incident
        const full = await api.getIncidentDetail(data[0].id);
        setSelectedIncident(full);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [tenantId]);

  const handleSelectIncident = async (inc: Incident) => {
    try {
      const full = await api.getIncidentDetail(inc.id);
      setSelectedIncident(full);
    } catch {
      setSelectedIncident(inc);
    }
  };

  const handleResolve = async (incidentId: string) => {
    setResolving(true);
    try {
      await api.resolveIncident(incidentId, 'operator_oncall');
      await fetchIncidents();
      if (selectedIncident && selectedIncident.id === incidentId) {
        setSelectedIncident({ ...selectedIncident, status: 'resolved' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-5 rounded-2xl border border-rose-500/20 bg-gradient-to-r from-slate-900 via-rose-950/20 to-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold mb-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              Explainable AIOps & Alert Correlation
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Incident Correlation, Causal Root Cause & Memory
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">
              Third Eye eliminates alert fatigue by correlating dozens of isolated metric deviations into unified incidents. Follow causal dependency chains and query semantic incident vector memory for proven resolutions.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase font-mono block">Active Incidents</span>
            <span className="text-3xl font-extrabold text-white font-mono">
              {incidents.filter((i) => i.status === 'active').length}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident Selector List */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
          <h3 className="text-xs font-semibold text-slate-300 uppercase font-mono mb-3">
            Correlated Incidents
          </h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {incidents.length === 0 ? (
              <div className="text-slate-500 text-xs p-4 text-center">No incidents active. System is healthy.</div>
            ) : (
              incidents.map((inc) => (
                <button
                  key={inc.id}
                  onClick={() => handleSelectIncident(inc)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                    selectedIncident?.id === inc.id
                      ? 'border-rose-500/60 bg-rose-950/30 text-white'
                      : 'border-slate-800/80 bg-slate-950/60 hover:bg-slate-850 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      inc.severity === 'critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {inc.severity}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(inc.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold line-clamp-2 mt-1">{inc.title}</h4>
                  <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between font-mono">
                    <span>{inc.affected_systems.join(', ')}</span>
                    <span className="text-indigo-400 font-bold">{Math.round(inc.confidence * 100)}% Conf</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Incident Detail & Root Cause Graph */}
        <div className="lg:col-span-2 space-y-6">
          {selectedIncident ? (
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 space-y-6">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-slate-400">{selectedIncident.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                      selectedIncident.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {selectedIncident.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">{selectedIncident.title}</h3>
                </div>

                {selectedIncident.status === 'active' && (
                  <button
                    onClick={() => handleResolve(selectedIncident.id)}
                    disabled={resolving}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                  >
                    {resolving ? 'Resolving...' : 'Mark Incident Resolved'}
                  </button>
                )}
              </div>

              {/* Root Cause Causal Graph Path */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase font-mono flex items-center gap-2 mb-3">
                  <GitBranch className="w-4 h-4 text-purple-400" />
                  Root Cause Dependency Chain
                </h4>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    {selectedIncident.root_cause_chain.map((step, idx) => (
                      <React.Fragment key={idx}>
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-200 flex-1">
                          <span className="text-[10px] font-mono text-indigo-400 block mb-0.5">Step {idx + 1}</span>
                          {step}
                        </div>
                        {idx < selectedIncident.root_cause_chain.length - 1 && (
                          <ArrowRight className="w-4 h-4 text-slate-600 shrink-0 hidden sm:block" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/60 leading-relaxed">
                    <strong className="text-slate-200 font-semibold">Probable Cause:</strong> {selectedIncident.probable_cause}
                  </p>
                </div>
              </div>

              {/* Explainable AIOps: Contributing Signals */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase font-mono flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Explainable AIOps Signal Breakdown
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {selectedIncident.explainability.contributing_signals?.map((sig, i) => (
                    <div key={i} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                      <span className="text-[11px] text-slate-400 block">{sig.signal}</span>
                      <div className="text-sm font-bold font-mono text-white mt-1">{sig.value}</div>
                      <span className="text-[10px] font-mono text-amber-400 mt-0.5 block">{sig.delta}</span>
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 mt-3 text-xs text-slate-300 leading-relaxed font-sans">
                  {selectedIncident.explainability.reasoning_narrative}
                </div>
              </div>

              {/* Chronological Incident Timeline */}
              {selectedIncident.timeline && selectedIncident.timeline.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase font-mono flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-amber-400" />
                    Minute-by-Minute Timeline Progression
                  </h4>
                  <div className="space-y-2 border-l-2 border-slate-800 pl-4 ml-2">
                    {selectedIncident.timeline.map((event, idx) => (
                      <div key={idx} className="relative text-xs">
                        <div className="absolute -left-[22px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-slate-900" />
                        <span className="font-mono text-[10px] text-slate-400">{event.timestamp}</span>
                        <div className="font-semibold text-slate-200 mt-0.5">{event.event_title}</div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{event.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Incident Memory: Similar Historical Incidents */}
              {selectedIncident.vector_memory_matches && selectedIncident.vector_memory_matches.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase font-mono flex items-center gap-2 mb-3">
                    <Database className="w-4 h-4 text-emerald-400" />
                    AI Incident Memory (Semantic Vector Search)
                  </h4>
                  <div className="space-y-2">
                    {selectedIncident.vector_memory_matches.map((match) => (
                      <div key={match.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-slate-200">{match.title}</span>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">
                            {Math.round(match.similarity_score * 100)}% Cosine Match
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mb-1">
                          <span className="text-slate-300">Root Cause:</span> {match.root_cause}
                        </p>
                        <p className="text-[11px] text-emerald-300 bg-emerald-950/20 p-2 rounded border border-emerald-900/30">
                          <span className="font-semibold">Proven Resolution:</span> {match.previous_resolution}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 border border-slate-800 rounded-xl bg-slate-900/40">
              Select an incident from the left to view root cause trees, signal breakdowns, and timeline.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
