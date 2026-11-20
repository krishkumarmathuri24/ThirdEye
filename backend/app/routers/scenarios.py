from fastapi import APIRouter, Query, Body
from typing import Dict, Any
from ..config import settings
from ..models import ScenarioTrigger
from ..engines.scenario_engine import scenario_engine

router = APIRouter(prefix="/scenarios", tags=["Live Scenario Engine"])

@router.post("/trigger")
async def trigger_scenario(
    body: ScenarioTrigger,
    tenant_id: str = Query(settings.DEFAULT_TENANT_ID)
):
    """
    Executes live scenario end-to-end:
      Scenario -> Ingest -> Analysis -> Incident -> Recommendation -> Realtime Broadcast!
    """
    res = scenario_engine.execute_scenario(
        tenant_id=tenant_id,
        scenario_type=body.scenario_type,
        intensity=body.intensity or 1.0
    )
    return res

@router.get("/list")
async def list_available_scenarios():
    return {
        "scenarios": [
            {"id": "cpu_spike", "name": "CPU Spike & Thread Starvation", "category": "Infrastructure"},
            {"id": "memory_leak", "name": "Memory Leak & Heap Thrashing", "category": "Infrastructure"},
            {"id": "disk_saturation", "name": "Disk I/O Saturation (99%)", "category": "Infrastructure"},
            {"id": "latency_surge", "name": "Network Latency Surge (>240ms)", "category": "Network"},
            {"id": "packet_loss", "name": "Packet Loss Burst (>6%)", "category": "Network"},
            {"id": "db_slowdown", "name": "Database Query Degradation & Lock Contention", "category": "Database"},
            {"id": "failed_login_flood", "name": "Credential Stuffing & Auth Storm", "category": "Security"},
            {"id": "application_failure", "name": "Cascading HTTP 5xx Runtime Exception Wave", "category": "Application"},
            {"id": "ddos", "name": "Distributed Denial of Service (DDoS) Simulation", "category": "Network/Security"},
            {"id": "collector_outage", "name": "Collector Network Partition & Offline Buffering", "category": "Reliability"},
            {"id": "saas_recovery", "name": "SaaS Return & Automated Queue Replay", "category": "Reliability"}
        ]
    }
