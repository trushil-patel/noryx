import re
from collections import Counter
from datetime import UTC, datetime
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse
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

SELECT = (
    "id,user_id,original_url,canonical_url,platform,title,summary,key_takeaways,"
    "why_it_matters,thumbnail_url,status,source_type,created_at,updated_at,"
    "knowledge_tags(id,tag)"
)

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

SEARCH_CONCEPTS = (
    ("vibe code", "vibe coder", "vibe coding", "ai coding", "ai coder"),
    ("ai", "artificial intelligence"),
    ("ml", "machine learning"),
    ("ux", "user experience"),
    ("js", "javascript"),
    ("ts", "typescript"),
)


def search_terms(query: str) -> list[str]:
    terms = [
        term
        for term in re.findall(r"[a-z0-9]+", query.lower())
        if len(term) >= 2 and term not in STOP_WORDS
    ]

    return list(dict.fromkeys(terms))


def term_roots(term: str) -> set[str]:
    roots = {term}

    if len(term) > 4 and term.endswith("ies"):
        roots.add(f"{term[:-3]}y")
    if len(term) > 4 and term.endswith("s"):
        roots.add(term[:-1])
    if len(term) > 5 and term.endswith("ing"):
        base = term[:-3]
        roots.update({base, f"{base}e"})
        if len(base) > 2 and base[-1] == base[-2]:
            roots.add(base[:-1])
    if len(term) > 4 and term.endswith("er"):
        base = term[:-2]
        roots.update({base, f"{base}e"})
    if len(term) > 5 and term.endswith("ed"):
        base = term[:-2]
        roots.update({base, f"{base}e"})

    return {root for root in roots if len(root) >= 2}


def edit_distance(first: str, second: str) -> int:
    if first == second:
        return 0
    if not first:
        return len(second)
    if not second:
        return len(first)

    previous = list(range(len(second) + 1))
    for first_index, first_character in enumerate(first, start=1):
        current = [first_index]
        for second_index, second_character in enumerate(second, start=1):
            current.append(
                min(
                    current[-1] + 1,
                    previous[second_index] + 1,
                    previous[second_index - 1]
                    + (first_character != second_character),
                )
            )
        previous = current
    return previous[-1]


def token_match_quality(query_term: str, candidate: str) -> float:
    if query_term == candidate:
        return 1.0
    if term_roots(query_term) & term_roots(candidate):
        return 0.92

    longest = max(len(query_term), len(candidate))
    if longest < 4:
        return 0.0
    distance = edit_distance(query_term, candidate)
    allowed_distance = 1 if longest <= 6 else 2
    if distance <= allowed_distance:
        return 0.82 - (0.08 * (distance - 1))
    return 0.0


def item_search_vocabulary(item: dict[str, object]) -> list[str]:
    tags = item.get("knowledge_tags") or []
    tag_text = " ".join(
        str(tag.get("tag", "")) for tag in tags if isinstance(tag, dict)
    )
    return search_terms(
        " ".join(
            [
                str(item.get("title") or ""),
                tag_text,
                str(item.get("platform") or ""),
            ]
        )
    )


def correct_query_terms(query: str, items: list[dict[str, object]]) -> list[str]:
    original_terms = search_terms(query)
    has_coding_context = any(
        "code" in term_roots(term) for term in original_terms
    )
    vocabulary = Counter(
        term for item in items for term in item_search_vocabulary(item)
    )
    corrected: list[str] = []

    for term in original_terms:
        if term == "vice" and has_coding_context:
            corrected.append("vibe")
            continue
        if term in vocabulary or len(term) < 4:
            corrected.append(term)
            continue

        candidates = [
            candidate
            for candidate in vocabulary
            if token_match_quality(term, candidate) >= 0.74
        ]
        if not candidates:
            corrected.append(term)
            continue

        best = min(
            candidates,
            key=lambda candidate: (
                edit_distance(term, candidate),
                -vocabulary[candidate],
                abs(len(term) - len(candidate)),
            ),
        )
        corrected.append(best)

    return list(dict.fromkeys(corrected))


def build_search_plan(
    query: str,
    items: list[dict[str, object]],
) -> tuple[str, list[str], list[str], list[str]]:
    original_terms = search_terms(query)
    corrected_terms = correct_query_terms(query, items)
    corrected_query = " ".join(corrected_terms) or query
    phrases = [query.lower(), corrected_query]
    expanded_terms = list(dict.fromkeys([*original_terms, *corrected_terms]))

    corrected_roots = set().union(*(term_roots(term) for term in corrected_terms))
    for concept in SEARCH_CONCEPTS:
        concept_matches = any(
            all(
                any(
                    token_match_quality(term, candidate) >= 0.82
                    for candidate in corrected_terms
                )
                for term in search_terms(phrase)
            )
            for phrase in concept
        )
        is_vibe_code = (
            "vibe" in corrected_terms
            and "code" in corrected_roots
            and concept[0] == "vibe code"
        )
        if concept_matches or is_vibe_code:
            phrases.extend(concept)
            for phrase in concept:
                expanded_terms.extend(search_terms(phrase))

    phrases = list(
        dict.fromkeys(" ".join(phrase.split()) for phrase in phrases if phrase)
    )
    expanded_terms = list(dict.fromkeys(expanded_terms))
    semantic_query = corrected_query
    related_phrases = [
        phrase for phrase in phrases if phrase != corrected_query
    ][:5]
    if related_phrases:
        semantic_query += ". Related terms: " + ", ".join(related_phrases)

    return semantic_query, phrases, corrected_terms, expanded_terms


