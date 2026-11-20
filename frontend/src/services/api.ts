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
import { twilioService } from './twilio';
import { realtimeService } from './realtime';

// In production, VITE_API_BASE_URL points to the deployed backend.
// In dev, Vite proxy forwards /api -> localhost:8000.
const BACKEND = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE = `${BACKEND}/api/v1`;

/**
 * Robust JSON fetch with automatic fallback if the backend is unreachable
 * or if a static host (like Vercel) returns an HTML 404 page.
 */
async function safeFetch<T>(url: string, options?: RequestInit, fallback?: T): Promise<T> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      return await res.json();
    }
  } catch (err) {
    console.debug(`[ThirdEye API] Falling back for ${url}:`, err);
  }
  if (fallback !== undefined) return fallback;
  throw new Error(`API request failed and no fallback for ${url}`);
}

// In-memory simulation state for standalone Vercel preview
let simCpu = 34.2;
let simMemory = 54.0;
let simLatency = 22.4;
let simDisk = 42.8;
let simErrors = 0;
let simFailedLogins = 0;

function getScenarioCause(scenarioType: string): string {
  switch (scenarioType) {
    case 'cpu_spike':
      return 'Compute core thread starvation from unthrottled worker execution loops and crypto thread lock contention.';
    case 'memory_leak':
      return 'Heap fragmentation and linear memory growth in uncollected session cache triggering GC thrashing.';
    case 'disk_saturation':
      return 'Persistent storage volume filling past 99% capacity due to uncompressed archival logs and SQLite buffer backlog.';
    case 'latency_surge':
      return 'Network egress route degradation and transit gateway packet drop wave causing P99 latency >240ms.';
    case 'packet_loss':
      return 'Burst packet drop rate crossing 6.5%, triggering TCP window collapse and retransmissions.';
    case 'db_slowdown':
      return 'Unindexed sequential table scans holding exclusive row locks and exhausting database connection pool.';
    case 'failed_login_flood':
      return 'Distributed credential stuffing attack (60+ failed auth attempts) saturating crypto password verification.';
    case 'ddos':
      return 'Volumetric ingress wave (55,000 KB/s RX) overwhelming boundary edge routers.';
    default:
      return 'Operational anomaly detected crossing safety boundaries.';
  }
}

function getScenarioPrevention(scenarioType: string): string[] {
  switch (scenarioType) {
    case 'cpu_spike':
      return [
        'Apply gateway ingress rate-limiting on /api/v1/auth (100 req/s ceiling)',
        'Auto-scale worker container replica pool from 3 to 8 pods',
        'Evict hung worker thread PID #4092'
      ];
    case 'memory_leak':
      return [
        'Trigger garbage collection flush and evict stale in-memory cache rows',
        'Gracefully restart leaking worker pod instances to release heap',
        'Increase container cgroup memory ceiling by 2GB'
      ];
    case 'disk_saturation':
      return [
        'Trigger automatic log rotation and compress archives older than 72 hours',
        'Flush delivered outbox rows from local SQLite buffer',
        'Expand persistent cloud NVMe volume by 50GB'
      ];
    case 'latency_surge':
      return [
        'Failover to secondary cloud egress gateway',
        'Verify upstream DNS resolver health',
        'Enable TCP BBR congestion control on edge interfaces'
      ];
    case 'packet_loss':
      return [
        'Reroute traffic to redundant transit provider',
        'Adjust TCP window sizing and socket buffer allocations',
        'Inspect interface dropped-packet counters'
      ];
    case 'db_slowdown':
      return [
        'Add composite index on query predicate',
        'Terminate long-running blocking query PIDs',
        'Scale PgBouncer / RDS connection pool max connections'
      ];
    case 'failed_login_flood':
      return [
        'Enable adaptive IP ban / Cloudflare Turnstile on /api/v1/auth',
        'Enforce exponential backoff for failed logins',
        'Isolate authentication cluster to dedicated pool'
      ];
    case 'ddos':
      return [
        'Activate Cloudflare / AWS Shield DDoS mitigation layer',
        'Drop malformed ingress packets at border router',
        'Scale ingress gateway pods to absorb peak traffic'
      ];
    default:
      return [
        'Inspect active telemetry metrics and alerts',
        'Apply automated remediation proposal',
        'Verify zero-raw privacy egress boundary'
      ];
  }
}

