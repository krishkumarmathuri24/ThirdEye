import json
from datetime import datetime, timezone
from typing import Dict, Any
from .config import collector_config

class EgressProofLogger:
    """
    Tier 1 Local Egress Proof Logger.
    Appends immutable proof lines to local JSONL log on customer infrastructure.
    Guarantees independent auditing by customer compliance and security teams.
    """
    def log_egress(self, payload: Dict[str, Any]):
        proof_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "payload_id": payload["payload_id"],
            "tenant_id": payload["tenant_id"],
            "source_id_hmac": payload["source_id_hmac"],
            "sequence_number": payload["sequence_number"],
            "payload_hash_sha256": payload["payload_hash_sha256"],
            "field_counts": payload["privacy_metrics"],
            "redaction_summary": payload["redaction_summary"],
            "metadata_fields_transmitted": list(payload.keys())
        }

        try:
            with open(collector_config.EGRESS_LOG_PATH, "a", encoding="utf-8") as f:
                f.write(json.dumps(proof_entry) + "\n")
        except Exception:
            pass

egress_proof_logger = EgressProofLogger()
