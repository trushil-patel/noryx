from fastapi import APIRouter
from memora.auth import CurrentUser

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/me")
async def me(user: CurrentUser) -> dict[str, object]:
    return {"success": True, "user": user.model_dump()}
