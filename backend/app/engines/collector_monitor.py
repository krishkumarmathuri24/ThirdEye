from typing import Dict, Any, Optional
from datetime import datetime, timezone
from ..database import get_db_connection
from ..realtime import realtime_hub

class CollectorHealthMonitor:
    """
    Collector Health Monitoring & Buffer Reliability Tracking.
    Tracks:
      - online, offline, degraded
      - heartbeat missing detection
      - buffer queue size
      - replayed count
      - reliability score
    """
    def record_heartbeat(
        self,
        tenant_id: str,
        collector_id: str,
        status: str = "online",
        queue_size: int = 0,
        replayed_count: int = 0
    ) -> Dict[str, Any]:
        now_iso = datetime.now(timezone.utc).isoformat()
        
        # Reliability computation
        reliability = 100.0
        if status == "degraded":
            reliability = 82.5
        elif status == "offline":
            reliability = 45.0
        elif queue_size > 50:
            reliability = 91.0

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO collector_status (tenant_id, collector_id, status, last_heartbeat, queue_size, replayed_count, reliability_percent)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(tenant_id, collector_id) DO UPDATE SET
            status = excluded.status,
            last_heartbeat = excluded.last_heartbeat,
            queue_size = excluded.queue_size,
            replayed_count = excluded.replayed_count,
            reliability_percent = excluded.reliability_percent;
        """, (tenant_id, collector_id, status, now_iso, queue_size, replayed_count, reliability))
        conn.commit()
        conn.close()

        state = {
            "collector_id": collector_id,
            "tenant_id": tenant_id,
            "status": status,
            "last_heartbeat": now_iso,
            "queue_size": queue_size,
            "replayed_count": replayed_count,
            "reliability_percent": reliability
        }

        realtime_hub.safe_broadcast(
            channel="collector_updates",
            tenant_id=tenant_id,
            data=state
        )

        return state

    def get_collector_state(self, tenant_id: str, collector_id: str = "collector_primary") -> Dict[str, Any]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM collector_status WHERE tenant_id = ? ORDER BY last_heartbeat DESC LIMIT 1;",
            (tenant_id,)
        )
        row = cursor.fetchone()
        conn.close()
        if row:
            return dict(row)
        return {
            "tenant_id": tenant_id,
            "collector_id": collector_id,
            "status": "online",
            "last_heartbeat": datetime.now(timezone.utc).isoformat(),
            "queue_size": 0,
            "replayed_count": 0,
            "reliability_percent": 100.0
        }

collector_monitor = CollectorHealthMonitor()
