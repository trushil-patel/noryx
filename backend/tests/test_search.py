from memora.routes.knowledge import (
    build_search_plan,
    rerank_search_results,
    token_match_quality,
)


def memory(
    title: str,
    summary: str = "",
    tags: list[str] | None = None,
    similarity: float | None = None,
) -> dict[str, object]:
    item: dict[str, object] = {
        "id": title,
        "title": title,
        "summary": summary,
        "knowledge_tags": [{"tag": tag} for tag in tags or []],
        "key_takeaways": [],
    }
    if similarity is not None:
        item["similarity"] = similarity
    return item


def test_word_forms_match() -> None:
    assert token_match_quality("coder", "coding") >= 0.9
    assert token_match_quality("developers", "developer") >= 0.9


def test_short_typo_query_uses_library_vocabulary() -> None:
    item = memory(
        "A practical guide to vibe coding",
        tags=["vibe coding", "ai development"],
    )

    _, phrases, core_terms, expanded_terms = build_search_plan(
        "vice coder",
        [item],
    )

    assert core_terms == ["vibe", "coding"]
    assert "vibe coding" in phrases
    assert rerank_search_results(
        [item],
        phrases,
        core_terms,
        expanded_terms,
        10,
    ) == [item]


def test_vibe_typo_is_corrected_even_without_literal_vibe_tag() -> None:
    item = memory(
        "Build apps by describing them to an AI",
        tags=["ai development", "prompt programming"],
    )
    _, phrases, core_terms, _ = build_search_plan("vice coding", [item])

    assert core_terms == ["vibe", "coding"]
    assert "ai coding" in phrases


def test_semantic_match_can_rescue_short_query() -> None:
    item = memory(
        "Building software with natural-language prompts",
        similarity=0.64,
    )
    _, phrases, core_terms, expanded_terms = build_search_plan(
        "vibe coder",
        [item],
    )

    assert rerank_search_results(
        [item],
        phrases,
        core_terms,
        expanded_terms,
        10,
    ) == [item]


def test_irrelevant_item_is_filtered_without_semantic_support() -> None:
    item = memory("Healthy breakfast recipes", tags=["nutrition"])
    _, phrases, core_terms, expanded_terms = build_search_plan(
        "vibe coding",
        [item],
    )

    assert rerank_search_results(
        [item],
        phrases,
        core_terms,
        expanded_terms,
        10,
    ) == []
