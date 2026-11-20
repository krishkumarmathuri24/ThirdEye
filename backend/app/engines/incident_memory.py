import json
import math
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from ..database import get_db_connection

class IncidentMemoryStore:
    """
    AI Incident Memory Vector Store.
    Embeds incident titles, root cause patterns, and past resolutions.
    When a new incident occurs, retrieves similar past incidents with:
      - similarity score (0.0 to 1.0)
      - previous resolution
      - root cause correlation
    """
    def __init__(self):
        self._seed_default_memories()

    def _simple_semantic_vector(self, text: str) -> List[float]:
        """
        Lightweight deterministic semantic feature vector (32 dimensions)
        for sub-millisecond local cosine similarity without downloading large weights.
        """
        tokens = text.lower().replace("-", " ").replace("_", " ").split()
        keywords = [
            "cpu", "memory", "ram", "leak", "oom", "disk", "storage",
            "latency", "network", "packet", "loss", "ping", "congestion",
            "auth", "login", "failed", "storm", "brute", "credential",
            "database", "query", "sql", "pool", "lock", "slow",
            "remediation", "throttle", "drain", "restart", "cache", "scale"
        ]
        vec = [0.0] * len(keywords)
        for i, kw in enumerate(keywords):
            if kw in tokens or any(kw in t for t in tokens):
                vec[i] = 1.0
        # Normalize
        norm = math.sqrt(sum(x * x for x in vec)) or 1.0
        return [round(x / norm, 4) for x in vec]

    def _cosine_similarity(self, v1: List[float], v2: List[float]) -> float:
        dot = sum(a * b for a, b in zip(v1, v2))
        return max(0.0, min(1.0, dot))

    def _seed_default_memories(self):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as cnt FROM incident_memory;")
        if cursor.fetchone()["cnt"] == 0:
            seeds = [
                {
                    "title": "Authentication Storm causing Crypto CPU saturation",
                    "root_cause": "External credential flood saturated PBKDF2/Argon2 hashing threads",
                    "resolution": "Applied dynamic rate limiting to /api/auth/login and enabled CAPTCHA challenge at ingress"
                },
                {
                    "title": "Database Query Degradation and Connection Exhaustion",
                    "root_cause": "Missing index on telemetry_records table caused sequential table scans",
                    "resolution": "Added compound index (tenant_id, timestamp) and increased pool max_connections to 128"
                },
                {
                    "title": "Network Congestion and Packet Loss Spike",
                    "root_cause": "VPC Gateway NAT interface bandwidth saturation",
                    "resolution": "Added dual NAT gateways across availability zones and tuned TCP receive buffer"
                },
                {
                    "title": "Memory Pressure leading to GC Thread Lock",
                    "root_cause": "Unbounded telemetry buffer heap accumulation during downstream network partition",
                    "resolution": "Configured circular ring buffer with local SQLite fallback outbox"
                }
            ]
            for s in seeds:
                v = self._simple_semantic_vector(s["title"] + " " + s["root_cause"])
                cursor.execute("""
                INSERT INTO incident_memory (id, title, root_cause, resolution, embedding_json, created_at)
                VALUES (?, ?, ?, ?, ?, ?);
                """, (
                    f"mem_{uuid.uuid4().hex[:8]}",
                    s["title"],
                    s["root_cause"],
                    s["resolution"],
                    json.dumps(v),
                    datetime.now(timezone.utc).isoformat()
                ))
            conn.commit()
        conn.close()

    def search_similar_incidents(self, title: str, root_cause: str, top_k: int = 3) -> List[Dict[str, Any]]:
        query_vec = self._simple_semantic_vector(title + " " + root_cause)
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, title, root_cause, resolution, embedding_json, created_at FROM incident_memory;")
        rows = cursor.fetchall()
        conn.close()

        scored = []
        for r in rows:
            vec = json.loads(r["embedding_json"])
            sim = self._cosine_similarity(query_vec, vec)
            if sim > 0.15:
                scored.append({
                    "id": r["id"],
                    "title": r["title"],
                    "root_cause": r["root_cause"],
                    "previous_resolution": r["resolution"],
                    "similarity_score": round(sim, 2),
                    "created_at": r["created_at"]
                })
        
        scored.sort(key=lambda x: x["similarity_score"], reverse=True)
        return scored[:top_k]

incident_memory_store = IncidentMemoryStore()
