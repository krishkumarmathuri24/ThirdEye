from fastapi import APIRouter, Query, Body
from typing import Dict, Any
from ..config import settings
from ..engines.collector_monitor import collector_monitor

router = APIRouter(prefix="/collector", tags=["Collector Health Monitoring"])

@router.post("/heartbeat")
async def collector_heartbeat(
    collector_id: str = Body("collector_primary", embed=True),
    status: str = Body("online", embed=True),
    queue_size: int = Body(0, embed=True),
    replayed_count: int = Body(0, embed=True),
    tenant_id: str = Query(settings.DEFAULT_TENANT_ID)
):
    # Resolve Query object to raw string when called directly (e.g. in tests)
    resolved_tenant = str(tenant_id) if not isinstance(tenant_id, str) else tenant_id
    if hasattr(resolved_tenant, 'default'):
        resolved_tenant = resolved_tenant.default  # type: ignore
    state = collector_monitor.record_heartbeat(
        tenant_id=resolved_tenant,
        collector_id=collector_id,
        status=status,
        queue_size=queue_size,
        replayed_count=replayed_count
    )
    return {"status": "recorded", "collector_state": state}

@router.get("/status")
async def get_collector_status(
    collector_id: str = Query("collector_primary"),
    tenant_id: str = Query(settings.DEFAULT_TENANT_ID)
):
    resolved_tenant = str(tenant_id) if not isinstance(tenant_id, str) else tenant_id
    if hasattr(resolved_tenant, 'default'):
        resolved_tenant = resolved_tenant.default  # type: ignore
    state = collector_monitor.get_collector_state(tenant_id=resolved_tenant, collector_id=collector_id)
    return state
