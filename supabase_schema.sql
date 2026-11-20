-- =========================================================================
-- THIRD EYE — SUPABASE POSTGRESQL SCHEMA & REALTIME CONFIGURATION
-- =========================================================================
-- Run this script in the Supabase SQL Editor (https://app.supabase.com)
-- 100% Free Tier Compatible

-- 1. Tenants (Multi-Tenant Isolation)
CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    region TEXT NOT NULL,
    api_key TEXT NOT NULL,
    config_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Telemetry Metadata (Zero Raw Data Egress)
CREATE TABLE IF NOT EXISTS telemetry (
    id TEXT PRIMARY KEY,
    payload_id TEXT UNIQUE NOT NULL,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    source_id_hmac TEXT NOT NULL,
    sequence_number BIGINT NOT NULL,
    cpu_percent NUMERIC(5,2) NOT NULL,
    memory_percent NUMERIC(5,2) NOT NULL,
    disk_percent NUMERIC(5,2) NOT NULL,
    network_rx_kbps NUMERIC(10,2) NOT NULL,
    network_tx_kbps NUMERIC(10,2) NOT NULL,
    ping_latency_ms NUMERIC(8,2) NOT NULL,
    packet_loss_percent NUMERIC(5,2) NOT NULL,
    failed_login_count INT NOT NULL,
    error_count INT NOT NULL,
    db_query_latency_ms NUMERIC(8,2) NOT NULL,
    db_connection_pool_usage NUMERIC(5,2) NOT NULL,
    payload_hash_sha256 TEXT NOT NULL,
    privacy_metrics_json JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_telemetry_tenant_time ON telemetry (tenant_id, timestamp DESC);

-- 3. Privacy Transparency Records & 3-Stage Replay
CREATE TABLE IF NOT EXISTS privacy_records (
    id TEXT PRIMARY KEY,
    payload_id TEXT UNIQUE NOT NULL,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    collected_fields INT NOT NULL,
    removed_fields INT NOT NULL,
    redacted_fields INT NOT NULL,
    transmitted_fields INT NOT NULL,
    stage1_collected_preview JSONB NOT NULL,
    stage2_redacted_preview JSONB NOT NULL,
    stage3_approved_metadata JSONB NOT NULL,
    redaction_summary_json JSONB NOT NULL,
    payload_hash TEXT NOT NULL,
    egress_verified INT NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_privacy_tenant_time ON privacy_records (tenant_id, timestamp DESC);

-- 4. Correlated Incidents & Root Cause Chains
CREATE TABLE IF NOT EXISTS incidents (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    title TEXT NOT NULL,
    severity TEXT NOT NULL,
    status TEXT NOT NULL,
    confidence NUMERIC(4,3) NOT NULL,
    affected_systems_json JSONB NOT NULL,
    probable_cause TEXT NOT NULL,
    root_cause_chain_json JSONB NOT NULL,
    explainability_json JSONB NOT NULL,
    timeline_json JSONB NOT NULL,
    resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_incidents_tenant_time ON incidents (tenant_id, timestamp DESC);

-- 5. Health & Security State History
CREATE TABLE IF NOT EXISTS health_history (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    state TEXT NOT NULL,
    overall_score INT NOT NULL,
    reasoning TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS security_history (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    security_score INT NOT NULL,
    failed_logins INT NOT NULL,
    risk_level TEXT NOT NULL,
    risk_events_json JSONB NOT NULL
);

-- 6. Safe Remediation Workflows
CREATE TABLE IF NOT EXISTS remediation (
    remediation_id TEXT PRIMARY KEY,
    recommendation_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    action_name TEXT NOT NULL,
    target_system TEXT NOT NULL,
    status TEXT NOT NULL,
    operator TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    simulation_output TEXT NOT NULL,
    rollback_snapshot_json JSONB NOT NULL
);

-- 7. Recommendations
CREATE TABLE IF NOT EXISTS recommendations (
    id TEXT PRIMARY KEY,
    incident_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    action_type TEXT NOT NULL,
    signals_json JSONB NOT NULL,
    confidence NUMERIC(4,3) NOT NULL,
    reasoning TEXT NOT NULL,
    status TEXT NOT NULL
);

-- 8. Immutable Cryptographic Hash Chain Audit Log
CREATE TABLE IF NOT EXISTS audit_chain (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    action_type TEXT NOT NULL,
    actor TEXT NOT NULL,
    details_json JSONB NOT NULL,
    prev_hash TEXT NOT NULL,
    current_hash TEXT NOT NULL
);

-- 9. Collector Health States
CREATE TABLE IF NOT EXISTS collector_status (
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    collector_id TEXT NOT NULL,
    status TEXT NOT NULL,
    last_heartbeat TIMESTAMPTZ NOT NULL,
    queue_size INT NOT NULL DEFAULT 0,
    replayed_count INT NOT NULL DEFAULT 0,
    reliability_percent NUMERIC(5,2) NOT NULL DEFAULT 100.0,
    PRIMARY KEY (tenant_id, collector_id)
);

-- 10. AI Incident Memory
CREATE TABLE IF NOT EXISTS incident_memory (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    root_cause TEXT NOT NULL,
    resolution TEXT NOT NULL,
    embedding_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Default Tenant
INSERT INTO tenants (id, name, region, api_key, config_json, created_at)
VALUES (
    'tenant_prod_us_east_1',
    'Enterprise Production Fleet',
    'us-east-1',
    'thirdeye_live_secret_key_prod_99',
    '{"residency": "strict_local", "privacy_tier": "metadata_only"}'::jsonb,
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Seed Genesis Block
INSERT INTO audit_chain (id, tenant_id, timestamp, action_type, actor, details_json, prev_hash, current_hash)
VALUES (
    'audit_genesis_001',
    'tenant_prod_us_east_1',
    NOW(),
    'SYSTEM_GENESIS',
    'system_root',
    '{"description": "Third Eye Cryptographic Genesis Audit Block"}'::jsonb,
    '0000000000000000000000000000000000000000000000000000000000000000',
    '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'
) ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- ENABLE SUPABASE REALTIME (Sub-second broadcasts)
-- =========================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE telemetry;
ALTER PUBLICATION supabase_realtime ADD TABLE incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE health_history;
ALTER PUBLICATION supabase_realtime ADD TABLE security_history;
ALTER PUBLICATION supabase_realtime ADD TABLE recommendations;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_chain;
ALTER PUBLICATION supabase_realtime ADD TABLE collector_status;
