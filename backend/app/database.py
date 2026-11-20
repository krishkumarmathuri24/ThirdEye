import sqlite3
import json
import os
import hashlib
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from .config import settings

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(settings.DATABASE_PATH, timeout=10.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Tenants
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        region TEXT NOT NULL,
        api_key TEXT NOT NULL,
        config_json TEXT,
        created_at TEXT NOT NULL
    );
    """)
    
    # 2. Telemetry Metadata
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS telemetry (
        id TEXT PRIMARY KEY,
        payload_id TEXT UNIQUE NOT NULL,
        tenant_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        source_id_hmac TEXT NOT NULL,
        sequence_number INTEGER NOT NULL,
        cpu_percent REAL NOT NULL,
        memory_percent REAL NOT NULL,
        disk_percent REAL NOT NULL,
        network_rx_kbps REAL NOT NULL,
        network_tx_kbps REAL NOT NULL,
        ping_latency_ms REAL NOT NULL,
        packet_loss_percent REAL NOT NULL,
        failed_login_count INTEGER NOT NULL,
        error_count INTEGER NOT NULL,
        db_query_latency_ms REAL NOT NULL,
        db_connection_pool_usage REAL NOT NULL,
        payload_hash_sha256 TEXT NOT NULL,
        privacy_metrics_json TEXT NOT NULL
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_telemetry_tenant_time ON telemetry (tenant_id, timestamp);")

    # 3. Privacy Transparency Records & Replay
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS privacy_records (
        id TEXT PRIMARY KEY,
        payload_id TEXT UNIQUE NOT NULL,
        tenant_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        collected_fields INTEGER NOT NULL,
        removed_fields INTEGER NOT NULL,
        redacted_fields INTEGER NOT NULL,
        transmitted_fields INTEGER NOT NULL,
        stage1_collected_preview TEXT NOT NULL,
        stage2_redacted_preview TEXT NOT NULL,
        stage3_approved_metadata TEXT NOT NULL,
        redaction_summary_json TEXT NOT NULL,
        payload_hash TEXT NOT NULL,
        egress_verified INTEGER NOT NULL DEFAULT 1
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_privacy_tenant_time ON privacy_records (tenant_id, timestamp);")

    # 4. Incidents
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        title TEXT NOT NULL,
        severity TEXT NOT NULL,
        status TEXT NOT NULL,
        confidence REAL NOT NULL,
        affected_systems_json TEXT NOT NULL,
        probable_cause TEXT NOT NULL,
        root_cause_chain_json TEXT NOT NULL,
        explainability_json TEXT NOT NULL,
        timeline_json TEXT NOT NULL,
        resolved_at TEXT
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_incidents_tenant_time ON incidents (tenant_id, timestamp);")

    # 5. Health & Security History
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS health_history (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        state TEXT NOT NULL,
        overall_score INTEGER NOT NULL,
        reasoning TEXT NOT NULL
    );
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS security_history (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        security_score INTEGER NOT NULL,
        failed_logins INTEGER NOT NULL,
        risk_level TEXT NOT NULL,
        risk_events_json TEXT NOT NULL
    );
    """)

    # 6. Safe Remediation Workflows
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS remediation (
        remediation_id TEXT PRIMARY KEY,
        recommendation_id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        action_name TEXT NOT NULL,
        target_system TEXT NOT NULL,
        status TEXT NOT NULL,
        operator TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        simulation_output TEXT NOT NULL,
        rollback_snapshot_json TEXT NOT NULL
    );
    """)

    # 7. Recommendations
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS recommendations (
        id TEXT PRIMARY KEY,
        incident_id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        title TEXT NOT NULL,
        action_type TEXT NOT NULL,
        signals_json TEXT NOT NULL,
        confidence REAL NOT NULL,
        reasoning TEXT NOT NULL,
        status TEXT NOT NULL
    );
    """)

    # 8. Immutable Hash-Chained Audit Logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_chain (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        action_type TEXT NOT NULL,
        actor TEXT NOT NULL,
        details_json TEXT NOT NULL,
        prev_hash TEXT NOT NULL,
        current_hash TEXT NOT NULL
    );
    """)

    # 9. Collector Health States
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS collector_status (
        tenant_id TEXT NOT NULL,
        collector_id TEXT NOT NULL,
        status TEXT NOT NULL, -- online, offline, degraded
        last_heartbeat TEXT NOT NULL,
        queue_size INTEGER NOT NULL DEFAULT 0,
        replayed_count INTEGER NOT NULL DEFAULT 0,
        reliability_percent REAL NOT NULL DEFAULT 100.0,
        PRIMARY KEY (tenant_id, collector_id)
    );
    """)

    # 10. AI Incident Memory Vector Store
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS incident_memory (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        root_cause TEXT NOT NULL,
        resolution TEXT NOT NULL,
        embedding_json TEXT NOT NULL,
        created_at TEXT NOT NULL
    );
    """)

    # Seed Default Tenant
    cursor.execute("SELECT id FROM tenants WHERE id = ?", (settings.DEFAULT_TENANT_ID,))
    if not cursor.fetchone():
        cursor.execute("""
        INSERT INTO tenants (id, name, region, api_key, config_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?);
        """, (
            settings.DEFAULT_TENANT_ID,
            "Enterprise Demo Cluster (US-East)",
            settings.DEFAULT_TENANT_REGION,
            settings.DEFAULT_API_KEY,
            json.dumps({"residency": "strict_local", "privacy_tier": "metadata_only"}),
            datetime.now(timezone.utc).isoformat()
        ))
        
        # Seed Genesis Audit Block
        genesis_str = f"GENESIS-{settings.DEFAULT_TENANT_ID}-2026"
        genesis_hash = hashlib.sha256(genesis_str.encode()).hexdigest()
        cursor.execute("""
        INSERT INTO audit_chain (id, tenant_id, timestamp, action_type, actor, details_json, prev_hash, current_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            "audit_genesis_001",
            settings.DEFAULT_TENANT_ID,
            datetime.now(timezone.utc).isoformat(),
            "SYSTEM_GENESIS",
            "system_root",
            json.dumps({"description": "Third Eye Cryptographic Genesis Audit Block"}),
            "0000000000000000000000000000000000000000000000000000000000000000",
            genesis_hash
        ))

    conn.commit()
    conn.close()

# Execute schema creation on startup
init_db()
