import asyncio
import json
import logging
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import Optional

from .config import settings
from .database import init_db
from .realtime import realtime_hub
from .routers import (
    telemetry,
    privacy,
    incidents,
    health_security,
    forecasting,
    remediation,
    copilot,
    scenarios,
    audit,
    collector
)

# Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("thirdeye")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Privacy-First Real-Time AIOps Observability Platform SaaS Backend"
)

# Allow CORS for development and frontend dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all API routers
api_prefix = settings.API_V1_STR
app.include_router(telemetry.router, prefix=api_prefix)
app.include_router(privacy.router, prefix=api_prefix)
app.include_router(incidents.router, prefix=api_prefix)
app.include_router(health_security.router, prefix=api_prefix)
app.include_router(forecasting.router, prefix=api_prefix)
app.include_router(remediation.router, prefix=api_prefix)
app.include_router(copilot.router, prefix=api_prefix)
app.include_router(scenarios.router, prefix=api_prefix)
app.include_router(audit.router, prefix=api_prefix)
app.include_router(collector.router, prefix=api_prefix)

@app.on_event("startup")
async def startup_event():
    logger.info("Initializing Third Eye database schema and cryptographic chain...")
    init_db()
    logger.info("Third Eye SaaS Backend initialized and ready for sub-second event broadcasts.")

@app.get("/")
async def root():
    return {
        "platform": "Third Eye AIOps",
        "mode": "Privacy-First / Metadata-Only SaaS",
        "version": settings.VERSION,
        "default_tenant": settings.DEFAULT_TENANT_ID,
        "realtime_target": "< 1s latency",
        "channels": [
            "telemetry_updates", "health_updates", "security_updates",
            "incident_updates", "recommendation_updates", "audit_updates",
            "remediation_updates", "collector_updates", "trust_updates",
            "privacy_updates", "forecast_updates"
        ]
    }

@app.get("/healthz")
async def healthz():
    return {"status": "healthy", "service": "thirdeye-saas"}

# =========================================================================
# REAL-TIME EVENT STREAMING: SUB-SECOND, ZERO-POLLING EVENT PROPAGATION
# =========================================================================

@app.get("/api/v1/realtime/stream")
async def sse_event_stream(
    request: Request,
    tenant_id: str = Query(settings.DEFAULT_TENANT_ID)
):
    """
    Server-Sent Events (SSE) zero-polling real-time feed.
    Emits events instantly across all 11 Supabase Realtime channels with sub-second latency.
    """
    queue = await realtime_hub.register_subscriber(tenant_id)

    async def event_generator():
        try:
            # Send initial connected handshake
            yield f"event: connected\ndata: {json.dumps({'status': 'connected', 'tenant_id': tenant_id, 'channels_subscribed': 11})}\n\n"
            
            while True:
                # Check for client disconnect
                if await request.is_disconnected():
                    break
                
                try:
                    # Wait for next event without busy waiting
                    event = await asyncio.wait_for(queue.get(), timeout=20.0)
                    channel = event.get("channel", "message")
                    yield f"event: {channel}\ndata: {json.dumps(event)}\n\n"
                except asyncio.TimeoutError:
                    # Keep-alive heartbeat ping
                    yield f": keep-alive ping\n\n"
        finally:
            await realtime_hub.unregister_subscriber(tenant_id, queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@app.websocket("/api/v1/realtime/ws/{tenant_id}")
async def websocket_realtime_feed(websocket: WebSocket, tenant_id: str):
    """
    Sub-second bidirectional real-time WebSocket channel mirror.
    """
    await websocket.accept()
    queue = await realtime_hub.register_subscriber(tenant_id)
    try:
        await websocket.send_json({"type": "connected", "tenant_id": tenant_id})
        while True:
            event = await queue.get()
            await websocket.send_json(event)
    except (WebSocketDisconnect, Exception):
        pass
    finally:
        await realtime_hub.unregister_subscriber(tenant_id, queue)
