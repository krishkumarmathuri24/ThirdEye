import asyncio
import json
import logging
from typing import Dict, List, Set, Any
from datetime import datetime, timezone
import httpx
from .config import settings

logger = logging.getLogger("thirdeye.realtime")

class SupabaseRealtimeHub:
    """
    Supabase Realtime Event Broadcast Hub.
    Manages tenant-scoped event distribution across all channels:
      - telemetry_updates
      - health_updates
      - security_updates
      - incident_updates
      - recommendation_updates
      - audit_updates
      - remediation_updates
      - collector_updates
      - trust_updates
      - privacy_updates
      - forecast_updates
    
    Provides sub-second event delivery with zero polling.
    Supports native Supabase Realtime broadcast endpoints AND an in-memory
    SSE/WebSocket event queue for instantaneous local zero-latency subscribers.
    """
    def __init__(self):
        self.subscribers: Dict[str, Set[asyncio.Queue]] = {}
        self._lock: Optional[asyncio.Lock] = None
        self.broadcast_stats = {
            "total_broadcasts": 0,
            "last_broadcast_timestamp": None,
            "channel_counts": {}
        }
        self._http_client: Optional[httpx.AsyncClient] = None

    async def get_http_client(self) -> httpx.AsyncClient:
        if self._http_client is None or self._http_client.is_closed:
            self._http_client = httpx.AsyncClient(timeout=4.0)
        return self._http_client

    def _get_lock(self) -> asyncio.Lock:
        if self._lock is None:
            self._lock = asyncio.Lock()
        return self._lock

    async def register_subscriber(self, tenant_id: str) -> asyncio.Queue:
        async with self._get_lock():
            if tenant_id not in self.subscribers:
                self.subscribers[tenant_id] = set()
            queue = asyncio.Queue(maxsize=100)
            self.subscribers[tenant_id].add(queue)
            return queue

    async def unregister_subscriber(self, tenant_id: str, queue: asyncio.Queue):
        async with self._get_lock():
            if tenant_id in self.subscribers:
                self.subscribers[tenant_id].discard(queue)
                if not self.subscribers[tenant_id]:
                    del self.subscribers[tenant_id]

    def safe_broadcast(self, channel: str, tenant_id: str, data: Dict[str, Any]):
        """
        Safely dispatches broadcast_event whether inside an async event loop
        or in synchronous contexts.
        """
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self.broadcast_event(channel, tenant_id, data))
        except RuntimeError:
            pass

    async def broadcast_event(self, channel: str, tenant_id: str, data: Dict[str, Any]):
        now_iso = datetime.now(timezone.utc).isoformat()
        event_payload = {
            "channel": channel,
            "tenant_id": tenant_id,
            "timestamp": now_iso,
            "data": data
        }
        
        self.broadcast_stats["total_broadcasts"] += 1
        self.broadcast_stats["last_broadcast_timestamp"] = now_iso
        self.broadcast_stats["channel_counts"][channel] = self.broadcast_stats["channel_counts"].get(channel, 0) + 1

        # Distribute to in-memory subscriber queues
        try:
            queues = list(self.subscribers.get(tenant_id, set()))

            for q in queues:
                try:
                    if q.full():
                        try:
                            q.get_nowait()
                        except asyncio.QueueEmpty:
                            pass
                    q.put_nowait(event_payload)
                except Exception as e:
                    logger.error(f"Error queueing event to subscriber: {e}")
        except Exception:
            pass

        # Supabase Realtime synchronization
        if settings.ENABLE_SUPABASE_SYNC and settings.SUPABASE_URL and settings.SUPABASE_KEY:
            try:
                asyncio.create_task(self._sync_to_supabase(channel, tenant_id, event_payload))
            except Exception:
                pass

    async def _sync_to_supabase(self, channel: str, tenant_id: str, payload: Dict[str, Any]):
        try:
            url = f"{settings.SUPABASE_URL}/realtime/v1/api/broadcast"
            headers = {
                "apikey": settings.SUPABASE_KEY,
                "Authorization": f"Bearer {settings.SUPABASE_KEY}",
                "Content-Type": "application/json"
            }
            body = {
                "messages": [
                    {
                        "topic": f"realtime:{tenant_id}:{channel}",
                        "event": "update",
                        "payload": payload
                    }
                ]
            }
            client = await self.get_http_client()
            await client.post(url, headers=headers, json=body)
        except Exception as e:
            logger.debug(f"Supabase sync silent skip: {e}")

# Global singleton
realtime_hub = SupabaseRealtimeHub()
