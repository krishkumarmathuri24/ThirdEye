from fastapi import APIRouter
from ..models import CopilotQuery
from ..config import settings
from ..engines.copilot_engine import copilot_engine

router = APIRouter(prefix="/copilot", tags=["Infrastructure Copilot"])

@router.post("/chat")
async def ask_copilot(query: CopilotQuery):
    tenant_id = query.tenant_id or settings.DEFAULT_TENANT_ID
    res = await copilot_engine.answer_query(query.question, tenant_id)
    return res
