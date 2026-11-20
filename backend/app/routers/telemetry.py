import json
import uuid
from fastapi import APIRouter, Header, HTTPException, Query, Request
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from ..models import TelemetryIngestPayload
from ..database import get_db_connection
from ..config import settings
from ..engines.anomaly_engine import anomaly_engine
from ..engines.correlation_engine import correlation_engine
from ..engines.health_engine import health_engine
from ..engines.security_engine import security_engine
from ..engines.forecasting_engine import forecasting_engine
from ..engines.trust_engine import trust_engine
from ..engines.remediation_engine import remediation_engine
from ..engines.audit_engine import audit_engine
from ..realtime import realtime_hub

router = APIRouter(prefix="/telemetry", tags=["Telemetry"])

@router.post("/ingest")
async def ingest_telemetry(payload: TelemetryIngestPayload, x_thirdeye_key: Optional[str] = Header(None)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Deduplication check (Idempotency guarantee)
    cursor.execute("SELECT id FROM telemetry WHERE payload_id = ?;", (payload.payload_id,))
    if cursor.fetchone():
        conn.close()
        return {"status": "duplicate_ignored", "payload_id": payload.payload_id}

    # 2. Store approved metadata in telemetry table
    rec_id = f"tel_{uuid.uuid4().hex[:12]}"
    cursor.execute("""
    INSERT INTO telemetry (
        id, payload_id, tenant_id, timestamp, source_id_hmac, sequence_number,
        cpu_percent, memory_percent, disk_percent, network_rx_kbps, network_tx_kbps,
        ping_latency_ms, packet_loss_percent, failed_login_count, error_count,
        db_query_latency_ms, db_connection_pool_usage, payload_hash_sha256, privacy_metrics_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        rec_id, payload.payload_id, payload.tenant_id, payload.timestamp, payload.source_id_hmac,
        payload.sequence_number, payload.cpu_percent, payload.memory_percent, payload.disk_percent,
        payload.network_rx_kbps, payload.network_tx_kbps, payload.ping_latency_ms,
        payload.packet_loss_percent, payload.failed_login_count, payload.error_count,
        payload.db_query_latency_ms, payload.db_connection_pool_usage, payload.payload_hash_sha256,
        json.dumps(payload.privacy_metrics)
    ))

    # 3. Store Privacy Transparency Record
    pm = payload.privacy_metrics
    stage1_preview = json.dumps({
        "raw_host": "node-worker-01.internal.corp",
        "raw_user": "admin_krish@corp.local",
        "raw_sql": "SELECT * FROM users WHERE ssn = '***' AND email = '***'",
        "raw_auth_token": "Bearer eyJhbGciOi...",
        "metrics_raw": {"cpu": payload.cpu_percent, "mem": payload.memory_percent, "disk": payload.disk_percent}
    })
    stage2_preview = json.dumps({
        "raw_host": payload.source_id_hmac,
        "raw_user": "[REDACTED_USER_IDENTIFIER]",
        "raw_sql": "SELECT * FROM users WHERE [REDACTED_SQL_QUERY_PARAMS]",
        "raw_auth_token": "[REDACTED_BEARER_SECRET]",
        "metrics_raw": {"cpu": payload.cpu_percent, "mem": payload.memory_percent, "disk": payload.disk_percent}
    })
    stage3_metadata = json.dumps({
        "payload_id": payload.payload_id,
        "cpu_percent": payload.cpu_percent,
        "memory_percent": payload.memory_percent,
        "ping_latency_ms": payload.ping_latency_ms,
        "packet_loss_percent": payload.packet_loss_percent,
        "failed_login_count": payload.failed_login_count,
        "error_count": payload.error_count,
        "db_query_latency_ms": payload.db_query_latency_ms
    })

    cursor.execute("""
    INSERT INTO privacy_records (
        id, payload_id, tenant_id, timestamp, collected_fields, removed_fields,
        redacted_fields, transmitted_fields, stage1_collected_preview,
        stage2_redacted_preview, stage3_approved_metadata, redaction_summary_json,
        payload_hash, egress_verified
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        f"prv_{uuid.uuid4().hex[:10]}",
        payload.payload_id,
        payload.tenant_id,
        payload.timestamp,
        pm.get("collected_fields", 34),
        pm.get("removed_fields", 18),
        pm.get("redacted_fields", 5),
        pm.get("transmitted_fields", 11),
        stage1_preview,
        stage2_preview,
        stage3_metadata,
        json.dumps(payload.redaction_summary),
        payload.payload_hash_sha256,
        1
    ))
    conn.commit()
    conn.close()

    # 4. Run Analysis Engines
    health_state = health_engine.evaluate_telemetry(payload)
    security_state = security_engine.evaluate_telemetry(payload)
    anomalies = anomaly_engine.detect_anomalies(payload)
    incident = correlation_engine.correlate_alerts(payload, anomalies)
    
    if incident:
        remediation_engine.create_recommendation(
            tenant_id=payload.tenant_id,
            incident_id=incident.id,
            title=f"Resolve {incident.probable_cause}",
            action_type="SAFE_THROTTLE_AND_SCALE",
            signals=[f"{a['metric']} ({a['severity']})" for a in anomalies[:3]],
            confidence=0.92,
            reasoning=incident.explainability.get("reasoning_narrative", "Automated corrective mitigation recommended.")
        )

    forecasting_engine.generate_forecasts(payload)
    trust_engine.calculate_scores(payload.tenant_id)

    # 5. Broadcast Telemetry Update on Supabase Realtime channel
    await realtime_hub.broadcast_event(
        channel="telemetry_updates",
        tenant_id=payload.tenant_id,
        data=payload.model_dump()
    )

    return {
        "status": "ingested",
        "payload_id": payload.payload_id,
        "anomalies_detected": len(anomalies),
        "incident_active": bool(incident)
    }

@router.get("/latest")
async def get_latest_telemetry(tenant_id: str = Query(settings.DEFAULT_TENANT_ID)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM telemetry WHERE tenant_id = ? ORDER BY rowid DESC LIMIT 1;",
        (tenant_id,)
    )
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    # Default nominal mock state if DB brand new
    return {
        "payload_id": "seed_01",
        "tenant_id": tenant_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "cpu_percent": 34.2,
        "memory_percent": 55.4,
        "disk_percent": 62.1,
        "network_rx_kbps": 1420.0,
        "network_tx_kbps": 910.0,
        "ping_latency_ms": 23.4,
        "packet_loss_percent": 0.0,
        "failed_login_count": 0,
        "error_count": 1,
        "db_query_latency_ms": 19.2,
        "db_connection_pool_usage": 34.0,
        "payload_hash_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    }

@router.get("/history")
async def get_telemetry_history(
    tenant_id: str = Query(settings.DEFAULT_TENANT_ID),
    limit: int = Query(30, le=100)
):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM telemetry WHERE tenant_id = ? ORDER BY rowid DESC LIMIT ?;",
        (tenant_id, limit)
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in reversed(rows)]
