import pytest
from pydantic import ValidationError

from memora.models import CaptureRequest, CollectionCreate, CustomTagsUpdate, GeneratedMetadata


def test_capture_accepts_http_url() -> None:
    request = CaptureRequest(url="https://example.com/article")
    assert str(request.url).startswith("https://example.com")


def test_capture_accepts_optional_collection() -> None:
    request = CaptureRequest(
        url="https://example.com/article",
        collection_id="11111111-1111-1111-1111-111111111111",
    )

    assert str(request.collection_id) == "11111111-1111-1111-1111-111111111111"


def test_metadata_shape() -> None:
    value = GeneratedMetadata(
        title="Memory",
        summary="Summary",
        key_takeaways=["One"],
        why_it_matters="Useful",
        tags=["ai"],
    )
    assert value.tags == ["ai"]


def test_collection_name_is_required() -> None:
    with pytest.raises(ValidationError):
        CollectionCreate(name="")


def test_collection_description_is_optional() -> None:
    collection = CollectionCreate(name="Product research")
    assert collection.description is None
    assert collection.connection_ids == []


def test_collection_accepts_connections() -> None:
    collection = CollectionCreate(
        name="Team research",
        connection_ids=["11111111-1111-1111-1111-111111111111"],
    )
    assert collection.connection_ids == ["11111111-1111-1111-1111-111111111111"]


def test_custom_tags_are_normalized_and_deduplicated() -> None:
    value = CustomTagsUpdate(tags=[" #Read Later ", "read later", "  Project   Noryx  "])

    assert value.tags == ["read later", "project noryx"]


def test_custom_tags_reject_overlong_values() -> None:
    with pytest.raises(ValidationError):
        CustomTagsUpdate(tags=["x" * 41])
