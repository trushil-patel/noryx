import asyncio

from google import genai
from google.genai import types

from memora.config import get_settings
from memora.models import (
    GeneratedMetadata,
    KnowledgeDocument,
)


def _client() -> genai.Client:
    return genai.Client(
        api_key=get_settings().gemini_api_key
    )


async def test_connection() -> str:
    response = await _client().aio.models.generate_content(
        model=get_settings().gemini_model,
        contents="Reply with exactly: Gemini connected",
    )

    return response.text or ""


async def generate_metadata(
    document: KnowledgeDocument,
) -> GeneratedMetadata:
    content = " ".join(document.content.split())
    title_context = document.page_title or document.readable_title or "Not available"
    description_context = document.description or "Not available"

    prompt = f"""
You are Memora AI, a precise personal knowledge assistant.

Read the source content carefully and create a saved memory that helps the user find,
understand, and reuse this content later.

Use ONLY the supplied source. Do not invent names, tools, facts, numbers, dates, steps,
features, or conclusions.

SOURCE:
URL: {document.url}
Content type: {document.content_type}
Extraction method: {document.extraction_method}
Extraction confidence: {document.confidence}
Page title: {title_context}
Description: {description_context}

CONTENT:
{content[:24000]}

TASK:
Return a strong memory object with title, summary, key_takeaways, why_it_matters, and tags.

SUMMARY RULES:
- Write 4 to 7 useful sentences.
- Explain the real topic, not just the website/page.
- Include important tools, examples, claims, steps, people, products, or lessons when present.
- If the content is a list, preserve the list topic and important items.
- If content is incomplete, summarize only the visible title, description, and content.
- Do not write generic phrases like "this content discusses various topics".

TAKEAWAY RULES:
- Generate 4 to 6 takeaways.
- Each takeaway must be specific and useful.
- Prefer action-oriented or recall-friendly wording.
- Do not repeat the summary.

WHY IT MATTERS:
- Write 2 to 3 sentences.
- Explain its later value for search, learning, decisions, work, creativity, or research.

TAG RULES:
- Generate 6 to 10 lowercase search tags.
- Include broad topics and specific terms.
- Include specific products, people, frameworks, places, exams, or methods when present.
- Include terms a user may actually search later.
- Avoid generic tags: content, post, article, video, website, internet, information, page, link.
- Do not invent unsupported tags.

TITLE RULES:
- Maximum 80 characters.
- Make it specific.
- Do not use clickbait.
"""

    last_error: Exception | None = None

    for attempt in range(3):
        try:
            response = await _client().aio.models.generate_content(
                model=get_settings().gemini_model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=GeneratedMetadata,
                ),
            )

            if not response.text:
                raise RuntimeError("Gemini returned an empty metadata response")

            result = GeneratedMetadata.model_validate_json(response.text)

            result.title = " ".join(result.title.split())[:80]
            result.summary = " ".join(result.summary.split())

            result.key_takeaways = [
                " ".join(takeaway.split())
                for takeaway in result.key_takeaways
                if takeaway.strip()
            ][:6]

            result.why_it_matters = " ".join(result.why_it_matters.split())

            blocked_tags = {
                "content",
                "post",
                "article",
                "video",
                "website",
                "internet",
                "information",
                "page",
                "link",
            }

            result.tags = [
                tag
                for tag in dict.fromkeys(
                    " ".join(tag.lower().strip().split())
                    for tag in result.tags
                    if tag.strip()
                )
                if tag not in blocked_tags and len(tag) <= 40
            ][:10]

            if not result.title:
                raise RuntimeError("Gemini returned an empty title")

            if len(result.summary) < 80:
                raise RuntimeError("Gemini returned a weak summary")

            if len(result.key_takeaways) < 3:
                raise RuntimeError("Gemini returned too few takeaways")

            if not result.why_it_matters:
                raise RuntimeError("Gemini returned an empty why_it_matters")

            if len(result.tags) < 3:
                raise RuntimeError("Gemini returned too few tags")

            return result

        except Exception as exc:
            last_error = exc

            if attempt < 2:
                await asyncio.sleep(1.5 * (attempt + 1))

    raise RuntimeError(
        "Gemini metadata generation failed after retries"
    ) from last_error


def embedding_text(
    metadata: GeneratedMetadata,
    document: KnowledgeDocument | None = None,
) -> str:
    parts = [
        f"Title: {metadata.title}",
        f"Summary: {metadata.summary}",
        "Key takeaways:",
        *[f"- {takeaway}" for takeaway in metadata.key_takeaways],
        f"Why it matters: {metadata.why_it_matters}",
        f"Tags: {', '.join(metadata.tags)}",
    ]

    if document:
        raw_content = " ".join(document.content.split())[:12000]
        parts.extend(
            [
                f"Source URL: {document.url}",
                f"Content type: {document.content_type}",
                f"Page title: {document.page_title or ''}",
                f"Description: {document.description or ''}",
                f"Original extracted content: {raw_content}",
            ]
        )

    return "\n".join(parts)


async def generate_document_embedding(
    text: str,
    title: str,
) -> list[float]:
    normalized_text = text.strip()
    normalized_title = title.strip()

    if not normalized_text:
        raise ValueError(
            "Document embedding text is empty"
        )

    if not normalized_title:
        raise ValueError(
            "Document embedding title is empty"
        )

    response = await _client().aio.models.embed_content(
        model=get_settings().embedding_model,
        contents=normalized_text,
        config=types.EmbedContentConfig(
            task_type="RETRIEVAL_DOCUMENT",
            title=normalized_title,
            output_dimensionality=3072,
        ),
    )

    values = (
        response.embeddings[0].values
        if response.embeddings
        else None
    )

    if not values:
        raise RuntimeError(
            "Gemini returned an empty document embedding"
        )

    embedding = list(values)

    if len(embedding) != 3072:
        raise RuntimeError(
            "Invalid document embedding dimension. "
            f"Expected 3072, received {len(embedding)}."
        )

    return embedding


async def generate_query_embedding(
    query: str,
) -> list[float]:
    normalized_query = " ".join(
        query.strip().split()
    )

    if not normalized_query:
        raise ValueError("Search query is empty")

    response = await _client().aio.models.embed_content(
        model=get_settings().embedding_model,
        contents=normalized_query,
        config=types.EmbedContentConfig(
            task_type="RETRIEVAL_QUERY",
            output_dimensionality=3072,
        ),
    )

    values = (
        response.embeddings[0].values
        if response.embeddings
        else None
    )

    if not values:
        raise RuntimeError(
            "Gemini returned an empty query embedding"
        )

    embedding = list(values)

    if len(embedding) != 3072:
        raise RuntimeError(
            "Invalid query embedding dimension. "
            f"Expected 3072, received {len(embedding)}."
        )

    return embedding
