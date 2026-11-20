import json
from fastapi import APIRouter, Query
from ..database import get_db_connection
from ..config import settings
from ..engines.trust_engine import trust_engine

router = APIRouter(tags=["Health, Security & Trust"])

@router.get("/health")
async def get_health(tenant_id: str = Query(settings.DEFAULT_TENANT_ID)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM health_history WHERE tenant_id = ? ORDER BY rowid DESC LIMIT 1;",
        (tenant_id,)
    )
    latest = cursor.fetchone()
    
    cursor.execute(
        "SELECT timestamp, state, overall_score, reasoning FROM health_history WHERE tenant_id = ? ORDER BY rowid DESC LIMIT 8;",
        (tenant_id,)
    )
    history = [dict(r) for r in cursor.fetchall()]
    conn.close()

    if latest:
        return {
            "overall_score": latest["overall_score"],
            "state": latest["state"],
            "timestamp": latest["timestamp"],
            "reasoning": latest["reasoning"],
            "transition_history": history
        }
    return {
        "overall_score": 98,
        "state": "Excellent",
        "timestamp": None,
        "reasoning": "Operating smoothly within nominal parameters.",
        "transition_history": []
    }

@router.get("/security")
async def get_security(tenant_id: str = Query(settings.DEFAULT_TENANT_ID)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM security_history WHERE tenant_id = ? ORDER BY rowid DESC LIMIT 1;",
        (tenant_id,)
    )
    latest = cursor.fetchone()
    
    cursor.execute(
        "SELECT timestamp, security_score, failed_logins, risk_level FROM security_history WHERE tenant_id = ? ORDER BY rowid DESC LIMIT 8;",
        (tenant_id,)
    )
    history = [dict(r) for r in cursor.fetchall()]
    conn.close()

    if latest:
        return {
            "security_score": latest["security_score"],
            "failed_logins": latest["failed_logins"],
            "risk_level": latest["risk_level"],
            "timestamp": latest["timestamp"],
            "risk_events": json.loads(latest["risk_events_json"]),
            "history": history
        }
    return {
        "security_score": 96,
        "failed_logins": 0,
        "risk_level": "Low",
        "timestamp": None,
        "risk_events": [],
        "history": []
    }

@router.get("/trust")
async def get_trust_scores(tenant_id: str = Query(settings.DEFAULT_TENANT_ID)):
    scores = trust_engine.calculate_scores(tenant_id)
    return scores.model_dump()
