from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from memora.auth import CurrentUser
from memora.models import (
    CollectionCreate,
    CollectionItemCreate,
    CollectionMemberCreate,
    CollectionUpdate,
)
from memora.supabase import admin_client

router = APIRouter(prefix="/api/collections", tags=["collections"])

MEMORY_SELECT = (
    "id,user_id,original_url,canonical_url,platform,title,summary,key_takeaways,"
    "why_it_matters,thumbnail_url,status,source_type,custom_tags,created_at,updated_at,"
    "knowledge_tags(id,tag)"
)
COLLECTION_SELECT = "id,owner_id,name,description,visibility,created_at,updated_at"
COLLECTION_LIST_SELECT = f"{COLLECTION_SELECT},collection_items(count)"
PROFILE_SELECT = "user_id,username,display_name,avatar_url,bio"


def clean_name(value: str) -> str:
    name = " ".join(value.split())
    if not name:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Collection name is required.")
    return name


def get_owned_collection(collection_id: UUID, user_id: str) -> dict[str, object]:
    rows = (
        admin_client().table("collections")
        .select(COLLECTION_SELECT)
        .eq("id", str(collection_id)).eq("owner_id", user_id).limit(1).execute().data or []
    )
    if not rows:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Collection not found.")
    return rows[0]


def get_accessible_collection(
    collection_id: UUID,
    user_id: str,
) -> tuple[dict[str, object], str]:
    try:
        return get_owned_collection(collection_id, user_id), "owner"
    except HTTPException as exc:
        if exc.status_code != status.HTTP_404_NOT_FOUND:
            raise

    membership = (
        admin_client()
        .table("collection_members")
        .select("collection_id")
        .eq("collection_id", str(collection_id))
        .eq("user_id", user_id)
        .limit(1)
        .execute()
        .data
        or []
    )
    if not membership:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Collection not found.")

    rows = (
        admin_client()
        .table("collections")
        .select(COLLECTION_SELECT)
        .eq("id", str(collection_id))
        .limit(1)
        .execute()
        .data
        or []
    )
    if not rows:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Collection not found.")
    return rows[0], "member"


def add_collection_counts(
    row: dict[str, object],
    access: str,
    member_count: int = 0,
) -> dict[str, object]:
    item_counts = row.pop("collection_items", []) or []
    row["item_count"] = item_counts[0].get("count", 0) if item_counts else 0
    row["member_count"] = member_count
    row["access"] = access
    return row


def accepted_collection_members(
    connection_ids: list[str],
    owner_id: str,
) -> list[tuple[str, str]]:
    normalized_ids: list[str] = []
    for value in connection_ids:
        try:
            connection_id = str(UUID(value))
        except ValueError as exc:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                "Invalid connection id.",
            ) from exc
        if connection_id not in normalized_ids:
            normalized_ids.append(connection_id)

    if not normalized_ids:
        return []

    rows = (
        admin_client()
        .table("connections")
        .select("id,requester_id,addressee_id,status")
        .in_("id", normalized_ids)
        .eq("status", "accepted")
        .execute()
        .data
        or []
    )
    by_id = {str(row["id"]): row for row in rows}
    members: list[tuple[str, str]] = []

    for connection_id in normalized_ids:
        connection = by_id.get(connection_id)
        if not connection or owner_id not in {
            str(connection["requester_id"]),
            str(connection["addressee_id"]),
        }:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                "Only accepted connections can be added to a collection.",
            )
        member_id = (
            str(connection["addressee_id"])
            if str(connection["requester_id"]) == owner_id
            else str(connection["requester_id"])
        )
        members.append((connection_id, member_id))

    return list(dict.fromkeys(members))


def insert_collection_members(
    collection_id: str,
    members: list[tuple[str, str]],
    owner_id: str,
) -> None:
    if not members:
        return
    admin_client().table("collection_members").insert(
        [
            {
                "collection_id": collection_id,
                "connection_id": connection_id,
                "user_id": member_id,
                "added_by": owner_id,
            }
            for connection_id, member_id in members
        ]
    ).execute()


def get_collection_members(collection_id: str) -> list[dict[str, object]]:
    rows = (
        admin_client()
        .table("collection_members")
        .select("user_id,created_at")
        .eq("collection_id", collection_id)
        .order("created_at")
        .execute()
        .data
        or []
    )
    user_ids = list(dict.fromkeys(str(row["user_id"]) for row in rows))
    profiles = []
    if user_ids:
        profiles = (
            admin_client()
            .table("profiles")
            .select(PROFILE_SELECT)
            .in_("user_id", user_ids)
            .execute()
            .data
            or []
        )
    profiles_by_id = {str(profile["user_id"]): profile for profile in profiles}
    return [
        {
            "user_id": row["user_id"],
            "created_at": row["created_at"],
            "profile": profiles_by_id[str(row["user_id"])],
        }
        for row in rows
        if str(row["user_id"]) in profiles_by_id
    ]


