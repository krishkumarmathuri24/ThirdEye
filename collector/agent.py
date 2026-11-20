import time
import httpx
import logging
from typing import Dict, Any
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
    """
    def __init__(self):
        self.sequence_number = 0
        self.replayed_count = 0
        self.http_client = httpx.Client(timeout=4.0)

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

        # 5. Flush pending payloads to SaaS endpoint (Replay + Delivery)
        self._flush_outbox()

        # 6. Emit Heartbeat
        self._send_heartbeat()

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
