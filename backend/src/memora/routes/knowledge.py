from datetime import UTC, datetime
from urllib.parse import urlparse
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, status

from memora.auth import CurrentUser
from memora.models import CaptureRequest
from memora.services.ai import (
    embedding_text,
    generate_document_embedding,
    generate_metadata,
    generate_query_embedding,
)
from memora.services.extraction import build_knowledge_document
from memora.supabase import admin_client

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])

SELECT = "id,user_id,original_url,platform,title,summary,key_takeaways,why_it_matters,thumbnail_url,status,source_type,created_at,updated_at,knowledge_tags(id,tag)"


def platform(url: str) -> str:
    host = (urlparse(url).hostname or "").lower()

    platforms = {
        "youtube": ("youtube.com", "youtu.be"),
        "reddit": ("reddit.com",),
        "instagram": ("instagram.com",),
        "linkedin": ("linkedin.com",),
        "twitter": ("twitter.com", "x.com"),
        "blog": ("medium.com", "substack.com"),
    }

    for name, domains in platforms.items():
        if any(domain in host for domain in domains):
            return name

    return "article"


async def complete_embedding_later(
    memory_id: str,
    title: str,
    text_to_embed: str,
) -> None:
    try:
        embedding = await generate_document_embedding(
            text=text_to_embed[:8000],
            title=title,
        )

        try:
            admin_client().rpc(
                "update_memory_embedding",
                {
                    "p_memory_id": memory_id,
                    "p_embedding": embedding,
                },
            ).execute()
            return

        except Exception as rpc_exc:
            print(
                f"Embedding RPC update failed for {memory_id}: {rpc_exc}"
            )
            raise

    except Exception as exc:
        print(f"Embedding failed for {memory_id}: {exc}")

        try:
            (
                admin_client()
                .table("knowledge_items")
                .update(
                    {
                        "status": "embedding_failed",
                        "updated_at": datetime.now(UTC).isoformat(),
                    }
                )
                .eq("id", memory_id)
                .execute()
            )
        except Exception as update_exc:
            print(
                "Failed to mark embedding as failed "
                f"for {memory_id}: {update_exc}"
            )


@router.get("/search")
async def search(
    user: CurrentUser,
    q: str = Query(
        min_length=1,
        max_length=500,
    ),
    limit: int = Query(
        default=20,
        ge=1,
        le=50,
    ),
) -> dict[str, object]:
    query = " ".join(q.strip().split())

    if not query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Search query is required.",
        )

    try:
        query_embedding = await generate_query_embedding(query)

        response = admin_client().rpc(
            "hybrid_search_knowledge_items",
            {
                "query_text": query,
                "query_embedding": query_embedding,
                "match_user_id": user.id,
                "match_count": limit,
                "semantic_threshold": 0.62,
            },
        ).execute()

        return {
            "success": True,
            "query": query,
            "items": response.data or [],
        }

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to search your memories.",
        ) from exc


@router.get("")
async def list_items(user: CurrentUser) -> dict[str, object]:
    data = (
        admin_client()
        .table("knowledge_items")
        .select(SELECT)
        .eq("user_id", user.id)
        .order("created_at", desc=True)
        .execute()
        .data
    )

    return {"success": True, "items": data}


@router.delete("/{memory_id}")
async def delete_memory(
    memory_id: UUID,
    user: CurrentUser,
) -> dict[str, object]:
    client = admin_client()

    try:
        existing = (
            client.table("knowledge_items")
            .select("id")
            .eq("id", str(memory_id))
            .eq("user_id", user.id)
            .limit(1)
            .execute()
            .data
        )

        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Memory not found.",
            )

        (
            client.table("knowledge_items")
            .delete()
            .eq("id", str(memory_id))
            .eq("user_id", user.id)
            .execute()
        )

        return {
            "success": True,
            "deleted_id": str(memory_id),
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete this memory.",
        ) from exc


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
async def capture(
    body: CaptureRequest,
    user: CurrentUser,
    background_tasks: BackgroundTasks,
) -> dict[str, object]:
    url = str(body.url)
    client = admin_client()

    try:
        document = await build_knowledge_document(url)

        if not document.content.strip():
            raise ValueError(
                "No readable content or metadata could be extracted from this source."
            )

        metadata = await generate_metadata(document)

        title = metadata.title.strip()
        summary = metadata.summary.strip()

        key_takeaways = [
            takeaway.strip()
            for takeaway in metadata.key_takeaways
            if takeaway.strip()
        ]

        why_it_matters = metadata.why_it_matters.strip()

        tags = list(
            dict.fromkeys(
                tag.strip().lower()
                for tag in metadata.tags
                if tag.strip()
            )
        )

        if not title:
            raise ValueError("AI did not generate a memory title.")

        if not summary:
            raise ValueError("AI did not generate a memory summary.")

        if not key_takeaways:
            raise ValueError("AI did not generate key takeaways.")

        if not why_it_matters:
            raise ValueError(
                "AI did not explain why this memory matters."
            )

        text_to_embed = embedding_text(metadata, document)

        if not text_to_embed.strip():
            raise ValueError("The embedding input is empty.")

        payload = {
            "user_id": user.id,
            "original_url": url,
            "platform": platform(url),
            "title": title,
            "summary": summary,
            "key_takeaways": key_takeaways,
            "why_it_matters": why_it_matters,
            "status": "processing",
            "source_type": document.content_type,
        }

        if document.thumbnail_url:
            payload["thumbnail_url"] = document.thumbnail_url

        try:
            created_item = (
                client.table("knowledge_items")
                .insert(payload)
                .execute()
                .data[0]
            )
        except Exception as insert_exc:
            print(f"Memory insert failed: {insert_exc}")
            raise

        try:
            tag_rows = [
                {
                    "knowledge_item_id": created_item["id"],
                    "tag": tag,
                }
                for tag in tags
            ]

            if tag_rows:
                client.table("knowledge_tags").insert(tag_rows).execute()

        except Exception as tag_exc:
            print(
                "Tag insert failed; deleting partial memory "
                f"{created_item['id']}: {tag_exc}"
            )
            (
                client.table("knowledge_items")
                .delete()
                .eq("id", created_item["id"])
                .eq("user_id", user.id)
                .execute()
            )
            raise

        created_item["knowledge_tags"] = [
            {
                "tag": tag,
            }
            for tag in tags
        ]

        background_tasks.add_task(
            complete_embedding_later,
            created_item["id"],
            title,
            text_to_embed,
        )

        return {
            "success": True,
            "item": created_item,
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    except HTTPException:
        raise

    except Exception as exc:
        print(f"Capture failed for {url}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "The memory could not be completed. "
                "Nothing was saved."
            ),
        ) from exc
