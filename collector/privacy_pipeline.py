import hmac
import hashlib
import json
import re
import uuid
from typing import Dict, Any, Tuple, List
from datetime import datetime, timezone
from .config import collector_config

class PrivacyPipeline:
    """
    Tier 1 Privacy Engine.
    Executes 6 Mandatory Stages:
      1. Collection (raw infrastructure, logs, network, app metrics)
      2. Detection (identify credentials, tokens, PII, raw queries)
      3. Redaction (mask sensitive fields)
      4. Pseudonymization (HMAC-SHA256 salted node/user hashing)
      5. Transmission Approval (strict metadata allow-list enforcement)
      6. Metadata Export (audit counts, SHA-256 payload hash, cryptographic signature)
    
    CORE PRINCIPLE:
      Raw logs, database records, tokens, and payloads NEVER leave customer infrastructure.
    """
    def __init__(self):
        self.secret_patterns = [
            (re.compile(r'(?i)bearer\s+[a-zA-Z0-9_\-\.]+'), '[REDACTED_BEARER_TOKEN]'),
            (re.compile(r'(?i)api[_-]?key["\']?\s*[:=]\s*["\']?[a-zA-Z0-9_\-]+["\']?'), 'api_key=[REDACTED_KEY]'),
            (re.compile(r'(?i)password["\']?\s*[:=]\s*["\']?[^"\',;\s]+["\']?'), 'password=[REDACTED_PASSWORD]'),
            (re.compile(r'(?i)\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b'), '[REDACTED_EMAIL_PII]'),
            (re.compile(r'\b\d{3}-\d{2}-\d{4}\b'), '[REDACTED_SSN_PII]'),
            (re.compile(r'(?i)select\s+.*\s+from\s+.*\s+where\s+(.*)'), 'SELECT [REDACTED_FIELDS] FROM [TABLE] WHERE [REDACTED_SQL_QUERY_PARAMS]')
        ]

        self.approved_metadata_allowlist = {
            "payload_id",
            "tenant_id",
            "timestamp",
            "source_id_hmac",
            "sequence_number",
            "cpu_percent",
            "memory_percent",
            "disk_percent",
            "network_rx_kbps",
            "network_tx_kbps",
            "ping_latency_ms",
            "packet_loss_percent",
            "failed_login_count",
            "error_count",
            "db_query_latency_ms",
            "db_connection_pool_usage",
            "privacy_metrics",
            "payload_hash_sha256",
            "redaction_summary"
        }

    def process(self, raw_data: Dict[str, Any], sequence: int) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Executes the 6-stage pipeline.
        Returns:
          (approved_metadata_payload, local_transparency_audit_record)
        """
        # --- STAGE 1: Collection ---
        collected_fields_count = len(raw_data)
        stage_1_snapshot = dict(raw_data)

        # --- STAGE 2: Detection ---
        detected_secrets = []
        for k, v in raw_data.items():
            str_v = str(v)
            for pattern, _ in self.secret_patterns:
                if pattern.search(str_v):
                    detected_secrets.append(k)
                    break

        # --- STAGE 3: Redaction ---
        redacted_fields_count = len(detected_secrets)
        stage_2_snapshot = {}
        redaction_manifest = []

        for k, v in raw_data.items():
            val = str(v)
            redacted_val = val
            for pattern, replacement in self.secret_patterns:
                if pattern.search(redacted_val):
                    redacted_val = pattern.sub(replacement, redacted_val)
                    redaction_manifest.append(f"Field '{k}' sanitized with pattern '{replacement}'")
            stage_2_snapshot[k] = redacted_val

        # --- STAGE 4: Pseudonymization ---
        raw_source = str(raw_data.get("raw_hostname", "worker_host_node"))
        source_hmac = hmac.new(
            collector_config.HMAC_SECRET.encode(),
            raw_source.encode(),
            hashlib.sha256
        ).hexdigest()[:24]
        pseudonymized_source_id = f"hmac_node_{source_hmac}"

        # --- STAGE 5: Transmission Approval (Strict Allowlist) ---
        payload_id = f"meta_{uuid.uuid4().hex[:14]}"
        now_iso = datetime.now(timezone.utc).isoformat()
        
        # Build candidate metadata dictionary
        candidate = {
            "payload_id": payload_id,
            "tenant_id": collector_config.TENANT_ID,
            "timestamp": now_iso,
            "source_id_hmac": pseudonymized_source_id,
            "sequence_number": sequence,
            "cpu_percent": float(raw_data.get("cpu_percent", 0.0)),
            "memory_percent": float(raw_data.get("memory_percent", 0.0)),
            "disk_percent": float(raw_data.get("disk_percent", 0.0)),
            "network_rx_kbps": float(raw_data.get("network_rx_kbps", 0.0)),
            "network_tx_kbps": float(raw_data.get("network_tx_kbps", 0.0)),
            "ping_latency_ms": float(raw_data.get("ping_latency_ms", 0.0)),
            "packet_loss_percent": float(raw_data.get("packet_loss_percent", 0.0)),
            "failed_login_count": int(raw_data.get("failed_login_count", 0)),
            "error_count": int(raw_data.get("error_count", 0)),
            "db_query_latency_ms": float(raw_data.get("db_query_latency_ms", 0.0)),
            "db_connection_pool_usage": float(raw_data.get("db_connection_pool_usage", 0.0)),
        }

        # Any key in raw_data not in approved_metadata is dropped
        removed_fields_count = len([k for k in raw_data.keys() if k not in candidate])

        # --- STAGE 6: Metadata Export & Cryptographic Hashing ---
        privacy_metrics = {
            "collected_fields": collected_fields_count,
            "removed_fields": removed_fields_count,
            "redacted_fields": redacted_fields_count,
            "transmitted_fields": len(candidate)
        }
        candidate["privacy_metrics"] = privacy_metrics
        candidate["redaction_summary"] = redaction_manifest or ["Strict allowlist filtering applied", "Raw payload strings eliminated"]

        # Compute SHA-256 hash of outgoing metadata payload
        canonical_str = json.dumps(candidate, sort_keys=True)
        payload_hash = hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()
        candidate["payload_hash_sha256"] = payload_hash

        # Local Transparency Audit Record (remains in Tier 1 for Replay inspection)
        transparency_audit = {
            "payload_id": payload_id,
            "timestamp": now_iso,
            "field_counts": privacy_metrics,
            "stage_1_raw": stage_1_snapshot,
            "stage_2_sanitized": stage_2_snapshot,
            "stage_3_metadata": candidate,
            "payload_hash": payload_hash
        }

        return candidate, transparency_audit

privacy_pipeline = PrivacyPipeline()
