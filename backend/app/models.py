from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, timezone

def current_utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

# Metadata-only Ingest Payload (no raw logs, no payload contents, no raw sql/credentials)
class TelemetryIngestPayload(BaseModel):
    payload_id: str
    tenant_id: str
    timestamp: str = Field(default_factory=current_utc_iso)
    source_id_hmac: str
    sequence_number: int
    
    # Approved Normalized Metadata Only
    cpu_percent: float
    memory_percent: float
    disk_percent: float
    network_rx_kbps: float
    network_tx_kbps: float
    ping_latency_ms: float
    packet_loss_percent: float
    failed_login_count: int
    error_count: int
    db_query_latency_ms: float
    db_connection_pool_usage: float
    
    # Privacy verification counters generated at the collector
    privacy_metrics: Dict[str, int] = Field(default_factory=lambda: {
        "collected_fields": 34,
        "removed_fields": 18,
        "redacted_fields": 5,
        "transmitted_fields": 11
    })
    
    # Cryptographic integrity
    payload_hash_sha256: str
    redaction_summary: List[str] = Field(default_factory=list)

class EgressProof(BaseModel):
    proof_id: str
    payload_id: str
    tenant_id: str
    transmission_timestamp: str
    payload_hash: str
    hmac_signature: str
    source_pseudonym: str
    field_counts: Dict[str, int]
    redaction_manifest: List[str]
    metadata_sample: Dict[str, Any]
    verified: bool = True

class Incident(BaseModel):
    id: str
    tenant_id: str
    timestamp: str
    title: str
    severity: str # critical, high, medium, low
    status: str # active, investigating, remediated, resolved
    confidence: float # e.g. 0.94
    affected_systems: List[str]
    probable_cause: str
    root_cause_chain: List[str]
    explainability: Dict[str, Any]
    timeline: List[Dict[str, Any]] = Field(default_factory=list)

class HealthState(BaseModel):
    overall_score: int # 0 - 100
    state: str # Excellent, Good, Fair, Poor
    timestamp: str
    reasoning: str
    transition_history: List[Dict[str, Any]] = Field(default_factory=list)

class SecurityState(BaseModel):
    security_score: int # 0 - 100
    failed_logins_last_5m: int
    brute_force_indicator: bool
    risk_level: str # Low, Guarded, Elevated, High, Critical
    timestamp: str
    risk_events: List[str] = Field(default_factory=list)

class Recommendation(BaseModel):
    id: str
    incident_id: str
    tenant_id: str
    title: str
    action_type: str
    signals: List[str]
    confidence: float
    reasoning: str
    status: str = "pending" # pending, approved, simulated, rolled_back

class RemediationWorkflow(BaseModel):
    remediation_id: str
    recommendation_id: str
    tenant_id: str
    action_name: str
    target_system: str
    status: str # proposed, approved, simulated, rolled_back
    operator: str
    timestamp: str
    simulation_output: str
    rollback_snapshot: Dict[str, Any]

class ForecastPrediction(BaseModel):
    window: str # 15m, 30m, 60m
    metric: str # cpu, memory, latency, risk
    current_value: float
    predicted_value: float
    trend: str # increasing, stable, decreasing
    confidence: float
    explanation: str

class TrustScores(BaseModel):
    privacy_score: int # 100
    security_score: int
    health_score: int
    reliability_score: int
    prediction_risk_score: int
    incident_volume: int
    collector_health: str # online, offline, degraded
    timestamp: str

class AuditRecord(BaseModel):
    id: str
    tenant_id: str
    timestamp: str
    action_type: str
    actor: str
    details: Dict[str, Any]
    prev_hash: str
    current_hash: str

class CopilotQuery(BaseModel):
    question: str
    tenant_id: Optional[str] = None

class ScenarioTrigger(BaseModel):
    scenario_type: str # cpu_spike, memory_leak, disk_saturation, network_congestion, packet_loss, latency_surge, db_slowdown, failed_login_flood, auth_storm, collector_failure, collector_recovery, saas_outage, saas_recovery, ddos
    intensity: Optional[float] = 1.0
    duration_seconds: Optional[int] = 30