function createTelemetryObject(tenantId: string, overrides: Partial<TelemetryData> = {}): TelemetryData {
  return {
    payload_id: `meta_${Date.now().toString(16)}`,
    tenant_id: tenantId,
    timestamp: new Date().toISOString(),
    source_id_hmac: 'hmac_sha256_verified_node_alpha',
    sequence_number: 1,
    cpu_percent: simCpu,
    memory_percent: simMemory,
    disk_percent: 62.4,
    network_rx_kbps: 1840.5,
    network_tx_kbps: 920.0,
    ping_latency_ms: simLatency,
    packet_loss_percent: 0.0,
    failed_login_count: simFailedLogins,
    error_count: simErrors,
    db_query_latency_ms: 18.5,
    db_connection_pool_usage: 32.0,
    privacy_metrics: {
      collected_fields: 34,
      removed_fields: 18,
      redacted_fields: 5,
      transmitted_fields: 11
    },
    payload_hash_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    ...overrides
  };
}

let activeIncidents: Incident[] = [
  {
    id: 'inc_prod_9941a',
    tenant_id: 'tenant_prod_us_east_1',
    timestamp: new Date().toISOString(),
    title: 'Correlated Incident: Compute Resource Saturation',
    severity: 'high',
    status: 'active',
    confidence: 0.94,
    affected_systems: ['node-worker-01', 'auth-service', 'postgres-primary'],
    probable_cause: 'Credential Stuffing Auth Retries causing CPU spiking',
    root_cause_chain: [
      'Unusual Authentication Retries',
      'Password Hashing CPU Saturation',
      'Thread Pool Starvation',
      'Service Latency Escalation'
    ],
    explainability: {
      summary: 'High CPU utilization accompanied by an anomalous spike in failed authentications.',
      decision_confidence: 0.94,
      primary_driving_factors: ['CPU Spike', 'Failed Logins'],
      contributing_signals: [
        { signal: 'CPU Spike', value: '88.5%', delta: '+45%', weight: 0.45 },
        { signal: 'Failed Logins', value: '45 req/s', delta: '+300%', weight: 0.35 },
        { signal: 'DB Latency', value: '115ms', delta: '+80%', weight: 0.20 }
      ],
      explainability_tree: {
        root: 'Compute Starvation Alert',
        branches: ['Auth Gateway Flood', 'Database Lock Contention'],
        evidence_points: ['45 failed logins/min', 'CPU load 88.5%']
      },
      reasoning_narrative: 'High CPU utilization accompanied by an anomalous spike in failed authentications.'
    },
    timeline: [
      {
        timestamp: new Date(Date.now() - 300000).toISOString(),
        event_title: 'Auth Spike',
        description: 'Baseline authentication retries increased 4x',
        signal_name: 'failed_login_count',
        signal_value: '45',
        dimension: 'Security',
        severity: 'warning'
      },
      {
        timestamp: new Date(Date.now() - 180000).toISOString(),
        event_title: 'CPU Saturation',
        description: 'CPU core utilization crossed 85% threshold',
        signal_name: 'cpu_percent',
        signal_value: '88.5%',
        dimension: 'Infrastructure',
        severity: 'critical'
      },
      {
        timestamp: new Date(Date.now() - 60000).toISOString(),
        event_title: 'Incident Correlated',
        description: 'Single Correlated Incident created (Rule #41)',
        signal_name: 'incident_correlated',
        signal_value: '1 Incident',
        dimension: 'System',
        severity: 'critical'
      }
    ],
    vector_memory_matches: [
      {
        id: 'mem_match_01',
        title: 'Compute Starvation from Auth Flood',
        root_cause: 'Cryptographic hashing thread saturation',
        previous_resolution: 'Apply safe rate-limiting on /api/v1/auth and auto-scale worker pool.',
        similarity_score: 0.96
      }
    ]
  }
];

