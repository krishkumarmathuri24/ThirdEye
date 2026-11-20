import uuid
import json
from typing import Dict, Any, List
from datetime import datetime, timezone
from ..database import get_db_connection
from ..models import SecurityState, TelemetryIngestPayload
from ..realtime import realtime_hub

class SecurityEngine:
    """
    Evaluates Security Events & Threat Indicators:
      - Failed logins spike detection
      - Authentication retry storm detection
      - Credential brute-force probability
      - Security Score (0 - 100)
    """
    def evaluate_telemetry(self, payload: TelemetryIngestPayload) -> SecurityState:
        score = 100.0
        risk_events = []
        brute_force_indicator = False

        failed_logins = payload.failed_login_count

        if failed_logins > 50:
            score -= 60.0
            brute_force_indicator = True
            risk_events.append(f"CRITICAL: Authentication retry storm detected ({failed_logins} failed attempts/window)")
        elif failed_logins > 20:
            score -= 35.0
            brute_force_indicator = True
            risk_events.append(f"WARNING: High failed login spike ({failed_logins} failures)")
        elif failed_logins > 5:
            score -= 15.0
            risk_events.append(f"NOTICE: Elevated login failures ({failed_logins} attempts)")

        if payload.error_count > 40 and failed_logins > 10:
            score -= 15.0
            risk_events.append("Correlated Auth & API exception burst indicative of credential stuffing")

        final_score = max(0, min(100, int(round(score))))

        if final_score >= 90:
            risk_level = "Low"
        elif final_score >= 75:
            risk_level = "Guarded"
        elif final_score >= 50:
            risk_level = "Elevated"
        elif final_score >= 30:
            risk_level = "High"
        else:
            risk_level = "Critical"

        now_iso = datetime.now(timezone.utc).isoformat()

        # Save to security history
        conn = get_db_connection()
        cursor = conn.cursor()
        rec_id = f"sec_{uuid.uuid4().hex[:10]}"
        cursor.execute("""
        INSERT INTO security_history (id, tenant_id, timestamp, security_score, failed_logins, risk_level, risk_events_json)
        VALUES (?, ?, ?, ?, ?, ?, ?);
        """, (rec_id, payload.tenant_id, now_iso, final_score, failed_logins, risk_level, json.dumps(risk_events)))
        conn.commit()
        conn.close()

        sec_state = SecurityState(
            security_score=final_score,
            failed_logins_last_5m=failed_logins,
            brute_force_indicator=brute_force_indicator,
            risk_level=risk_level,
            timestamp=now_iso,
            risk_events=risk_events
        )

        realtime_hub.safe_broadcast(
            channel="security_updates",
            tenant_id=payload.tenant_id,
            data=sec_state.model_dump()
        )

        return sec_state

security_engine = SecurityEngine()
