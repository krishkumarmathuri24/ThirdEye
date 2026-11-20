import json
from fastapi import APIRouter, HTTPException, Query, Body
from typing import List, Dict, Any
from ..database import get_db_connection
from ..config import settings
from ..engines.remediation_engine import remediation_engine

router = APIRouter(prefix="/remediation", tags=["Safe Remediation System"])

@router.get("/recommendations")
async def get_recommendations(
    tenant_id: str = Query(settings.DEFAULT_TENANT_ID),
    status: str = Query("all")
):
    conn = get_db_connection()
    cursor = conn.cursor()
    if status == "all":
        cursor.execute("SELECT * FROM recommendations WHERE tenant_id = ? ORDER BY rowid DESC LIMIT 20;", (tenant_id,))
    else:
        cursor.execute("SELECT * FROM recommendations WHERE tenant_id = ? AND status = ? ORDER BY rowid DESC LIMIT 20;", (tenant_id, status))
    rows = cursor.fetchall()
    conn.close()

    res = []
    for r in rows:
        item = dict(r)
        item["signals"] = json.loads(item["signals_json"])
        res.append(item)
    return res

@router.get("/workflows")
async def get_remediation_workflows(
    tenant_id: str = Query(settings.DEFAULT_TENANT_ID),
    limit: int = Query(15, le=50)
):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM remediation WHERE tenant_id = ? ORDER BY rowid DESC LIMIT ?;
    """, (tenant_id, limit))
    rows = cursor.fetchall()
    conn.close()

    workflows = []
    for r in rows:
        item = dict(r)
        item["rollback_snapshot"] = json.loads(item["rollback_snapshot_json"])
        workflows.append(item)
    return workflows

@router.post("/propose")
async def propose_remediation(
    recommendation_id: str = Body(..., embed=True),
    tenant_id: str = Body(settings.DEFAULT_TENANT_ID, embed=True),
    operator: str = Body("operator_oncall", embed=True)
):
    wf = remediation_engine.propose_remediation(
        recommendation_id=recommendation_id,
        tenant_id=tenant_id,
        operator=operator
    )
    return wf.model_dump()

@router.post("/simulate")
async def simulate_remediation(
    remediation_id: str = Body(..., embed=True),
    tenant_id: str = Body(settings.DEFAULT_TENANT_ID, embed=True),
    operator: str = Body("operator_oncall", embed=True)
):
    wf = remediation_engine.execute_simulation(
        remediation_id=remediation_id,
        tenant_id=tenant_id,
        operator=operator
    )
    return wf.model_dump()

@router.post("/rollback")
async def rollback_remediation(
    remediation_id: str = Body(..., embed=True),
    tenant_id: str = Body(settings.DEFAULT_TENANT_ID, embed=True),
    operator: str = Body("operator_oncall", embed=True)
):
    wf = remediation_engine.rollback(
        remediation_id=remediation_id,
        tenant_id=tenant_id,
        operator=operator
    )
    return wf.model_dump()
