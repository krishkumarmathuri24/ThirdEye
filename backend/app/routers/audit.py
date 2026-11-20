import json
from fastapi import APIRouter, Query
from typing import List, Dict, Any
from ..database import get_db_connection
from ..config import settings
from ..engines.audit_engine import audit_engine

router = APIRouter(prefix="/audit", tags=["Audit System & Cryptographic Hash Chain"])

@router.get("/logs")
async def get_audit_logs(
    tenant_id: str = Query(settings.DEFAULT_TENANT_ID),
    limit: int = Query(25, le=100)
):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM audit_chain WHERE tenant_id = ? ORDER BY rowid DESC LIMIT ?;
    """, (tenant_id, limit))
    rows = cursor.fetchall()
    conn.close()

    logs = []
    for r in rows:
        item = dict(r)
        item["details"] = json.loads(item["details_json"])
        logs.append(item)
    return logs

@router.get("/verify")
async def verify_audit_chain(tenant_id: str = Query(settings.DEFAULT_TENANT_ID)):
    """
    Cryptographically verifies the unbroken SHA-256 hash chain of the entire tenant audit trail.
    """
    verification = audit_engine.verify_chain(tenant_id)
    return verification
