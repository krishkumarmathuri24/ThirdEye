export interface TelemetryData {
  payload_id: string;
  tenant_id: string;
  timestamp: string;
  source_id_hmac: string;
  sequence_number: number;
  cpu_percent: number;
  memory_percent: number;
  disk_percent: number;
  network_rx_kbps: number;
  network_tx_kbps: number;
  ping_latency_ms: number;
  packet_loss_percent: number;
  failed_login_count: number;
  error_count: number;
  db_query_latency_ms: number;
  db_connection_pool_usage: number;
  privacy_metrics: {
    collected_fields: number;
    removed_fields: number;
    redacted_fields: number;
    transmitted_fields: number;
  };
  payload_hash_sha256: string;
  redaction_summary?: string[];
}

export interface TrustScores {
  privacy_score: number;
  security_score: number;
  health_score: number;
  reliability_score: number;
  prediction_risk_score: number;
  incident_volume: number;
  collector_health: 'online' | 'offline' | 'degraded';
  timestamp: string;
}

export interface HealthState {
  overall_score: number;
  state: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  timestamp: string;
  reasoning: string;
  transition_history: Array<{
    timestamp: string;
    state: string;
    overall_score: number;
    reasoning: string;
  }>;
}

export interface SecurityState {
  security_score: number;
  failed_logins_last_5m: number;
  brute_force_indicator: boolean;
  risk_level: 'Low' | 'Guarded' | 'Elevated' | 'High' | 'Critical';
  timestamp: string;
  risk_events: string[];
}

export interface Incident {
  id: string;
  tenant_id: string;
  timestamp: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'investigating' | 'remediated' | 'resolved';
  confidence: number;
  affected_systems: string[];
  probable_cause: string;
  root_cause_chain: string[];
  explainability: {
    summary: string;
    decision_confidence: number;
    primary_driving_factors: string[];
    contributing_signals: Array<{
      signal: string;
      value: string;
      delta: string;
      weight: number;
    }>;
    explainability_tree: {
      root: string;
      branches: string[];
      evidence_points: string[];
    };
    reasoning_narrative: string;
  };
  timeline: Array<{
    timestamp: string;
    event_title: string;
    description: string;
    signal_name: string;
    signal_value: string;
    dimension: string;
    severity: string;
  }>;
  vector_memory_matches?: Array<{
    id: string;
    title: string;
    root_cause: string;
    previous_resolution: string;
    similarity_score: number;
  }>;
}

export interface PrivacySummary {
  tenant_id: string;
  privacy_score: number;
  total_payloads_processed: number;
  collected_fields_total: number;
  removed_fields_total: number;
  redacted_fields_total: number;
  transmitted_fields_total: number;
  verified_egress_percentage: number;
  zero_raw_data_enforced: boolean;
}

export interface PrivacyReplay {
  payload_id: string;
  tenant_id: string;
  timestamp: string;
  payload_hash: string;
  field_counts: {
    collected: number;
    removed: number;
    redacted: number;
    transmitted: number;
  };
  stage_1_collected: Record<string, any>;
  stage_2_redacted: Record<string, any>;
  stage_3_metadata: Record<string, any>;
  redaction_rules_applied: string[];
  egress_verified: boolean;
}

export interface EgressProof {
  proof_id: string;
  payload_id: string;
  tenant_id: string;
  transmission_timestamp: string;
  payload_hash: string;
  hmac_signature: string;
  field_counts: {
    collected: number;
    removed: number;
    redacted: number;
    transmitted: number;
  };
  redaction_manifest: string[];
  metadata_sample: Record<string, any>;
  verified: boolean;
}

export interface ForecastPrediction {
  window: '15m' | '30m' | '60m';
  metric: string;
  current_value: number;
  predicted_value: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  confidence: number;
  explanation: string;
}

export interface Recommendation {
  id: string;
  incident_id: string;
  tenant_id: string;
  title: string;
  action_type: string;
  signals: string[];
  confidence: number;
  reasoning: string;
  status: 'pending' | 'proposed' | 'approved' | 'simulated' | 'rolled_back';
}

export interface RemediationWorkflow {
  remediation_id: string;
  recommendation_id: string;
  tenant_id: string;
  action_name: string;
  target_system: string;
  status: 'proposed' | 'approved' | 'simulated' | 'rolled_back';
  operator: string;
  timestamp: string;
  simulation_output: string;
  rollback_snapshot: Record<string, any>;
}

export interface CollectorState {
  collector_id: string;
  tenant_id: string;
  status: 'online' | 'offline' | 'degraded';
  last_heartbeat: string;
  queue_size: number;
  replayed_count: number;
  reliability_percent: number;
}

export interface AuditRecord {
  id: string;
  tenant_id: string;
  timestamp: string;
  action_type: string;
  actor: string;
  details: Record<string, any>;
  prev_hash: string;
  current_hash: string;
}
