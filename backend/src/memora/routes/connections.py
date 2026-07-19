import re
from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from memora.auth import CurrentUser
from memora.models import ConnectionCreate, ConnectionUpdate
from memora.supabase import admin_client

router = APIRouter(prefix="/api/connections", tags=["connections"])

PROFILE_FIELDS = "user_id,username,display_name,avatar_url,bio"
CONNECTION_SELECT = (
    "id,requester_id,addressee_id,status,created_at,updated_at,"
    "requester:profiles!connections_requester_id_fkey("
    f"{PROFILE_FIELDS}),addressee:profiles!connections_addressee_id_fkey({PROFILE_FIELDS})"
)


def ensure_profile(user: CurrentUser) -> dict[str, object]:
    client = admin_client()
    rows = (
        client.table("profiles").select(PROFILE_FIELDS)
        .eq("user_id", user.id).limit(1).execute().data or []
    )
    if rows:
        return rows[0]
    email_name = (user.email or "memora_user").split("@")[0].lower()
    base = re.sub(r"[^a-z0-9_]", "_", email_name).strip("_")[:28] or "memora_user"
    username = f"{base}_{user.id.replace('-', '')[:8]}"
    display_name = " ".join(part.capitalize() for part in base.split("_") if part)
    return (
        client.table("profiles").insert({
            "user_id": user.id,
            "username": username,
            "display_name": display_name or "Memora user",
        }).execute().data[0]
    )


def get_participating_connection(connection_id: UUID, user_id: str) -> dict[str, object]:
    rows = (
        admin_client().table("connections").select(CONNECTION_SELECT)
        .eq("id", str(connection_id))
        .or_(f"requester_id.eq.{user_id},addressee_id.eq.{user_id}")
        .limit(1).execute().data or []
    )
    if not rows:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Connection not found.")
    return rows[0]


@router.get("/profile")
async def current_profile(user: CurrentUser) -> dict[str, object]:
    return {"success": True, "profile": ensure_profile(user)}


@router.get("/search")
async def search_profiles(
    user: CurrentUser,
    q: str = Query(min_length=2, max_length=80),
) -> dict[str, object]:
    ensure_profile(user)
    query = re.sub(r"[^a-zA-Z0-9_ -]", "", " ".join(q.strip().split()))
    if len(query) < 2:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Enter at least two letters.")
    rows = (
        admin_client().table("profiles").select(PROFILE_FIELDS)
        .or_(f"username.ilike.%{query}%,display_name.ilike.%{query}%")
        .neq("user_id", user.id).limit(20).execute().data or []
    )
    connections = (
        admin_client().table("connections")
        .select("id,requester_id,addressee_id,status")
        .or_(f"requester_id.eq.{user.id},addressee_id.eq.{user.id}")
        .execute().data or []
    )
    by_user: dict[str, dict[str, object]] = {}
    for connection in connections:
        other_id = (
            connection["addressee_id"]
            if connection["requester_id"] == user.id
            else connection["requester_id"]
        )
        by_user[str(other_id)] = connection
    for row in rows:
        row["connection"] = by_user.get(str(row["user_id"]))
    return {"success": True, "profiles": rows}


@router.get("")
async def list_connections(user: CurrentUser) -> dict[str, object]:
    profile = ensure_profile(user)
    rows = (
        admin_client().table("connections").select(CONNECTION_SELECT)
        .or_(f"requester_id.eq.{user.id},addressee_id.eq.{user.id}")
        .order("updated_at", desc=True).execute().data or []
    )
    incoming = [
        row for row in rows
        if row["status"] == "pending" and row["addressee_id"] == user.id
    ]
    outgoing = [
        row for row in rows
        if row["status"] == "pending" and row["requester_id"] == user.id
    ]
    friends = [row for row in rows if row["status"] == "accepted"]
    return {
        "success": True,
        "current_user_id": user.id,
        "profile": profile,
        "incoming": incoming,
        "outgoing": outgoing,
        "friends": friends,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def send_request(body: ConnectionCreate, user: CurrentUser) -> dict[str, object]:
    ensure_profile(user)
    try:
        target_id = str(UUID(body.user_id))
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Invalid user id.") from exc
    if target_id == user.id:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "You cannot connect with yourself.",
        )
    target = (
        admin_client().table("profiles").select("user_id")
        .eq("user_id", target_id).limit(1).execute().data or []
    )
    if not target:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found.")
    existing = (
        admin_client().table("connections").select("id,status")
        .or_(
            f"and(requester_id.eq.{user.id},addressee_id.eq.{target_id}),"
            f"and(requester_id.eq.{target_id},addressee_id.eq.{user.id})"
        ).limit(1).execute().data or []
    )
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "A connection already exists with this user.")
    row = (
        admin_client().table("connections").insert({
            "requester_id": user.id, "addressee_id": target_id, "status": "pending"
        }).execute().data[0]
    )
    return {"success": True, "connection": row}


@router.patch("/{connection_id}")
async def answer_request(
    connection_id: UUID, body: ConnectionUpdate, user: CurrentUser
) -> dict[str, object]:
    connection = get_participating_connection(connection_id, user.id)
    if connection["addressee_id"] != user.id or connection["status"] != "pending":
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Only the recipient can answer this request.",
        )
    if body.action == "decline":
        admin_client().table("connections").delete().eq(
            "id", str(connection_id)
        ).eq("addressee_id", user.id).execute()
        return {"success": True, "deleted_id": str(connection_id)}

    row = (
        admin_client().table("connections").update({
            "status": "accepted", "updated_at": datetime.now(UTC).isoformat()
        }).eq("id", str(connection_id)).eq("addressee_id", user.id).execute().data[0]
    )
    return {"success": True, "connection": row}


@router.delete("/{connection_id}")
async def remove_connection(connection_id: UUID, user: CurrentUser) -> dict[str, object]:
    get_participating_connection(connection_id, user.id)
    admin_client().table("connections").delete().eq("id", str(connection_id)).execute()
    return {"success": True, "deleted_id": str(connection_id)}