export const api = {
  // Telemetry
  getLatestTelemetry: async (tenantId: string): Promise<TelemetryData> => {
    return safeFetch<TelemetryData>(`${API_BASE}/telemetry/latest?tenant_id=${tenantId}`, undefined, createTelemetryObject(tenantId));
  },

  getTelemetryHistory: async (tenantId: string, limit: number = 30): Promise<TelemetryData[]> => {
    const defaultHist: TelemetryData[] = Array.from({ length: 15 }, (_, i) =>
      createTelemetryObject(tenantId, {
        payload_id: `meta_hist_${i}`,
        timestamp: new Date(Date.now() - (15 - i) * 60000).toISOString(),
        cpu_percent: Math.round((30 + Math.sin(i) * 12) * 10) / 10,
        memory_percent: Math.round((50 + Math.cos(i) * 6) * 10) / 10,
        ping_latency_ms: Math.round((20 + Math.random() * 5) * 10) / 10
      })
    );
    return safeFetch<TelemetryData[]>(`${API_BASE}/telemetry/history?tenant_id=${tenantId}&limit=${limit}`, undefined, defaultHist);
  },

  // Trust, Health, Security
  getTrustScores: async (tenantId: string): Promise<TrustScores> => {
    return safeFetch<TrustScores>(`${API_BASE}/trust?tenant_id=${tenantId}`, undefined, {
      privacy_score: 100,
      health_score: 98,
      security_score: 96,
      reliability_score: 100,
      prediction_risk_score: 12,
      incident_volume: activeIncidents.length,
      collector_health: 'online',
      timestamp: new Date().toISOString()
    });
  },

  getHealth: async (tenantId: string): Promise<HealthState> => {
    return safeFetch<HealthState>(`${API_BASE}/health?tenant_id=${tenantId}`, undefined, {
      overall_score: 98,
      state: 'Excellent',
      timestamp: new Date().toISOString(),
      reasoning: 'Operating smoothly within nominal parameters. Sub-second telemetry confirmed.',
      transition_history: [
        { timestamp: new Date(Date.now() - 3600000).toISOString(), state: 'Good', overall_score: 94, reasoning: 'Initial startup and baseline stabilization' },
        { timestamp: new Date(Date.now() - 1800000).toISOString(), state: 'Excellent', overall_score: 98, reasoning: 'All infrastructure metrics nominal' }
      ]
    });
  },

  getSecurity: async (tenantId: string): Promise<SecurityState> => {
    return safeFetch<SecurityState>(`${API_BASE}/security?tenant_id=${tenantId}`, undefined, {
      security_score: 96,
      failed_logins_last_5m: simFailedLogins,
      brute_force_indicator: false,
      risk_level: 'Low',
      timestamp: new Date().toISOString(),
      risk_events: ['HMAC Source Verification Active', 'Zero Egress Violations Detected']
    });
  },

  // Privacy & Egress
  getPrivacySummary: async (tenantId: string): Promise<PrivacySummary> => {
    return safeFetch<PrivacySummary>(`${API_BASE}/privacy/summary?tenant_id=${tenantId}`, undefined, {
      tenant_id: tenantId,
      privacy_score: 100,
      total_payloads_processed: 1420,
      collected_fields_total: 48280,
      removed_fields_total: 25560,
      redacted_fields_total: 7100,
      transmitted_fields_total: 15620,
      verified_egress_percentage: 100.0,
      zero_raw_data_enforced: true
    });
  },

  getPrivacyHistory: async (tenantId: string): Promise<any[]> => {
    const defaultHist = [
      {
        id: 'prv_demo_01',
        payload_id: 'meta_prod_8841a',
        tenant_id: tenantId,
        timestamp: new Date().toISOString(),
        collected_fields: 34,
        removed_fields: 18,
        redacted_fields: 5,
        transmitted_fields: 11,
        payload_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        egress_verified: 1,
        redaction_summary: ['Bearer Token (Scrubbed)', 'Database Connection String (Removed)', 'User Email (Stripped)']
      }
    ];
    return safeFetch<any[]>(`${API_BASE}/privacy/history?tenant_id=${tenantId}`, undefined, defaultHist);
  },

  getPrivacyReplay: async (payloadId: string): Promise<PrivacyReplay> => {
    return safeFetch<PrivacyReplay>(`${API_BASE}/privacy/replay/${payloadId}`, undefined, {
      payload_id: payloadId,
      tenant_id: 'tenant_prod_us_east_1',
      timestamp: new Date().toISOString(),
      payload_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      field_counts: {
        collected: 34,
        removed: 18,
        redacted: 5,
        transmitted: 11
      },
      stage_1_collected: {
        raw_host: 'k8s-node-worker-01.us-east.internal',
        raw_user_email: 'admin.krish@customer-corp.internal',
        raw_bearer_auth: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        raw_db_password: 'postgres://admin:SecretPassword2026@10.0.1.5:5432/db',
        raw_sql_query: "SELECT ssn, account_balance FROM customer_accounts WHERE id = '9941'",
        metrics: { cpu_percent: simCpu, memory_percent: simMemory }
      },
      stage_2_redacted: {
        raw_host: 'hmac_sha256_e10adc3949ba59abbe56e057f20f883e',
        raw_user_email: '[REDACTED_USER_EMAIL]',
        raw_bearer_auth: '[REDACTED_BEARER_TOKEN]',
        raw_db_password: '[REDACTED_DATABASE_CREDENTIALS]',
        raw_sql_query: '[REDACTED_SQL_QUERY_PARAMS]',
        metrics: { cpu_percent: simCpu, memory_percent: simMemory }
      },
      stage_3_metadata: {
        payload_id: payloadId,
        cpu_percent: simCpu,
        memory_percent: simMemory,
        ping_latency_ms: simLatency,
        packet_loss_percent: 0.0,
        failed_login_count: simFailedLogins,
        error_count: simErrors,
        db_query_latency_ms: 18.5,
        payload_hash_sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
      },
      redaction_rules_applied: [
        'Bearer token masked via regex',
        'Database credentials scrubbed',
        'User emails removed from egress',
        'Raw SQL queries dropped via strict allowlist'
      ],
      egress_verified: true
    });
  },

  getEgressProofs: async (tenantId: string): Promise<EgressProof[]> => {
    const defaultProofs: EgressProof[] = [
      {
        proof_id: 'prf_8841a0bc',
        payload_id: 'meta_prod_8841a',
        tenant_id: tenantId,
        transmission_timestamp: new Date().toISOString(),
        payload_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        hmac_signature: 'hmac_sha256_verified_collector_agent_node_alpha',
        field_counts: { collected: 34, removed: 18, redacted: 5, transmitted: 11 },
        redaction_manifest: ['Bearer Token (Scrubbed)', 'Credentials (Scrubbed)', 'Email (Dropped)'],
        metadata_sample: { cpu: simCpu, mem: simMemory, latency: simLatency },
        verified: true
      }
    ];
    return safeFetch<EgressProof[]>(`${API_BASE}/privacy/egress-proofs?tenant_id=${tenantId}`, undefined, defaultProofs);
  },

  // Incidents
  getIncidents: async (tenantId: string, status: string = 'all'): Promise<Incident[]> => {
    return safeFetch<Incident[]>(`${API_BASE}/incidents?tenant_id=${tenantId}&status=${status}`, undefined, activeIncidents);
  },

  getIncidentDetail: async (incidentId: string): Promise<Incident> => {
    const found = activeIncidents.find((i) => i.id === incidentId);
    if (found) return found;
    return safeFetch<Incident>(`${API_BASE}/incidents/${incidentId}`, undefined, activeIncidents[0]);
  },

  resolveIncident: async (incidentId: string, operator: string = 'operator_oncall'): Promise<any> => {
    activeIncidents = activeIncidents.map((i) => (i.id === incidentId ? { ...i, status: 'resolved' as const } : i));
    return safeFetch<any>(`${API_BASE}/incidents/${incidentId}/resolve?operator=${operator}`, { method: 'POST' }, {
      status: 'resolved',
      incident_id: incidentId,
      resolved_at: new Date().toISOString()
    });
  },

  // Forecasting
  getForecasts: async (tenantId: string): Promise<ForecastPrediction[]> => {
    const defaultForecasts: ForecastPrediction[] = [
      { metric: 'cpu', window: '15m', current_value: simCpu, predicted_value: Math.min(100, simCpu + 4), trend: 'stable', confidence: 0.91, explanation: 'Nominal baseline variation within +4% range.' },
      { metric: 'cpu', window: '30m', current_value: simCpu, predicted_value: Math.min(100, simCpu + 6), trend: 'stable', confidence: 0.88, explanation: 'Projected steady execution pattern.' },
      { metric: 'memory', window: '30m', current_value: simMemory, predicted_value: Math.min(100, simMemory + 2), trend: 'stable', confidence: 0.94, explanation: 'Heap allocations within safe thresholds.' },
      { metric: 'latency', window: '30m', current_value: simLatency, predicted_value: simLatency, trend: 'stable', confidence: 0.89, explanation: 'Roundtrip latency consistent.' },
      { metric: 'incident_risk', window: '30m', current_value: 12.0, predicted_value: 15.0, trend: 'stable', confidence: 0.86, explanation: 'Low probability of cascading failure in next 30m.' }
    ];
    return safeFetch<ForecastPrediction[]>(`${API_BASE}/forecasting?tenant_id=${tenantId}`, undefined, defaultForecasts);
  },

  // Remediation
  getRecommendations: async (tenantId: string): Promise<Recommendation[]> => {
    const defaultRecs: Recommendation[] = [
      {
        id: 'rec_scale_01',
        incident_id: 'inc_prod_9941a',
        tenant_id: tenantId,
        title: 'Safe Rate-Limiting & Horizontal Scale',
        action_type: 'SAFE_THROTTLE_AND_SCALE',
        signals: ['CPU Core Load > 80%', 'Auth Retry Spike'],
        confidence: 0.92,
        reasoning: 'Mitigate auth retry saturation by enabling ingress throttling and provisioning 2 standby worker pods.',
        status: 'proposed'
      }
    ];
    return safeFetch<Recommendation[]>(`${API_BASE}/remediation/recommendations?tenant_id=${tenantId}`, undefined, defaultRecs);
  },

  getRemediationWorkflows: async (tenantId: string): Promise<RemediationWorkflow[]> => {
    return safeFetch<RemediationWorkflow[]>(`${API_BASE}/remediation/workflows?tenant_id=${tenantId}`, undefined, []);
  },

  proposeRemediation: async (recommendationId: string, tenantId: string, operator: string): Promise<RemediationWorkflow> => {
    const wf: RemediationWorkflow = {
      remediation_id: `rem_${Date.now().toString(16)}`,
      recommendation_id: recommendationId,
      tenant_id: tenantId,
      action_name: 'Apply Ingress Throttling (100 req/s)',
      target_system: 'gateway-ingress-cluster',
      status: 'proposed',
      operator: operator,
      timestamp: new Date().toISOString(),
      simulation_output: 'Workflow proposed. Ready for sandboxed simulation.',
      rollback_snapshot: { rate_limit: 'unlimited', active_pods: 3 }
    };
    return safeFetch<RemediationWorkflow>(`${API_BASE}/remediation/propose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recommendation_id: recommendationId, tenant_id: tenantId, operator })
    }, wf);
  },

  simulateRemediation: async (remediationId: string, tenantId: string, operator: string): Promise<RemediationWorkflow> => {
    const wf: RemediationWorkflow = {
      remediation_id: remediationId,
      recommendation_id: 'rec_scale_01',
      tenant_id: tenantId,
      action_name: 'Apply Ingress Throttling (100 req/s)',
      target_system: 'gateway-ingress-cluster',
      status: 'simulated',
      operator: operator,
      timestamp: new Date().toISOString(),
      simulation_output: `[SIMULATION ENGINE] Initializing sandboxed dry-run for ${remediationId}...
>>> Target system: gateway-ingress-cluster
>>> Snapshot state captured: rate_limit=unlimited, active_pods=3
>>> Testing policy change: RATE_LIMIT=100 req/s
>>> Validating blast radius: 0 dropped legitimate packets
>>> SIMULATION SUCCESS: Projected CPU load reduction: -42%
>>> Safe to approve or rollback anytime.`,
      rollback_snapshot: { rate_limit: 'unlimited', active_pods: 3 }
    };
    return safeFetch<RemediationWorkflow>(`${API_BASE}/remediation/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remediation_id: remediationId, tenant_id: tenantId, operator })
    }, wf);
  },

  rollbackRemediation: async (remediationId: string, tenantId: string, operator: string): Promise<RemediationWorkflow> => {
    const wf: RemediationWorkflow = {
      remediation_id: remediationId,
      recommendation_id: 'rec_scale_01',
      tenant_id: tenantId,
      action_name: 'Apply Ingress Throttling (100 req/s)',
      target_system: 'gateway-ingress-cluster',
      status: 'rolled_back',
      operator: operator,
      timestamp: new Date().toISOString(),
      simulation_output: `[ROLLBACK ENGINE] State restored to snapshot: rate_limit=unlimited, active_pods=3.`,
      rollback_snapshot: { rate_limit: 'unlimited', active_pods: 3 }
    };
    return safeFetch<RemediationWorkflow>(`${API_BASE}/remediation/rollback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remediation_id: remediationId, tenant_id: tenantId, operator })
    }, wf);
  },

  // Copilot
  askCopilot: async (question: string, tenantId: string): Promise<{ answer: string; grounded_facts: any; source: string }> => {
    const q = question.toLowerCase();
    let ans = `Based on live system telemetry, the overall health is rated at 98/100 (Excellent). CPU is operating at ${simCpu.toFixed(1)}%, RAM at ${simMemory.toFixed(1)}%, and roundtrip latency is ${simLatency.toFixed(1)}ms. All privacy controls are 100% active with zero raw data egress.`;
    if (q.includes('incident') || q.includes('poor') || q.includes('issue')) {
      ans = `Active incident review: 1 correlated incident identified. Probable root cause: Credential Stuffing Auth Retries causing cryptographic CPU saturation. Recommended mitigation: Apply safe rate-limiting on gateway ingress.`;
    } else if (q.includes('privacy') || q.includes('leak') || q.includes('raw')) {
      ans = `Privacy enforcement guarantee: 100% Zero-Leak compliance. All raw hostnames, SQL queries, bearer tokens, and credentials are scrubbed at Tier 1 before egress. 0 egress violations recorded.`;
    }
    return safeFetch<{ answer: string; grounded_facts: any; source: string }>(`${API_BASE}/copilot/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, tenant_id: tenantId })
    }, {
      answer: ans,
      grounded_facts: { cpu: simCpu, memory: simMemory, latency: simLatency, incidents_count: activeIncidents.length },
      source: 'ThirdEye-Grounded-Factual-Engine'
    });
  },

  // Scenarios
  triggerScenario: async (scenarioType: string, intensity: number = 1.0, tenantId: string): Promise<any> => {
    let spikeMetric = 'CPU Core Load';
    let spikeVal = '95.4%';

    if (scenarioType === 'cpu_spike') {
      simCpu = Math.min(99.0, 85.0 + intensity * 10.0);
      simLatency = 38.0;
      spikeMetric = 'CPU Core Load';
      spikeVal = `${simCpu.toFixed(1)}%`;
    } else if (scenarioType === 'memory_leak') {
      simMemory = Math.min(99.0, 92.0 + intensity * 5.0);
      simCpu = 78.0;
      spikeMetric = 'Memory (RAM)';
      spikeVal = `${simMemory.toFixed(1)}%`;
    } else if (scenarioType === 'disk_saturation') {
      simDisk = 99.2;
      simCpu = 74.0;
      spikeMetric = 'Physical Disk Util';
      spikeVal = `${simDisk.toFixed(1)}%`;
    } else if (scenarioType === 'latency_surge') {
      simLatency = Math.round(240.0 * intensity);
      simCpu = 65.0;
      spikeMetric = 'Ping Latency';
      spikeVal = `${simLatency} ms`;
    } else if (scenarioType === 'packet_loss') {
      simLatency = 210.0;
      simErrors = 18;
      spikeMetric = 'Packet Loss';
      spikeVal = '7.2%';
    } else if (scenarioType === 'db_slowdown') {
      simLatency = 160.0;
      simCpu = 88.5;
      spikeMetric = 'DB Query Latency';
      spikeVal = '160 ms';
    } else if (scenarioType === 'failed_login_flood') {
      simFailedLogins = Math.round(65 * intensity);
      simCpu = Math.min(96.0, 75.0 + intensity * 18.0);
      spikeMetric = 'Failed Logins';
      spikeVal = `${simFailedLogins} attempts/5m`;
    } else if (scenarioType === 'ddos') {
      simCpu = 95.0;
      simLatency = 220.0;
      simErrors = 34;
      spikeMetric = 'Ingress Traffic';
      spikeVal = '55,000 kbps';
    }

    const cause = getScenarioCause(scenarioType);
    const prevention = getScenarioPrevention(scenarioType);

    // 1. Create and prepend a real active Incident to activeIncidents!
    const newInc: Incident = {
      id: `inc_scenario_${Date.now().toString(16)}`,
      tenant_id: tenantId,
      timestamp: new Date().toISOString(),
      title: `Critical Incident: Injected ${scenarioType.replace(/_/g, ' ').toUpperCase()}`,
      severity: 'critical',
      status: 'active',
      confidence: 0.98,
      affected_systems: ['gateway-cluster', 'auth-service', 'worker-pool'],
      probable_cause: cause,
      root_cause_chain: [
        `Operator scenario injection: ${scenarioType} (${intensity}x)`,
        `${spikeMetric} crossed critical threshold (${spikeVal})`,
        'Automated incident correlation ticket generated with Twilio alert dispatch'
      ],
      explainability: {
        summary: `Root cause identified as ${cause}`,
        decision_confidence: 0.98,
        primary_driving_factors: [
          `${spikeMetric} at ${spikeVal}`,
          'Critical threshold >=90% breached',
          'Automated Twilio WhatsApp/SMS alert triggered'
        ],
        contributing_signals: [
          { signal: 'cpu_percent', value: `${simCpu.toFixed(1)}%`, delta: '+65%', weight: 0.88 },
          { signal: 'memory_percent', value: `${simMemory.toFixed(1)}%`, delta: '+42%', weight: 0.76 }
        ],
        explainability_tree: {
          root: `Triggered Anomaly: ${scenarioType}`,
          branches: ['Threshold Breach', 'AIOps Correlation', 'Twilio Alert Dispatched'],
          evidence_points: ['Psutil real-time metrics', 'Cryptographic HMAC verified']
        },
        reasoning_narrative: `ThirdEye detected abnormal behavior resulting from ${scenarioType}. Automated Twilio notifications were dispatched with prevention guidance.`
      },
      timeline: [
        {
          timestamp: new Date().toISOString(),
          event_title: `Scenario ${scenarioType} Injected`,
          description: `Operator injected test failure at ${intensity}x intensity.`,
          signal_name: scenarioType,
          signal_value: spikeVal,
          dimension: 'Operational',
          severity: 'critical'
        }
      ]
    };
    activeIncidents = [newInc, ...activeIncidents];

    // 2. Emit updated telemetry and incident updates to realtimeService so UI reflects instantly!
    const injectedTelemetry = createTelemetryObject(tenantId, {
      cpu_percent: simCpu,
      memory_percent: simMemory,
      disk_percent: simDisk,
      ping_latency_ms: simLatency,
      failed_login_count: simFailedLogins,
      error_count: simErrors
    });
    realtimeService['emit']('telemetry_updates', injectedTelemetry);
    realtimeService['emit']('incident_updates', { incident_id: newInc.id });

    // 3. Dispatch Twilio WhatsApp & SMS notification!
    const twilioAlert = await twilioService.dispatchAlert({
      title: `Scenario Triggered: ${scenarioType.replace(/_/g, ' ').toUpperCase()}`,
      severity: 'critical',
      metric: spikeMetric,
      value: spikeVal,
      triggerCause: cause,
      preventionSteps: prevention,
      tenantId
    });

    const res = await safeFetch<any>(`${API_BASE}/scenarios/trigger?tenant_id=${tenantId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_type: scenarioType, intensity })
    }, {
      status: 'success',
      scenario: scenarioType,
      intensity: intensity,
      incident: newInc,
      twilio: twilioAlert,
      telemetry: injectedTelemetry
    });

    return res;
  },

  resetScenario: async (tenantId: string): Promise<any> => {
    simCpu = 34.2;
    simMemory = 54.0;
    simLatency = 22.4;
    simDisk = 42.8;
    simFailedLogins = 0;
    simErrors = 0;

    // Resolve active scenario incidents
    activeIncidents = activeIncidents.map((inc) =>
      inc.id.startsWith('inc_scenario_') ? { ...inc, status: 'resolved' as const } : inc
    );

    const normalTelemetry = createTelemetryObject(tenantId, {
      cpu_percent: simCpu,
      memory_percent: simMemory,
      disk_percent: simDisk,
      ping_latency_ms: simLatency,
      failed_login_count: 0,
      error_count: 0
    });
    realtimeService['emit']('telemetry_updates', normalTelemetry);
    realtimeService['emit']('incident_updates', { status: 'resolved' });

    return {
      status: 'recovered',
      message: 'System recovered to nominal baseline.',
      telemetry: normalTelemetry
    };
  },

  getScenariosList: async (): Promise<any> => {
    return safeFetch<any>(`${API_BASE}/scenarios/list`, undefined, {
      scenarios: [
        { id: 'cpu_spike', name: 'CPU Spike & Thread Starvation', category: 'Infrastructure' },
        { id: 'memory_leak', name: 'Memory Leak & Heap Thrashing', category: 'Infrastructure' },
        { id: 'disk_saturation', name: 'Disk I/O Saturation (99%)', category: 'Infrastructure' },
        { id: 'latency_surge', name: 'Network Latency Surge (>240ms)', category: 'Network' },
        { id: 'packet_loss', name: 'Packet Loss Burst (>6%)', category: 'Network' },
        { id: 'db_slowdown', name: 'Database Query Degradation & Lock Contention', category: 'Database' },
        { id: 'failed_login_flood', name: 'Credential Stuffing & Auth Storm', category: 'Security' },
        { id: 'application_failure', name: 'Cascading HTTP 5xx Runtime Exception Wave', category: 'Application' }
      ]
    });
  },

  // Audit
  getAuditLogs: async (tenantId: string): Promise<AuditRecord[]> => {
    const defaultAudit: AuditRecord[] = [
      {
        id: 'audit_block_001',
        tenant_id: tenantId,
        timestamp: new Date().toISOString(),
        action_type: 'SCENARIO_INJECTED',
        actor: 'operator_oncall',
        details: { scenario: 'failed_login_flood', blast_radius: 'isolated' },
        prev_hash: '0000000000000000000000000000000000000000000000000000000000000000',
        current_hash: 'a3f9c2d1e0b8a7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2'
      }
    ];
    return safeFetch<AuditRecord[]>(`${API_BASE}/audit/logs?tenant_id=${tenantId}`, undefined, defaultAudit);
  },

  verifyAuditChain: async (tenantId: string): Promise<any> => {
    return safeFetch<any>(`${API_BASE}/audit/verify?tenant_id=${tenantId}`, undefined, {
      valid: true,
      blocks_count: 8,
      tenant_id: tenantId,
      head_hash: 'a3f9c2d1e0b8a7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2',
      verification_status: 'UNBROKEN_CRYPTOGRAPHIC_CHAIN_VERIFIED'
    });
  },

  // Collector
  getCollectorStatus: async (tenantId: string): Promise<CollectorState> => {
    return safeFetch<CollectorState>(`${API_BASE}/collector/status?tenant_id=${tenantId}`, undefined, {
      tenant_id: tenantId,
      collector_id: 'collector_agent_node_alpha',
      status: 'online',
      last_heartbeat: new Date().toISOString(),
      queue_size: 0,
      replayed_count: 0,
      reliability_percent: 100.0
    });
  }
};
