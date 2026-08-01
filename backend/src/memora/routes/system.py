from fastapi import APIRouter, HTTPException, status

from memora.auth import CurrentUser
from memora.config import get_settings
from memora.services.ai import test_connection
from memora.supabase import admin_client

router = APIRouter()


@router.get("/api/health")
async def health() -> dict[str, object]:
    return {"success": True, "service": "Memora Backend", "status": "Healthy"}


@router.get("/api/test-db")
async def test_db(_: CurrentUser) -> dict[str, object]:
    if not get_settings().enable_diagnostic_endpoints:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    data = admin_client().table("knowledge_items").select("id").limit(1).execute().data
    return {
        "success": True,
        "message": "Supabase database connected successfully 🚀",
        "rows": len(data),
    }


@router.get("/api/ai-test")
async def ai_test(_: CurrentUser) -> dict[str, object]:
    if not get_settings().enable_diagnostic_endpoints:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    return {"success": True, "result": await test_connection()}