@router.get("")
async def list_collections(user: CurrentUser) -> dict[str, object]:
    owned = (
        admin_client().table("collections")
        .select(COLLECTION_LIST_SELECT)
        .eq("owner_id", user.id).order("updated_at", desc=True).execute().data or []
    )
    try:
        membership_rows = (
            admin_client()
            .table("collection_members")
            .select("collection_id")
            .eq("user_id", user.id)
            .execute()
            .data
            or []
        )
    except Exception as exc:
        print(f"Collection memberships unavailable; returning owned collections: {exc}")
        rows = [add_collection_counts(row, "owner") for row in owned]
        return {"success": True, "collections": rows}
    shared_ids = list(
        dict.fromkeys(str(row["collection_id"]) for row in membership_rows)
    )
    shared = []
    if shared_ids:
        shared = (
            admin_client()
            .table("collections")
            .select(COLLECTION_LIST_SELECT)
            .in_("id", shared_ids)
            .execute()
            .data
            or []
        )

    collection_ids = list(
        dict.fromkeys(
            [str(row["id"]) for row in owned]
            + [str(row["id"]) for row in shared]
        )
    )
    member_counts: dict[str, int] = {}
    if collection_ids:
        member_rows = (
            admin_client()
            .table("collection_members")
            .select("collection_id")
            .in_("collection_id", collection_ids)
            .execute()
            .data
            or []
        )
        for member_row in member_rows:
            collection_id = str(member_row["collection_id"])
            member_counts[collection_id] = member_counts.get(collection_id, 0) + 1

    rows = [
        *(
            add_collection_counts(row, "owner", member_counts.get(str(row["id"]), 0))
            for row in owned
        ),
        *(
            add_collection_counts(row, "member", member_counts.get(str(row["id"]), 0))
            for row in shared
        ),
    ]
    rows.sort(key=lambda row: str(row.get("updated_at") or ""), reverse=True)
    return {"success": True, "collections": rows}


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_collection(body: CollectionCreate, user: CurrentUser) -> dict[str, object]:
    members = accepted_collection_members(body.connection_ids, user.id)
    row = (
        admin_client().table("collections").insert({
            "owner_id": user.id,
            "name": clean_name(body.name),
            "description": body.description.strip() if body.description else None,
            "visibility": "friends" if members else "private",
            "updated_at": datetime.now(UTC).isoformat(),
        }).execute().data[0]
    )
    try:
        insert_collection_members(str(row["id"]), members, user.id)
    except Exception:
        (
            admin_client()
            .table("collections")
            .delete()
            .eq("id", str(row["id"]))
            .eq("owner_id", user.id)
            .execute()
        )
        raise
    row["item_count"] = 0
    row["member_count"] = len(members)
    row["access"] = "owner"
    row["members"] = get_collection_members(str(row["id"])) if members else []
    return {"success": True, "collection": row}


@router.get("/{collection_id}")
async def get_collection(collection_id: UUID, user: CurrentUser) -> dict[str, object]:
    collection, access = get_accessible_collection(collection_id, user.id)
    links = (
        admin_client().table("collection_items")
        .select(f"created_at,knowledge_items({MEMORY_SELECT})")
        .eq("collection_id", str(collection_id)).order("created_at", desc=True)
        .execute().data or []
    )
    collection["items"] = [link["knowledge_items"] for link in links if link.get("knowledge_items")]
    collection["item_count"] = len(collection["items"])
    try:
        collection["members"] = get_collection_members(str(collection_id))
    except Exception as exc:
        if access != "owner":
            raise
        print(f"Collection memberships unavailable for {collection_id}: {exc}")
        collection["members"] = []
    collection["member_count"] = len(collection["members"])
    collection["access"] = access
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


@router.post("/{collection_id}/members", status_code=status.HTTP_201_CREATED)
async def add_collection_member(
    collection_id: UUID,
    body: CollectionMemberCreate,
    user: CurrentUser,
) -> dict[str, object]:
    get_owned_collection(collection_id, user.id)
    connection_id, member_id = accepted_collection_members(
        [body.connection_id],
        user.id,
    )[0]
    existing = (
        admin_client()
        .table("collection_members")
        .select("user_id")
        .eq("collection_id", str(collection_id))
        .eq("user_id", member_id)
        .limit(1)
        .execute()
        .data
        or []
    )
    if not existing:
        insert_collection_members(
            str(collection_id),
            [(connection_id, member_id)],
            user.id,
        )
        (
            admin_client()
            .table("collections")
            .update({
                "visibility": "friends",
                "updated_at": datetime.now(UTC).isoformat(),
            })
            .eq("id", str(collection_id))
            .eq("owner_id", user.id)
            .execute()
        )

    members = get_collection_members(str(collection_id))
    member = next(
        (value for value in members if str(value["user_id"]) == member_id),
        None,
    )
    return {"success": True, "duplicate": bool(existing), "member": member}


@router.delete("/{collection_id}/members/{member_id}")
async def remove_collection_member(
    collection_id: UUID,
    member_id: UUID,
    user: CurrentUser,
) -> dict[str, object]:
    get_owned_collection(collection_id, user.id)
    (
        admin_client()
        .table("collection_members")
        .delete()
        .eq("collection_id", str(collection_id))
        .eq("user_id", str(member_id))
        .execute()
    )
    remaining_members = get_collection_members(str(collection_id))
    (
        admin_client()
        .table("collections")
        .update({
            "visibility": "friends" if remaining_members else "private",
            "updated_at": datetime.now(UTC).isoformat(),
        })
        .eq("id", str(collection_id))
        .eq("owner_id", user.id)
        .execute()
    )
    return {"success": True, "removed_id": str(member_id)}


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
