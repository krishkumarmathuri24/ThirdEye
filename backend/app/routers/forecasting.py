from fastapi import APIRouter, Query
from typing import List
from ..config import settings
from ..database import get_db_connection
from ..engines.forecasting_engine import forecasting_engine
from ..models import TelemetryIngestPayload

router = APIRouter(prefix="/forecasting", tags=["Forecasting"])

@router.get("")
async def get_forecasts(tenant_id: str = Query(settings.DEFAULT_TENANT_ID)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM telemetry WHERE tenant_id = ? ORDER BY rowid DESC LIMIT 1;",
        (tenant_id,)
    )
    row = cursor.fetchone()
    conn.close()

    if row:
        payload = TelemetryIngestPayload(
            payload_id=row["payload_id"],
            tenant_id=row["tenant_id"],
            timestamp=row["timestamp"],
            source_id_hmac=row["source_id_hmac"],
            sequence_number=row["sequence_number"],
            cpu_percent=row["cpu_percent"],
            memory_percent=row["memory_percent"],
            disk_percent=row["disk_percent"],
            network_rx_kbps=row["network_rx_kbps"],
            network_tx_kbps=row["network_tx_kbps"],
            ping_latency_ms=row["ping_latency_ms"],
            packet_loss_percent=row["packet_loss_percent"],
            failed_login_count=row["failed_login_count"],
            error_count=row["error_count"],
            db_query_latency_ms=row["db_query_latency_ms"],
            db_connection_pool_usage=row["db_connection_pool_usage"],
            payload_hash_sha256=row["payload_hash_sha256"]
        )
    else:
        payload = TelemetryIngestPayload(
            payload_id="sim_init",
            tenant_id=tenant_id,
            source_id_hmac="hmac_source_0",
            sequence_number=1,
            cpu_percent=34.0,
            memory_percent=52.0,
            disk_percent=60.0,
            network_rx_kbps=1000.0,
            network_tx_kbps=500.0,
            ping_latency_ms=25.0,
            packet_loss_percent=0.0,
            failed_login_count=0,
            error_count=1,
            db_query_latency_ms=18.0,
            db_connection_pool_usage=30.0,
            payload_hash_sha256="hash_init"
        )

    preds = forecasting_engine.generate_forecasts(payload)
    return [p.model_dump() for p in preds]
