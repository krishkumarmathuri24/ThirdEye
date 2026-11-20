import uuid
import json
from typing import Dict, Any, List
from datetime import datetime, timezone
from ..database import get_db_connection
from ..models import HealthState, TelemetryIngestPayload
from ..realtime import realtime_hub

class HealthEngine:
    """
    Evaluates Overall System Health:
      - Excellent: 90 - 100
      - Good: 75 - 89
      - Fair: 50 - 74
      - Poor: 0 - 49
    Tracks state transitions, transition timestamps, and change reasoning.
    """
    def evaluate_telemetry(self, payload: TelemetryIngestPayload) -> HealthState:
        # Penalties calculation based strictly on approved metadata
        score = 100.0
        reasons = []

        if payload.cpu_percent > 85.0:
            penalty = (payload.cpu_percent - 85.0) * 1.5
            score -= penalty
            reasons.append(f"High CPU utilization ({payload.cpu_percent:.1f}%)")
        elif payload.cpu_percent > 70.0:
            score -= 5.0
            reasons.append(f"Elevated CPU ({payload.cpu_percent:.1f}%)")

        if payload.memory_percent > 85.0:
            penalty = (payload.memory_percent - 85.0) * 1.2
            score -= penalty
            reasons.append(f"High Memory consumption ({payload.memory_percent:.1f}%)")

        if payload.ping_latency_ms > 150.0:
            penalty = min(25.0, (payload.ping_latency_ms - 150.0) * 0.1)
            score -= penalty
            reasons.append(f"Network latency surge ({payload.ping_latency_ms:.1f}ms)")

        if payload.packet_loss_percent > 2.0:
            penalty = min(20.0, payload.packet_loss_percent * 3.0)
            score -= penalty
            reasons.append(f"Packet loss detected ({payload.packet_loss_percent:.1f}%)")

        if payload.db_query_latency_ms > 100.0:
            penalty = min(20.0, (payload.db_query_latency_ms - 100.0) * 0.15)
            score -= penalty
            reasons.append(f"Slow database query execution ({payload.db_query_latency_ms:.1f}ms)")

        if payload.error_count > 10:
            score -= min(15.0, payload.error_count * 0.5)
            reasons.append(f"Elevated application error rate ({payload.error_count} err/s)")

        final_score = max(0, min(100, int(round(score))))

        if final_score >= 90:
            state = "Excellent"
        elif final_score >= 75:
            state = "Good"
        elif final_score >= 50:
            state = "Fair"
        else:
            state = "Poor"

        reasoning = "; ".join(reasons) if reasons else "All infrastructure and network metrics within optimal operating baselines."
        now_iso = datetime.now(timezone.utc).isoformat()

        # Check for state transition
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT state, overall_score FROM health_history WHERE tenant_id = ? ORDER BY rowid DESC LIMIT 1;",
            (payload.tenant_id,)
        )
        prev_row = cursor.fetchone()
        
        # Save record
        rec_id = f"hlth_{uuid.uuid4().hex[:10]}"
        cursor.execute("""
        INSERT INTO health_history (id, tenant_id, timestamp, state, overall_score, reasoning)
        VALUES (?, ?, ?, ?, ?, ?);
        """, (rec_id, payload.tenant_id, now_iso, state, final_score, reasoning))
        
        # Fetch transition history for context
        cursor.execute(
            "SELECT timestamp, state, overall_score, reasoning FROM health_history WHERE tenant_id = ? ORDER BY rowid DESC LIMIT 5;",
            (payload.tenant_id,)
        )
        history = [dict(r) for r in cursor.fetchall()]
        conn.commit()
        conn.close()

        health_state = HealthState(
            overall_score=final_score,
            state=state,
            timestamp=now_iso,
            reasoning=reasoning,
            transition_history=history
        )

        realtime_hub.safe_broadcast(
            channel="health_updates",
            tenant_id=payload.tenant_id,
            data=health_state.model_dump()
        )

        return health_state

health_engine = HealthEngine()
