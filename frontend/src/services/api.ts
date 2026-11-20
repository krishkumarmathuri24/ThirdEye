import {
  TelemetryData,
  TrustScores,
  HealthState,
  SecurityState,
  Incident,
  PrivacySummary,
  PrivacyReplay,
  EgressProof,
  ForecastPrediction,
  Recommendation,
  RemediationWorkflow,
  CollectorState,
  AuditRecord
} from '../types';

// In production, VITE_API_BASE_URL points to the deployed Railway backend.
// In dev, Vite proxy forwards /api -> localhost:8000.
const BACKEND = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE = `${BACKEND}/api/v1`;

export const api = {
  // Telemetry
  getLatestTelemetry: async (tenantId: string): Promise<TelemetryData> => {
    const res = await fetch(`${API_BASE}/telemetry/latest?tenant_id=${tenantId}`);
    return res.json();
  },
  getTelemetryHistory: async (tenantId: string, limit: number = 30): Promise<TelemetryData[]> => {
    const res = await fetch(`${API_BASE}/telemetry/history?tenant_id=${tenantId}&limit=${limit}`);
    return res.json();
  },

  // Trust, Health, Security
  getTrustScores: async (tenantId: string): Promise<TrustScores> => {
    const res = await fetch(`${API_BASE}/trust?tenant_id=${tenantId}`);
    return res.json();
  },
  getHealth: async (tenantId: string): Promise<HealthState> => {
    const res = await fetch(`${API_BASE}/health?tenant_id=${tenantId}`);
    return res.json();
  },
  getSecurity: async (tenantId: string): Promise<SecurityState> => {
    const res = await fetch(`${API_BASE}/security?tenant_id=${tenantId}`);
    return res.json();
  },

  // Privacy & Egress
  getPrivacySummary: async (tenantId: string): Promise<PrivacySummary> => {
    const res = await fetch(`${API_BASE}/privacy/summary?tenant_id=${tenantId}`);
    return res.json();
  },
  getPrivacyHistory: async (tenantId: string): Promise<any[]> => {
    const res = await fetch(`${API_BASE}/privacy/history?tenant_id=${tenantId}`);
    return res.json();
  },
  getPrivacyReplay: async (payloadId: string): Promise<PrivacyReplay> => {
    const res = await fetch(`${API_BASE}/privacy/replay/${payloadId}`);
    return res.json();
  },
  getEgressProofs: async (tenantId: string): Promise<EgressProof[]> => {
    const res = await fetch(`${API_BASE}/privacy/egress-proofs?tenant_id=${tenantId}`);
    return res.json();
  },

  // Incidents
  getIncidents: async (tenantId: string, status: string = 'all'): Promise<Incident[]> => {
    const res = await fetch(`${API_BASE}/incidents?tenant_id=${tenantId}&status=${status}`);
    return res.json();
  },
  getIncidentDetail: async (incidentId: string): Promise<Incident> => {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}`);
    return res.json();
  },
  resolveIncident: async (incidentId: string, operator: string = 'operator_oncall'): Promise<any> => {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/resolve?operator=${operator}`, {
      method: 'POST'
    });
    return res.json();
  },

  // Forecasting
  getForecasts: async (tenantId: string): Promise<ForecastPrediction[]> => {
    const res = await fetch(`${API_BASE}/forecasting?tenant_id=${tenantId}`);
    return res.json();
  },

  // Remediation
  getRecommendations: async (tenantId: string): Promise<Recommendation[]> => {
    const res = await fetch(`${API_BASE}/remediation/recommendations?tenant_id=${tenantId}`);
    return res.json();
  },
  getRemediationWorkflows: async (tenantId: string): Promise<RemediationWorkflow[]> => {
    const res = await fetch(`${API_BASE}/remediation/workflows?tenant_id=${tenantId}`);
    return res.json();
  },
  proposeRemediation: async (recommendationId: string, tenantId: string, operator: string): Promise<RemediationWorkflow> => {
    const res = await fetch(`${API_BASE}/remediation/propose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recommendation_id: recommendationId, tenant_id: tenantId, operator })
    });
    return res.json();
  },
  simulateRemediation: async (remediationId: string, tenantId: string, operator: string): Promise<RemediationWorkflow> => {
    const res = await fetch(`${API_BASE}/remediation/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remediation_id: remediationId, tenant_id: tenantId, operator })
    });
    return res.json();
  },
  rollbackRemediation: async (remediationId: string, tenantId: string, operator: string): Promise<RemediationWorkflow> => {
    const res = await fetch(`${API_BASE}/remediation/rollback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remediation_id: remediationId, tenant_id: tenantId, operator })
    });
    return res.json();
  },

  // Copilot
  askCopilot: async (question: string, tenantId: string): Promise<{ answer: string; grounded_facts: any; source: string }> => {
    const res = await fetch(`${API_BASE}/copilot/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, tenant_id: tenantId })
    });
    return res.json();
  },

  // Scenarios
  triggerScenario: async (scenarioType: string, intensity: number = 1.0, tenantId: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/scenarios/trigger?tenant_id=${tenantId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_type: scenarioType, intensity })
    });
    return res.json();
  },
  getScenariosList: async (): Promise<any> => {
    const res = await fetch(`${API_BASE}/scenarios/list`);
    return res.json();
  },

  // Audit
  getAuditLogs: async (tenantId: string): Promise<AuditRecord[]> => {
    const res = await fetch(`${API_BASE}/audit/logs?tenant_id=${tenantId}`);
    return res.json();
  },
  verifyAuditChain: async (tenantId: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/audit/verify?tenant_id=${tenantId}`);
    return res.json();
  },

  // Collector
  getCollectorStatus: async (tenantId: string): Promise<CollectorState> => {
    const res = await fetch(`${API_BASE}/collector/status?tenant_id=${tenantId}`);
    return res.json();
  }
};
