from datetime import UTC, datetime
from urllib.parse import urlparse
from fastapi import APIRouter, HTTPException, Query, status
from memora.auth import CurrentUser
from memora.models import CaptureRequest
from memora.services.extraction import build_knowledge_document
from memora.supabase import admin_client
from memora.services.ai import (
    embedding_text,
    generate_document_embedding,
    generate_metadata,
    generate_query_embedding,
)
from uuid import UUID
router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])
SELECT = "id,user_id,original_url,platform,title,summary,key_takeaways,why_it_matters,thumbnail_url,status,source_type,created_at,updated_at,knowledge_tags(id,tag)"

def platform(url: str) -> str:
    host = (urlparse(url).hostname or "").lower()
    for name, domains in {"youtube": ("youtube.com", "youtu.be"), "reddit": ("reddit.com",), "instagram": ("instagram.com",), "linkedin": ("linkedin.com",), "twitter": ("twitter.com", "x.com"), "blog": ("medium.com", "substack.com")}.items():
        if any(domain in host for domain in domains):
            return name
    return "article"


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
        query_embedding = (
            await generate_query_embedding(query)
        )

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
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail="Failed to search your memories.",
        ) from exc

@router.get("")
async def list_items(user: CurrentUser) -> dict[str, object]:
    data = admin_client().table("knowledge_items").select(SELECT).eq("user_id", user.id).order("created_at", desc=True).execute().data
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

        response = (
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
) -> dict[str, object]:
    url = str(body.url)

    try:
        # Step 1: Fetch, extract and classify.
        document = await build_knowledge_document(url)

        if not document.content.strip():
            raise ValueError(
                "No useful knowledge could be extracted "
                "from this source."
            )

        # Step 2: Generate and validate AI metadata.
        metadata = await generate_metadata(document)

        title = metadata.title.strip()
        summary = metadata.summary.strip()

        key_takeaways = [
            takeaway.strip()
            for takeaway in metadata.key_takeaways
            if takeaway.strip()
        ]

        why_it_matters = (
            metadata.why_it_matters.strip()
        )

        tags = list(
            dict.fromkeys(
                tag.strip().lower()
                for tag in metadata.tags
                if tag.strip()
            )
        )

        if not title:
            raise ValueError(
                "AI did not generate a memory title."
            )

        if not summary:
            raise ValueError(
                "AI did not generate a memory summary."
            )

        if not key_takeaways:
            raise ValueError(
                "AI did not generate key takeaways."
            )

        if not why_it_matters:
            raise ValueError(
                "AI did not explain why this memory matters."
            )

        # Step 3: Build the complete embedding input.
        text_to_embed = embedding_text(metadata, document)

        if not text_to_embed.strip():
            raise ValueError(
                "The embedding input is empty."
            )

        # Step 4: Generate and validate the embedding.
        embedding = await generate_document_embedding(
            text=text_to_embed,
            title=title,
        )

        if not embedding:
            raise ValueError(
                "Gemini returned an empty embedding."
            )

        if len(embedding) != 3072:
            raise ValueError(
                "Invalid embedding dimension. "
                f"Expected 3072, received {len(embedding)}."
            )

        if not all(
            isinstance(value, int | float)
            for value in embedding
        ):
            raise ValueError(
                "Embedding contains invalid values."
            )

        # Step 5: Only now write to the database.
        # The RPC inserts the item and tags atomically.
        response = admin_client().rpc(
            "create_completed_memory",
            {
                "p_user_id": user.id,
                "p_original_url": url,
                "p_platform": platform(url),
                "p_title": title,
                "p_summary": summary,
                "p_key_takeaways": key_takeaways,
                "p_why_it_matters": why_it_matters,
                "p_source_type": document.content_type,
                "p_embedding": embedding,
                "p_tags": tags,
            },
        ).execute()

        if not response.data:
            raise RuntimeError(
                "Database did not return the "
                "created memory."
            )
        created_item = response.data[0]

        if document.thumbnail_url:
            admin_client().table("knowledge_items").update(
                {"thumbnail_url": document.thumbnail_url}
            ).eq("id", created_item["id"]).eq("user_id", user.id).execute()

            created_item["thumbnail_url"] = document.thumbnail_url

        created_item["knowledge_tags"] = [
            {
                "tag": tag,
            }
            for tag in tags
        ]

        return {
            "success": True,
            "item": created_item,
        }

    except ValueError as exc:
        # Validation/extraction failure.
        # Nothing has been written to the database.
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    except HTTPException:
        raise

    except Exception as exc:
        # AI, embedding, network or database failure.
        # If the RPC failed, PostgreSQL rolls back its transaction.
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "The memory could not be completed. "
                "Nothing was saved."
            ),
        ) from exc