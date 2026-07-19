from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from memora.auth import CurrentUser
from memora.models import CollectionCreate, CollectionItemCreate, CollectionUpdate
from memora.supabase import admin_client

router = APIRouter(prefix="/api/collections", tags=["collections"])

MEMORY_SELECT = (
    "id,user_id,original_url,canonical_url,platform,title,summary,key_takeaways,"
    "why_it_matters,thumbnail_url,status,source_type,created_at,updated_at,"
    "knowledge_tags(id,tag)"
)


def clean_name(value: str) -> str:
    name = " ".join(value.split())
    if not name:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Collection name is required.")
    return name


def get_owned_collection(collection_id: UUID, user_id: str) -> dict[str, object]:
    rows = (
        admin_client().table("collections")
        .select("id,owner_id,name,description,visibility,created_at,updated_at")
        .eq("id", str(collection_id)).eq("owner_id", user_id).limit(1).execute().data or []
    )
    if not rows:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Collection not found.")
    return rows[0]


@router.get("")
async def list_collections(user: CurrentUser) -> dict[str, object]:
    rows = (
        admin_client().table("collections")
        .select(
            "id,owner_id,name,description,visibility,created_at,updated_at,"
            "collection_items(count)"
        )
        .eq("owner_id", user.id).order("updated_at", desc=True).execute().data or []
    )
    for row in rows:
        counts = row.pop("collection_items", []) or []
        row["item_count"] = counts[0].get("count", 0) if counts else 0
    return {"success": True, "collections": rows}


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_collection(body: CollectionCreate, user: CurrentUser) -> dict[str, object]:
    row = (
        admin_client().table("collections").insert({
            "owner_id": user.id,
            "name": clean_name(body.name),
            "description": body.description.strip() if body.description else None,
            "updated_at": datetime.now(UTC).isoformat(),
        }).execute().data[0]
    )
    row["item_count"] = 0
    return {"success": True, "collection": row}


@router.get("/{collection_id}")
async def get_collection(collection_id: UUID, user: CurrentUser) -> dict[str, object]:
    collection = get_owned_collection(collection_id, user.id)
    links = (
        admin_client().table("collection_items")
        .select(f"created_at,knowledge_items({MEMORY_SELECT})")
        .eq("collection_id", str(collection_id)).order("created_at", desc=True)
        .execute().data or []
    )
    collection["items"] = [link["knowledge_items"] for link in links if link.get("knowledge_items")]
    collection["item_count"] = len(collection["items"])
    return {"success": True, "collection": collection}


@router.patch("/{collection_id}")
async def update_collection(
    collection_id: UUID, body: CollectionUpdate, user: CurrentUser
) -> dict[str, object]:
    get_owned_collection(collection_id, user.id)
    updates = body.model_dump(exclude_unset=True)
    if "name" in updates and updates["name"] is not None:
        updates["name"] = clean_name(updates["name"])
    if "description" in updates and updates["description"]:
        updates["description"] = updates["description"].strip()
    updates["updated_at"] = datetime.now(UTC).isoformat()
    row = (
        admin_client().table("collections").update(updates)
        .eq("id", str(collection_id)).eq("owner_id", user.id).execute().data[0]
    )
    return {"success": True, "collection": row}


@router.delete("/{collection_id}")
async def delete_collection(collection_id: UUID, user: CurrentUser) -> dict[str, object]:
    get_owned_collection(collection_id, user.id)
    (
        admin_client()
        .table("collections")
        .delete()
        .eq("id", str(collection_id))
        .eq("owner_id", user.id)
        .execute()
    )
    return {"success": True, "deleted_id": str(collection_id)}


@router.post("/{collection_id}/items", status_code=status.HTTP_201_CREATED)
async def add_collection_item(
    collection_id: UUID, body: CollectionItemCreate, user: CurrentUser
) -> dict[str, object]:
    get_owned_collection(collection_id, user.id)
    try:
        memory_id = str(UUID(body.knowledge_item_id))
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Invalid memory id.") from exc
    memories = (
        admin_client().table("knowledge_items").select("id")
        .eq("id", memory_id).eq("user_id", user.id).limit(1).execute().data or []
    )
    if not memories:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Memory not found.")
    existing = (
        admin_client().table("collection_items").select("collection_id")
        .eq("collection_id", str(collection_id)).eq("knowledge_item_id", memory_id)
        .limit(1).execute().data or []
    )
    if not existing:
        admin_client().table("collection_items").insert({
            "collection_id": str(collection_id), "knowledge_item_id": memory_id, "added_by": user.id
        }).execute()
    admin_client().table("collections").update({
        "updated_at": datetime.now(UTC).isoformat()
    }).eq("id", str(collection_id)).eq("owner_id", user.id).execute()
    return {"success": True, "duplicate": bool(existing)}


@router.delete("/{collection_id}/items/{memory_id}")
async def remove_collection_item(
    collection_id: UUID, memory_id: UUID, user: CurrentUser
) -> dict[str, object]:
    get_owned_collection(collection_id, user.id)
    admin_client().table("collection_items").delete().eq(
        "collection_id", str(collection_id)
    ).eq("knowledge_item_id", str(memory_id)).execute()
    return {"success": True, "removed_id": str(memory_id)}
