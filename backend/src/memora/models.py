from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, HttpUrl, field_validator

ContentType = Literal[
    "article",
    "homepage",
    "documentation",
    "government",
    "news",
    "blog",
    "product",
    "video",
    "repository",
    "forum",
    "unknown",
]


class User(BaseModel):
    id: str
    email: str | None = None


class CaptureRequest(BaseModel):
    url: HttpUrl
    collection_id: UUID | None = None


class CustomTagsUpdate(BaseModel):
    tags: list[str] = Field(default_factory=list, max_length=20)

    @field_validator("tags")
    @classmethod
    def normalize_tags(cls, values: list[str]) -> list[str]:
        normalized: list[str] = []

        for value in values:
            tag = " ".join(value.strip().removeprefix("#").strip().lower().split())
            if not tag:
                continue
            if len(tag) > 40:
                raise ValueError("Tags must be 40 characters or fewer.")
            if tag not in normalized:
                normalized.append(tag)

        return normalized


class CollectionCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    description: str | None = Field(default=None, max_length=500)
    connection_ids: list[str] = Field(default_factory=list, max_length=100)


class CollectionUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    description: str | None = Field(default=None, max_length=500)


class CollectionItemCreate(BaseModel):
    knowledge_item_id: str


class CollectionMemberCreate(BaseModel):
    connection_id: str


class ConnectionCreate(BaseModel):
    user_id: str


class ConnectionUpdate(BaseModel):
    action: Literal["accept", "decline"]


class HomepageData(BaseModel):
    navigation: list[str]
    headings: list[str]
    featured_articles: list[str]


class KnowledgeDocument(BaseModel):
    url: str
    content_type: ContentType
    extraction_method: Literal["article", "homepage", "fallback"]
    page_title: str | None
    description: str | None
    readable_title: str | None
    thumbnail_url: str | None
    content: str
    homepage_data: HomepageData | None
    confidence: float = Field(ge=0, le=1)


class GeneratedMetadata(BaseModel):
    title: str
    summary: str
    key_takeaways: list[str]
    why_it_matters: str
    tags: list[str]
