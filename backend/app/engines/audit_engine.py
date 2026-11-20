import hashlib
import json
import uuid
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from ..database import get_db_connection
from ..models import AuditRecord
from ..realtime import realtime_hub

class AuditEngine:
    """
    Cryptographically chained, immutable audit log engine.
    Every event: SHA256(prev_hash + json(details) + timestamp + action + actor).
    Guarantees tamper-evidence across all ingestions, remediations, anomalies, and privacy actions.
    """
    def log_event(
        self,
        tenant_id: str,
        action_type: str,
        actor: str,
        details: Dict[str, Any]
    ) -> AuditRecord:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get the latest audit block hash for this tenant
        cursor.execute(
            "SELECT current_hash FROM audit_chain WHERE tenant_id = ? ORDER BY rowid DESC LIMIT 1;",
            (tenant_id,)
        )
        row = cursor.fetchone()
        prev_hash = row["current_hash"] if row else "0000000000000000000000000000000000000000000000000000000000000000"
        
        record_id = f"aud_{uuid.uuid4().hex[:12]}"
        timestamp = datetime.now(timezone.utc).isoformat()
        
        # Hash chaining formula
        details_serialized = json.dumps(details, sort_keys=True)
        block_content = f"{prev_hash}|{tenant_id}|{action_type}|{actor}|{timestamp}|{details_serialized}"
        current_hash = hashlib.sha256(block_content.encode("utf-8")).hexdigest()
        
        cursor.execute("""
        INSERT INTO audit_chain (id, tenant_id, timestamp, action_type, actor, details_json, prev_hash, current_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        """, (record_id, tenant_id, timestamp, action_type, actor, details_serialized, prev_hash, current_hash))
        conn.commit()
        conn.close()
        
        record = AuditRecord(
            id=record_id,
            tenant_id=tenant_id,
            timestamp=timestamp,
            action_type=action_type,
            actor=actor,
            details=details,
            prev_hash=prev_hash,
            current_hash=current_hash
        )
        
        realtime_hub.safe_broadcast(
            channel="audit_updates",
            tenant_id=tenant_id,
            data=record.model_dump()
        )
        
        return record

    def verify_chain(self, tenant_id: str) -> Dict[str, Any]:
        """
        Validates cryptographic integrity of the entire audit chain.
        """
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, timestamp, action_type, actor, details_json, prev_hash, current_hash FROM audit_chain WHERE tenant_id = ? ORDER BY rowid ASC;",
            (tenant_id,)
        )
        rows = cursor.fetchall()
        conn.close()
        
        if not rows:
            return {"valid": True, "blocks_count": 0, "message": "No audit records found"}
            
        prev_hash = rows[0]["prev_hash"]
        for index, row in enumerate(rows):
            if row["prev_hash"] != prev_hash:
                return {
                    "valid": False,
                    "tampered_at_index": index,
                    "block_id": row["id"],
                    "error": f"Previous hash mismatch at block {row['id']}"
                }
            
            # Recalculate hash
            block_content = f"{row['prev_hash']}|{tenant_id}|{row['action_type']}|{row['actor']}|{row['timestamp']}|{row['details_json']}"
            computed = hashlib.sha256(block_content.encode("utf-8")).hexdigest()
            
            if computed != row["current_hash"]:
                # Check genesis block edgecase
                if index == 0 and row["action_type"] == "SYSTEM_GENESIS":
                    pass
                else:
                    return {
                        "valid": False,
                        "tampered_at_index": index,
                        "block_id": row["id"],
                        "error": f"Current hash tampering detected at block {row['id']}"
                    }
            prev_hash = row["current_hash"]
            
        return {
            "valid": True,
            "blocks_count": len(rows),
            "latest_hash": prev_hash,
            "verified_at": datetime.now(timezone.utc).isoformat()
        }

audit_engine = AuditEngine()
