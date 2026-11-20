import os

def _load_dotenv():
    env_paths = [
        os.path.join(os.path.dirname(__file__), "..", ".env"),
        os.path.join(os.path.dirname(__file__), ".env")
    ]
    for p in env_paths:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            if k.strip() not in os.environ:
                                os.environ[k.strip()] = v.strip().strip('"').strip("'")
            except Exception:
                pass

_load_dotenv()

class CollectorConfig:
    TENANT_ID: str = os.getenv("THIRDEYE_TENANT_ID", "tenant_prod_us_east_1")
    COLLECTOR_ID: str = os.getenv("THIRDEYE_COLLECTOR_ID", "collector_agent_node_alpha")
    SAAS_URL: str = os.getenv("THIRDEYE_SAAS_URL", "http://127.0.0.1:8000/api/v1/telemetry/ingest")
    HEARTBEAT_URL: str = os.getenv("THIRDEYE_HEARTBEAT_URL", "http://127.0.0.1:8000/api/v1/collector/heartbeat")
    API_KEY: str = os.getenv("THIRDEYE_API_KEY", "thirdeye_live_secret_key_prod_99")
    HMAC_SECRET: str = os.getenv("THIRDEYE_HMAC_SECRET", "thirdeye_collector_salt_sec_2026")
    
    # Direct Cloud Supabase Realtime Broadcast Bridge
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", os.getenv("VITE_SUPABASE_URL", ""))
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", os.getenv("VITE_SUPABASE_ANON_KEY", ""))
    
    BUFFER_DB_PATH: str = os.path.join(os.path.dirname(__file__), "outbox.db")
    EGRESS_LOG_PATH: str = os.path.join(os.path.dirname(__file__), "egress_proofs.jsonl")
    
    COLLECTION_INTERVAL_SECONDS: float = 1.5
    MAX_BUFFER_SIZE: int = 50000

collector_config = CollectorConfig()
