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
    prompt = f"""
You are Memora AI.

Memora is an AI memory for knowledge people discover
online.

Your task is to transform the extracted source into an
accurate, searchable memory.

Use only the supplied knowledge document.
Never invent details.
Never assume facts that are not supported by the content.

CONTENT TYPE:
{document.content_type}

SOURCE URL:
{document.url}

PAGE TITLE:
{document.page_title or "Not available"}

DESCRIPTION:
{document.description or "Not available"}

EXTRACTED CONTENT:
{document.content[:12000]}

MEMORY RULES:
- The title must describe the knowledge, not merely the
  website.
- Keep the title clear and under 80 characters.
- The summary must explain the main subject accurately.
- Generate 3 to 5 useful key takeaways.
- Explain why this knowledge could be useful later.
- Be conservative when the extracted content is incomplete.
- Never invent transcript details, names, statistics,
  features, dates, or conclusions.

TAG RULES:
- Generate 5 to 8 accurate search tags.
- Use only concepts clearly supported by the extracted
  content.
- Include both broad topics and specific concepts.
- Include important visible entities such as products,
  tools, technologies, organizations, people, locations,
  frameworks, platforms, or events.
- Include common abbreviations only when explicitly present
  or unambiguously supported.
- Prefer short, searchable tags.
- Use lowercase.
- Avoid duplicate or nearly identical tags.
- Avoid generic tags such as "content", "website",
  "article", "information", "internet", "post", or "video".
- Do not create speculative tags.
- Choose words users are likely to remember and search for
  later.
"""

    last_error: Exception | None = None

    for attempt in range(3):
        try:
            response = (
                await _client().aio.models.generate_content(
                    model=get_settings().gemini_model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type=(
                            "application/json"
                        ),
                        response_schema=GeneratedMetadata,
                    ),
                )
            )

            if not response.text:
                raise RuntimeError(
                    "Gemini returned an empty metadata response"
                )

            result = (
                GeneratedMetadata.model_validate_json(
                    response.text
                )
            )

            result.title = result.title.strip()[:80]
            result.summary = result.summary.strip()

            result.key_takeaways = [
                takeaway.strip()
                for takeaway in result.key_takeaways
                if takeaway.strip()
            ][:5]

            result.why_it_matters = (
                result.why_it_matters.strip()
            )

            result.tags = list(
                dict.fromkeys(
                    tag.strip().lower()
                    for tag in result.tags
                    if tag.strip()
                )
            )[:8]

            if not result.title:
                raise RuntimeError(
                    "Gemini returned an empty title"
                )

            if not result.summary:
                raise RuntimeError(
                    "Gemini returned an empty summary"
                )

            if not result.key_takeaways:
                raise RuntimeError(
                    "Gemini returned no key takeaways"
                )

            if not result.why_it_matters:
                raise RuntimeError(
                    "Gemini returned an empty explanation"
                )

            return result

        except Exception as exc:
            last_error = exc

            if attempt < 2:
                await asyncio.sleep(
                    1.5 * (attempt + 1)
                )

    raise RuntimeError(
        "Gemini metadata generation failed after retries"
    ) from last_error


def embedding_text(
    metadata: GeneratedMetadata,
) -> str:
    return "\n".join(
        [
            f"Title: {metadata.title}",
            f"Summary: {metadata.summary}",
            "Key takeaways:",
            *[
                f"- {takeaway}"
                for takeaway in metadata.key_takeaways
            ],
            (
                "Why it matters: "
                f"{metadata.why_it_matters}"
            ),
            f"Tags: {', '.join(metadata.tags)}",
        ]
    )


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