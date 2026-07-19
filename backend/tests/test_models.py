import pytest
from pydantic import ValidationError

from memora.models import CollectionCreate, CaptureRequest, GeneratedMetadata


def test_capture_accepts_http_url() -> None:
    request = CaptureRequest(url="https://example.com/article")
    assert str(request.url).startswith("https://example.com")


def test_metadata_shape() -> None:
    value = GeneratedMetadata(title="Memory", summary="Summary", key_takeaways=["One"], why_it_matters="Useful", tags=["ai"])
    assert value.tags == ["ai"]


def test_collection_name_is_required() -> None:
    with pytest.raises(ValidationError):
        CollectionCreate(name="")


def test_collection_description_is_optional() -> None:
    collection = CollectionCreate(name="Product research")
    assert collection.description is None
