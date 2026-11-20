import time
import json
import httpx
import logging
from typing import Dict, Any, Optional
from websockets.sync.client import connect
from .config import collector_config
from .psutil_collector import psutil_collector
from .privacy_pipeline import privacy_pipeline
from .local_buffer import local_buffer
from .egress_proof import egress_proof_logger

logging.basicConfig(level=logging.INFO, format="%(asctime)s [COLLECTOR] %(message)s")
logger = logging.getLogger("thirdeye.collector")

class ThirdEyeCollectorAgent:
    """
    Tier 1 Third Eye Customer Collector Agent.
    Runs continuously inside the customer environment.
    Guarantees:
      - Raw data stays local
      - Only approved metadata is queued and transmitted
      - Local outbox buffer protects against network outages (Zero Data Loss)
      - Automatic replay upon recovery (Zero Duplicates)
      - Real-time hardware telemetry streaming to Supabase Realtime WebSocket
    """
    def __init__(self):
        self.sequence_number = 0
        self.replayed_count = 0
        self.http_client = httpx.Client(timeout=4.0)
        self.supabase_ws = None

    def _ensure_supabase_ws(self):
        if self.supabase_ws is not None:
            return self.supabase_ws

        sb_url = collector_config.SUPABASE_URL
        sb_key = collector_config.SUPABASE_KEY
        if not sb_url or not sb_key:
            return None

        try:
            ws_host = sb_url.replace("https://", "").replace("http://", "").rstrip("/")
            ws_url = f"wss://{ws_host}/realtime/v1/websocket?apikey={sb_key}&vsn=1.0.0"
            ws = connect(ws_url, close_timeout=2.0)
            topic = f"realtime:{collector_config.TENANT_ID}:telemetry_updates"
            join_msg = {
                "topic": topic,
                "event": "phx_join",
                "payload": {"config": {"broadcast": {"self": True, "ack": True}}},
                "ref": "join_1"
            }
            ws.send(json.dumps(join_msg))
            ws.recv()  # receive join reply
            self.supabase_ws = ws
            logger.info("Connected to Supabase Realtime WebSocket for live hardware broadcasting")
            return self.supabase_ws
        except Exception as e:
            logger.warning(f"Could not connect to Supabase Realtime WS: {e}")
            self.supabase_ws = None
            return None

    def run_cycle(self):
        self.sequence_number += 1
        
        # 1. Collect Raw Telemetry Snapshot
        raw_data = psutil_collector.collect_raw_snapshot()

        # 2. Process via 6-Stage Privacy Pipeline
        metadata_payload, transparency_audit = privacy_pipeline.process(raw_data, self.sequence_number)

        # 3. Log cryptographic proof locally on customer disk
        egress_proof_logger.log_egress(metadata_payload)

        # 4. Enqueue in local SQLite outbox buffer
        local_buffer.enqueue(metadata_payload, self.sequence_number)

        # 4b. Cloud Sync: Direct Broadcast to Supabase Realtime WebSocket
        self._broadcast_to_supabase(metadata_payload)

        # 5. Flush pending payloads to SaaS endpoint (Replay + Delivery)
        self._flush_outbox()

        # 6. Emit Heartbeat
        self._send_heartbeat()

    def _broadcast_to_supabase(self, payload: Dict[str, Any]):
        ws = self._ensure_supabase_ws()
        if not ws:
            return

        try:
            topic = f"realtime:{collector_config.TENANT_ID}:telemetry_updates"
            bcast_msg = {
                "topic": topic,
                "event": "broadcast",
                "payload": {
                    "type": "broadcast",
                    "event": "update",
                    "payload": payload
                },
                "ref": str(self.sequence_number)
            }
            ws.send(json.dumps(bcast_msg))
            logger.info(f"Broadcast live hardware metrics: CPU={payload.get('cpu_percent')}% MEM={payload.get('memory_percent')}%")
        except Exception as e:
            logger.warning(f"Supabase WebSocket send failed: {e}")
            try:
                if self.supabase_ws:
                    self.supabase_ws.close()
            except Exception:
                pass
            self.supabase_ws = None

    def _flush_outbox(self):
        pending = local_buffer.get_pending(limit=20)
        if not pending:
            return

        headers = {
            "Content-Type": "application/json",
            "X-ThirdEye-Key": collector_config.API_KEY
        }

        for item in pending:
            db_id = item["db_id"]
            payload = item["payload"]
            try:
                resp = self.http_client.post(collector_config.SAAS_URL, json=payload, headers=headers)
                if resp.status_code in (200, 201):
                    local_buffer.mark_delivered(db_id)
                    if item["attempts"] > 0:
                        self.replayed_count += 1
                        logger.info(f"Replayed buffered payload {payload['payload_id']} successfully!")
                else:
                    local_buffer.mark_failed(db_id, f"HTTP {resp.status_code}: {resp.text[:100]}")
            except Exception as e:
                local_buffer.mark_failed(db_id, str(e))
                # Break to preserve strict FIFO sequence during network partition
                break

    def _send_heartbeat(self):
        stats = local_buffer.get_queue_stats()
        status = "online"
        if stats["pending"] > 20:
            status = "degraded"

        body = {
            "collector_id": collector_config.COLLECTOR_ID,
            "status": status,
            "queue_size": stats["pending"],
            "replayed_count": self.replayed_count
        }

        try:
            self.http_client.post(
                f"{collector_config.HEARTBEAT_URL}?tenant_id={collector_config.TENANT_ID}",
                json=body
            )
        except Exception:
            pass

    def run_forever(self):
        logger.info(f"Third Eye Collector Agent started. Tenant: {collector_config.TENANT_ID}")
        logger.info(f"SaaS Endpoint: {collector_config.SAAS_URL}")
        logger.info("Privacy Pipeline: ACTIVE (6 Stages Enforced)")
        while True:
            try:
                self.run_cycle()
            except Exception as e:
                logger.error(f"Collector error in cycle: {e}")
            time.sleep(collector_config.COLLECTION_INTERVAL_SECONDS)

collector_agent = ThirdEyeCollectorAgent()

if __name__ == "__main__":
    collector_agent.run_forever()
