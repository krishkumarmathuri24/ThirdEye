import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "Third Eye - Privacy-First AIOps Observability Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    API_KEY_HEADER: str = "X-ThirdEye-Key"
    DEFAULT_API_KEY: str = os.getenv("THIRDEYE_API_KEY", "thirdeye_live_secret_key_prod_99")
    HMAC_SECRET: str = os.getenv("THIRDEYE_HMAC_SECRET", "thirdeye_cryptographic_audit_secret_2026")
    
    # Multi-tenancy
    DEFAULT_TENANT_ID: str = os.getenv("THIRDEYE_TENANT_ID", "tenant_prod_us_east_1")
    DEFAULT_TENANT_REGION: str = "us-east-1"
    
    # Storage
    DATABASE_PATH: str = os.getenv("THIRDEYE_DB_PATH", os.path.join(os.path.dirname(__file__), "..", "thirdeye.db"))
    
    # Supabase Realtime Configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://your-project.supabase.co")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "sb_publishable_key_mock_live")
    SUPABASE_SERVICE_ROLE: str = os.getenv("SUPABASE_SERVICE_ROLE", "")
    ENABLE_SUPABASE_SYNC: bool = os.getenv("ENABLE_SUPABASE_SYNC", "false").lower() == "true"
    
    # Gemini AI Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

settings = Settings()
