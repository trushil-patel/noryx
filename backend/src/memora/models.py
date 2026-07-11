from typing import Literal
from pydantic import BaseModel, Field, HttpUrl

ContentType = Literal["article", "homepage", "documentation", "government", "news", "blog", "product", "video", "repository", "forum", "unknown"]


class User(BaseModel):
    id: str
    email: str | None = None


class CaptureRequest(BaseModel):
    url: HttpUrl


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
    content: str
    homepage_data: HomepageData | None
    confidence: float = Field(ge=0, le=1)


class GeneratedMetadata(BaseModel):
    title: str
    summary: str
    key_takeaways: list[str]
    why_it_matters: str
    tags: list[str]
