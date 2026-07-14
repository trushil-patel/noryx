from datetime import UTC, datetime
import re
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

STOP_WORDS = {
    "a",
    "an",
    "and",
    "are",
    "about",
    "by",
    "for",
    "from",
    "how",
    "i",
    "in",
    "is",
    "it",
    "me",
    "my",
    "of",
    "on",
    "or",
    "show",
    "that",
    "the",
    "this",
    "to",
    "what",
    "with",
}


def search_terms(query: str) -> list[str]:
    terms = [
        term
        for term in re.findall(r"[a-z0-9]+", query.lower())
        if len(term) >= 2 and term not in STOP_WORDS
    ]

    return list(dict.fromkeys(terms))


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


def item_text(item: dict[str, object]) -> str:
    tags = item.get("knowledge_tags") or []
    tag_text = " ".join(
        str(tag.get("tag", ""))
        for tag in tags
        if isinstance(tag, dict)
    )

    takeaways = item.get("key_takeaways") or []
    takeaway_text = (
        " ".join(str(value) for value in takeaways)
        if isinstance(takeaways, list)
        else str(takeaways)
    )

    return " ".join(
        [
            str(item.get("title") or ""),
            str(item.get("summary") or ""),
            str(item.get("why_it_matters") or ""),
            str(item.get("platform") or ""),
            str(item.get("original_url") or ""),
            tag_text,
            takeaway_text,
        ]
    ).lower()


def relevance_score(
    item: dict[str, object],
    query: str,
    terms: list[str],
) -> float:
    text = item_text(item)
    title = str(item.get("title") or "").lower()
    summary = str(item.get("summary") or "").lower()
    platform_value = str(item.get("platform") or "").lower()
    url = str(item.get("original_url") or "").lower()

    tags = item.get("knowledge_tags") or []
    tag_values = [
        str(tag.get("tag", "")).lower()
        for tag in tags
        if isinstance(tag, dict)
    ]
    tag_text = " ".join(tag_values)

    normalized_query = query.lower()
    similarity = item.get("similarity")
    semantic = (
        float(similarity)
        if isinstance(similarity, int | float)
        else 0.0
    )

    score = 0.0

    if normalized_query in title:
        score += 8.0
    if normalized_query in tag_text:
        score += 7.0
    if normalized_query in summary:
        score += 4.0
    if normalized_query in platform_value or normalized_query in url:
        score += 3.0

    matched_terms = 0

    for term in terms:
        if term in title:
            score += 3.0
            matched_terms += 1
        elif term in tag_text:
            score += 2.5
            matched_terms += 1
        elif term in summary:
            score += 1.5
            matched_terms += 1
        elif term in text:
            score += 1.0
            matched_terms += 1

    if terms:
        coverage = matched_terms / len(terms)
        score += coverage * 4.0

        if matched_terms == 0 and semantic < 0.8:
            return 0.0

        if len(terms) >= 2 and coverage < 0.5 and semantic < 0.76:
            return 0.0

    score += semantic * 2.0

    return score


def merge_search_items(
    exact_items: list[dict[str, object]],
    semantic_items: list[dict[str, object]],
) -> list[dict[str, object]]:
    merged: dict[str, dict[str, object]] = {}

    for item in semantic_items:
        item_id = str(item.get("id") or "")
        if item_id:
            merged[item_id] = item

    for item in exact_items:
        item_id = str(item.get("id") or "")
        if not item_id:
            continue

        if item_id in merged:
            merged[item_id].update(
                {
                    key: value
                    for key, value in item.items()
                    if value is not None
                }
            )
        else:
            merged[item_id] = item

    return list(merged.values())


def rerank_search_results(
    items: list[dict[str, object]],
    query: str,
    limit: int,
) -> list[dict[str, object]]:
    terms = search_terms(query)

    scored = [
        (relevance_score(item, query, terms), item)
        for item in items
    ]

    return [
        item
        for score, item in sorted(
            scored,
            key=lambda value: value[0],
            reverse=True,
        )
        if score > 0
    ][:limit]


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
        client = admin_client()

        exact_items = (
            client.table("knowledge_items")
            .select(SELECT)
            .eq("user_id", user.id)
            .order("created_at", desc=True)
            .limit(300)
            .execute()
            .data
            or []
        )

        semantic_items: list[dict[str, object]] = []

        try:
            query_embedding = await generate_query_embedding(query)

            semantic_response = client.rpc(
                "hybrid_search_knowledge_items",
                {
                    "query_text": query,
                    "query_embedding": query_embedding,
                    "match_user_id": user.id,
                    "match_count": min(limit * 3, 50),
                    "semantic_threshold": 0.7,
                },
            ).execute()

            semantic_items = semantic_response.data or []

        except Exception as semantic_exc:
            print(f"Semantic search failed; using exact ranking: {semantic_exc}")

        items = rerank_search_results(
            merge_search_items(exact_items, semantic_items),
            query,
            limit,
        )

        return {
            "success": True,
            "query": query,
            "items": items,
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
