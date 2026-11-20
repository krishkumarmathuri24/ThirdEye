from typing import Dict, Any
from datetime import datetime, timezone
from ..database import get_db_connection
from ..models import TrustScores
from ..realtime import realtime_hub

class TrustDashboardEngine:
    """
    Computes Instant Real-Time Trust Scores:
      - Privacy Score (100% - zero unauthorized field transmissions, 100% egress verified)
      - Security Score
      - Health Score
      - Reliability Score (zero data loss, duplicate rejection rate, latency)
      - Prediction Risk Score
      - Incident Volume
      - Collector Health
    """
    def calculate_scores(self, tenant_id: str) -> TrustScores:
        conn = get_db_connection()
        cursor = conn.cursor()

        # 1. Privacy Score: strictly 100 if all outgoing payloads are verified metadata
        cursor.execute(
            "SELECT COUNT(*) as total, SUM(egress_verified) as verified FROM privacy_records WHERE tenant_id = ?;",
            (tenant_id,)
        )
        priv_row = cursor.fetchone()
        if priv_row and priv_row["total"] > 0:
            verified_count = priv_row["verified"] or 0
            privacy_score = int(round((verified_count / priv_row["total"]) * 100))
        else:
            privacy_score = 100

        # 2. Health Score
        cursor.execute(
            "SELECT overall_score FROM health_history WHERE tenant_id = ? ORDER BY rowid DESC LIMIT 1;",
            (tenant_id,)
        )
        hlth_row = cursor.fetchone()
        health_score = hlth_row["overall_score"] if hlth_row else 98

        # 3. Security Score
        cursor.execute(
            "SELECT security_score FROM security_history WHERE tenant_id = ? ORDER BY rowid DESC LIMIT 1;",
            (tenant_id,)
        )
        sec_row = cursor.fetchone()
        security_score = sec_row["security_score"] if sec_row else 95

        # 4. Collector Health & Reliability
        cursor.execute(
            "SELECT status, queue_size, replayed_count, reliability_percent FROM collector_status WHERE tenant_id = ? LIMIT 1;",
            (tenant_id,)
        )
        col_row = cursor.fetchone()
        if col_row:
            collector_health = col_row["status"]
            reliability_score = int(round(col_row["reliability_percent"]))
        else:
            collector_health = "online"
            reliability_score = 99

        # 5. Incident Volume & Prediction Risk
        cursor.execute(
            "SELECT COUNT(*) as active_incidents FROM incidents WHERE tenant_id = ? AND status = 'active';",
            (tenant_id,)
        )
        inc_row = cursor.fetchone()
        incident_volume = inc_row["active_incidents"] if inc_row else 0

        # Prediction Risk Score
        risk_score = min(100, max(5, int((100 - health_score) * 0.6 + (100 - security_score) * 0.4)))
        conn.close()

        now_iso = datetime.now(timezone.utc).isoformat()
        trust = TrustScores(
            privacy_score=privacy_score,
            security_score=security_score,
            health_score=health_score,
            reliability_score=reliability_score,
            prediction_risk_score=risk_score,
            incident_volume=incident_volume,
            collector_health=collector_health,
            timestamp=now_iso
        )

        realtime_hub.safe_broadcast(
            channel="trust_updates",
            tenant_id=tenant_id,
            data=trust.model_dump()
        )

        return trust

trust_engine = TrustDashboardEngine()
