from fastapi import APIRouter
from memora.services.ai import test_connection
from memora.supabase import admin_client

router = APIRouter()


@router.get("/api/health")
async def health() -> dict[str, object]:
    return {"success": True, "service": "Memora Backend", "status": "Healthy"}


@router.get("/api/test-db")
async def test_db() -> dict[str, object]:
    data = admin_client().table("knowledge_items").select("id").limit(1).execute().data
    return {"success": True, "message": "Supabase database connected successfully 🚀", "rows": len(data)}


@router.get("/api/ai-test")
async def ai_test() -> dict[str, object]:
    return {"success": True, "result": await test_connection()}
