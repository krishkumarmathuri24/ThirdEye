import sqlite3
import json
import logging
from typing import List, Dict, Any, Optional
from .config import collector_config

logger = logging.getLogger("thirdeye.collector.buffer")

class LocalBuffer:
    """
    Tier 1 SQLite Persistent Outbox Buffer.
    Ensures ZERO DATA LOSS and ZERO DUPLICATES.
    When SaaS is unreachable:
      - Buffers outgoing approved metadata in local SQLite outbox table
    When SaaS recovers:
      - Automatically replays pending payloads in strict sequence order
      - Updates delivery status and logs reliability metrics
    """
    def __init__(self):
        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(collector_config.BUFFER_DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS outbox (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            payload_id TEXT UNIQUE NOT NULL,
            sequence_number INTEGER NOT NULL,
            payload_json TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed
            created_at TEXT NOT NULL,
            attempts INTEGER NOT NULL DEFAULT 0,
            last_error TEXT
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_outbox_status ON outbox (status, id);")
        conn.commit()
        conn.close()

    def enqueue(self, payload: Dict[str, Any], sequence: int):
        conn = sqlite3.connect(collector_config.BUFFER_DB_PATH)
        cursor = conn.cursor()
        try:
            cursor.execute("""
            INSERT INTO outbox (payload_id, sequence_number, payload_json, status, created_at, attempts)
            VALUES (?, ?, ?, 'pending', ?, 0);
            """, (
                payload["payload_id"],
                sequence,
                json.dumps(payload),
                payload["timestamp"]
            ))
            conn.commit()
        except sqlite3.IntegrityError:
            pass # Deduplication
        finally:
            conn.close()

    def get_pending(self, limit: int = 50) -> List[Dict[str, Any]]:
        conn = sqlite3.connect(collector_config.BUFFER_DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("""
        SELECT id, payload_id, sequence_number, payload_json, attempts
        FROM outbox
        WHERE status = 'pending'
        ORDER BY id ASC LIMIT ?;
        """, (limit,))
        rows = cursor.fetchall()
        conn.close()

        items = []
        for r in rows:
            items.append({
                "db_id": r["id"],
                "payload_id": r["payload_id"],
                "sequence_number": r["sequence_number"],
                "attempts": r["attempts"],
                "payload": json.loads(r["payload_json"])
            })
        return items

    def mark_delivered(self, db_id: int):
        conn = sqlite3.connect(collector_config.BUFFER_DB_PATH)
        cursor = conn.cursor()
        cursor.execute("UPDATE outbox SET status = 'sent' WHERE id = ?;", (db_id,))
        conn.commit()
        conn.close()

    def mark_failed(self, db_id: int, error_msg: str):
        conn = sqlite3.connect(collector_config.BUFFER_DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
        UPDATE outbox SET attempts = attempts + 1, last_error = ? WHERE id = ?;
        """, (error_msg, db_id))
        conn.commit()
        conn.close()

    def get_queue_stats(self) -> Dict[str, int]:
        conn = sqlite3.connect(collector_config.BUFFER_DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT status, COUNT(*) as cnt FROM outbox GROUP BY status;")
        rows = cursor.fetchall()
        conn.close()

        stats = {"pending": 0, "sent": 0, "failed": 0}
        for status, cnt in rows:
            if status in stats:
                stats[status] = cnt
        return stats

local_buffer = LocalBuffer()
