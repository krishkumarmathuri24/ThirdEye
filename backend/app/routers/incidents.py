import json
from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any
from datetime import datetime, timezone
from ..database import get_db_connection
from ..config import settings
from ..engines.incident_memory import incident_memory_store
from ..engines.audit_engine import audit_engine

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.get("")
async def get_incidents(
    tenant_id: str = Query(settings.DEFAULT_TENANT_ID),
    status: str = Query("all") # active, resolved, all
):
    conn = get_db_connection()
    cursor = conn.cursor()
    if status == "all":
        cursor.execute("SELECT * FROM incidents WHERE tenant_id = ? ORDER BY rowid DESC LIMIT 20;", (tenant_id,))
    else:
        cursor.execute("SELECT * FROM incidents WHERE tenant_id = ? AND status = ? ORDER BY rowid DESC LIMIT 20;", (tenant_id, status))
    rows = cursor.fetchall()
    conn.close()

    results = []
    for r in rows:
        item = dict(r)
        item["affected_systems"] = json.loads(item["affected_systems_json"])
        item["root_cause_chain"] = json.loads(item["root_cause_chain_json"])
        item["explainability"] = json.loads(item["explainability_json"])
        item["timeline"] = json.loads(item["timeline_json"])
        results.append(item)
    return results

@router.get("/{incident_id}")
async def get_incident_detail(incident_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM incidents WHERE id = ?;", (incident_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Incident not found")

    item = dict(row)
    item["affected_systems"] = json.loads(item["affected_systems_json"])
    item["root_cause_chain"] = json.loads(item["root_cause_chain_json"])
    item["explainability"] = json.loads(item["explainability_json"])
    item["timeline"] = json.loads(item["timeline_json"])

    # Retrieve similar incidents from vector memory
    similar = incident_memory_store.search_similar_incidents(item["title"], item["probable_cause"], top_k=3)
    item["vector_memory_matches"] = similar

    return item

@router.post("/{incident_id}/resolve")
async def resolve_incident(incident_id: str, operator: str = Query("operator_admin")):
    conn = get_db_connection()
    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
    UPDATE incidents SET status = 'resolved', resolved_at = ? WHERE id = ?;
    """, (now_iso, incident_id))
    cursor.execute("SELECT tenant_id, title FROM incidents WHERE id = ?;", (incident_id,))
    row = cursor.fetchone()
    conn.commit()
    conn.close()

    if row:
        audit_engine.log_event(
            tenant_id=row["tenant_id"],
            action_type="INCIDENT_RESOLVED",
            actor=operator,
            details={"incident_id": incident_id, "title": row["title"], "resolved_at": now_iso}
        )

    return {"status": "resolved", "incident_id": incident_id, "resolved_at": now_iso}
