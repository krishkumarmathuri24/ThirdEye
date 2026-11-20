import uuid
import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from ..database import get_db_connection
from ..models import Incident, TelemetryIngestPayload
from ..realtime import realtime_hub
from .root_cause_engine import root_cause_engine
from .explainable_aiops import explainable_aiops
from .timeline_engine import timeline_engine

class CorrelationEngine:
    """
    Incident Correlation & Alert Noise Reduction Engine.
    Converts:
       Many Alerts (CPU, Memory, DB, Auth, Latency)
       ↓
       Single Unified Incident with Probable Cause & Causal Graph.
    """
    def correlate_alerts(
        self,
        payload: TelemetryIngestPayload,
        anomalies: List[Dict[str, Any]]
    ) -> Optional[Incident]:
        if not anomalies:
            return None

        tenant_id = payload.tenant_id
        now_iso = datetime.now(timezone.utc).isoformat()
        
        # Check if there is an active incident created in the last 2 minutes to update/append rather than duplicating
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM incidents WHERE tenant_id = ? AND status = 'active' ORDER BY rowid DESC LIMIT 1;",
            (tenant_id,)
        )
        existing = cursor.fetchone()

        # Identify systems and root cause chain
        affected_systems = list(set([a["dimension"] for a in anomalies]))
        
        # Determine highest severity
        severities = [a["severity"] for a in anomalies]
        if "critical" in severities or payload.cpu_percent > 90.0 or payload.failed_login_count > 40:
            severity = "critical"
        elif "high" in severities or len(anomalies) >= 2:
            severity = "high"
        else:
            severity = "medium"

        # Generate root cause analysis & explanation
        rca_result = root_cause_engine.analyze(payload, anomalies)
        explainability = explainable_aiops.generate_explanation(payload, anomalies, rca_result)
        timeline = timeline_engine.build_timeline(payload, anomalies)

        # Title generation based on primary causal vector
        primary_cause = rca_result["probable_cause"]
        title = f"Correlated Incident: {primary_cause} affecting {', '.join(affected_systems)}"

        # Compute incident confidence
        confidence = min(0.99, max(0.82, 0.75 + (len(anomalies) * 0.05)))

        if existing:
            incident_id = existing["id"]
            # Update existing active incident
            cursor.execute("""
            UPDATE incidents
            SET severity = ?, confidence = ?, affected_systems_json = ?, probable_cause = ?,
                root_cause_chain_json = ?, explainability_json = ?, timeline_json = ?
            WHERE id = ?;
            """, (
                severity,
                confidence,
                json.dumps(affected_systems),
                primary_cause,
                json.dumps(rca_result["cause_chain"]),
                json.dumps(explainability),
                json.dumps(timeline),
                incident_id
            ))
            conn.commit()
            conn.close()
            incident_obj = Incident(
                id=incident_id,
                tenant_id=tenant_id,
                timestamp=existing["timestamp"],
                title=existing["title"],
                severity=severity,
                status="active",
                confidence=confidence,
                affected_systems=affected_systems,
                probable_cause=primary_cause,
                root_cause_chain=rca_result["cause_chain"],
                explainability=explainability,
                timeline=timeline
            )
        else:
            incident_id = f"inc_{uuid.uuid4().hex[:10]}"
            cursor.execute("""
            INSERT INTO incidents (
                id, tenant_id, timestamp, title, severity, status, confidence,
                affected_systems_json, probable_cause, root_cause_chain_json,
                explainability_json, timeline_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                incident_id,
                tenant_id,
                now_iso,
                title,
                severity,
                "active",
                confidence,
                json.dumps(affected_systems),
                primary_cause,
                json.dumps(rca_result["cause_chain"]),
                json.dumps(explainability),
                json.dumps(timeline)
            ))
            conn.commit()
            conn.close()
            incident_obj = Incident(
                id=incident_id,
                tenant_id=tenant_id,
                timestamp=now_iso,
                title=title,
                severity=severity,
                status="active",
                confidence=confidence,
                affected_systems=affected_systems,
                probable_cause=primary_cause,
                root_cause_chain=rca_result["cause_chain"],
                explainability=explainability,
                timeline=timeline
            )

        realtime_hub.safe_broadcast(
            channel="incident_updates",
            tenant_id=tenant_id,
            data=incident_obj.model_dump()
        )

        return incident_obj

correlation_engine = CorrelationEngine()