def canonical_url(value: str) -> str:
    parsed = urlparse(value.strip())
    scheme = (parsed.scheme or "https").lower()
    host = (parsed.hostname or "").lower()

    if host.startswith("www."):
        host = host[4:]

    netloc = host
    if parsed.port:
        netloc = f"{host}:{parsed.port}"

    path = parsed.path or "/"
    if path != "/":
        path = path.rstrip("/")

    ignored_params = {
        "fbclid",
        "gclid",
        "igshid",
        "mc_cid",
        "mc_eid",
        "ref",
        "si",
    }

    query_pairs = [
        (key, val)
        for key, val in parse_qsl(parsed.query, keep_blank_values=True)
        if not key.lower().startswith("utm_")
        and key.lower() not in ignored_params
    ]

    query = urlencode(query_pairs, doseq=True)

    return urlunparse((scheme, netloc, path, "", query, ""))


def find_existing_memory(
    items: list[dict[str, object]],
    url: str,
) -> dict[str, object] | None:
    normalized_url = canonical_url(url)

    for item in items:
        original_url = str(item.get("original_url") or "")

        if original_url and canonical_url(original_url) == normalized_url:
            return item

    return None


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
    phrases: list[str],
    core_terms: list[str],
    expanded_terms: list[str],
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

    similarity = item.get("similarity")
    semantic = (
        float(similarity)
        if isinstance(similarity, int | float)
        else 0.0
    )

    score = 0.0

    def contains_phrase(value: str, phrase: str) -> bool:
        normalized_phrase = " ".join(search_terms(phrase))
        if not normalized_phrase:
            return False
        if " " not in normalized_phrase:
            return normalized_phrase in search_terms(value)
        return normalized_phrase in " ".join(search_terms(value))

    if any(contains_phrase(title, phrase) for phrase in phrases):
        score += 9.0
    if any(contains_phrase(tag_text, phrase) for phrase in phrases):
        score += 8.0
    if any(contains_phrase(summary, phrase) for phrase in phrases):
        score += 5.0
    if any(
        contains_phrase(platform_value, phrase) or contains_phrase(url, phrase)
        for phrase in phrases
    ):
        score += 3.0

    title_tokens = search_terms(title)
    tag_tokens = search_terms(tag_text)
    summary_tokens = search_terms(summary)
    text_tokens = search_terms(text)

    def best_quality(term: str, candidates: list[str]) -> float:
        return max(
            (token_match_quality(term, candidate) for candidate in candidates),
            default=0.0,
        )

    matched_terms = 0

    for term in core_terms:
        field_score = max(
            best_quality(term, title_tokens) * 3.5,
            best_quality(term, tag_tokens) * 3.0,
            best_quality(term, summary_tokens) * 2.0,
            best_quality(term, text_tokens) * 1.25,
        )
        if field_score >= 0.9:
            score += field_score
            matched_terms += 1

    related_bonus = 0.0
    for term in expanded_terms:
        if term in core_terms:
            continue
        related_bonus += max(
            best_quality(term, title_tokens) * 0.8,
            best_quality(term, tag_tokens) * 0.7,
            best_quality(term, summary_tokens) * 0.4,
        )
    score += min(related_bonus, 3.0)

    if core_terms:
        coverage = matched_terms / len(core_terms)
        score += coverage * 5.0
        semantic_floor = 0.58 if len(core_terms) <= 3 else 0.64

        if matched_terms == 0 and semantic < semantic_floor:
            return 0.0

        if len(core_terms) >= 2 and coverage < 0.5 and semantic < 0.62:
            return 0.0

    score += semantic * 6.0

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
    phrases: list[str],
    core_terms: list[str],
    expanded_terms: list[str],
    limit: int,
) -> list[dict[str, object]]:
    scored = [
        (
            relevance_score(
                item,
                phrases,
                core_terms,
                expanded_terms,
            ),
            item,
        )
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
            .limit(1000)
            .execute()
            .data
            or []
        )

        (
            semantic_query,
            query_phrases,
            core_terms,
            expanded_terms,
        ) = build_search_plan(query, exact_items)

        semantic_items: list[dict[str, object]] = []

        try:
            query_embedding = await generate_query_embedding(semantic_query)

            semantic_response = client.rpc(
                "hybrid_search_knowledge_items",
                {
                    "query_text": query,
                    "query_embedding": query_embedding,
                    "match_user_id": user.id,
                    "match_count": min(limit * 5, 100),
                    "semantic_threshold": (
                        0.55 if len(core_terms) <= 3 else 0.6
                    ),
                },
            ).execute()

            semantic_items = semantic_response.data or []

        except Exception as semantic_exc:
            print(f"Semantic search failed; using exact ranking: {semantic_exc}")

        items = rerank_search_results(
            merge_search_items(exact_items, semantic_items),
            query_phrases,
            core_terms,
            expanded_terms,
            limit,
        )

        return {
            "success": True,
            "query": query,
            "interpreted_query": " ".join(core_terms),
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
    url = canonical_url(str(body.url))
    client = admin_client()

    try:
        existing_items = (
            client.table("knowledge_items")
            .select(SELECT)
            .eq("user_id", user.id)
            .order("created_at", desc=True)
            .limit(500)
            .execute()
            .data
            or []
        )

        existing_item = find_existing_memory(existing_items, url)

        if existing_item:
            return {
                "success": True,
                "duplicate": True,
                "warning": "This link is already saved in your library.",
                "item": existing_item,
            }

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


