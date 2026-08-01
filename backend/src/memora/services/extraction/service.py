import json
import re
from html import unescape
from typing import Literal
from urllib.parse import parse_qs, urljoin, urlparse

import httpx
import trafilatura
from bs4 import BeautifulSoup

from memora.models import (
    ContentType,
    HomepageData,
    KnowledgeDocument,
)
from memora.services.extraction.fetcher import fetch_page

ExtractionMethod = Literal["article", "homepage", "fallback"]


def _clean(value: str | None) -> str:
    return re.sub(
        r"\s+",
        " ",
        unescape(value or ""),
    ).strip()


def _meta(soup: BeautifulSoup, **attrs: str) -> str | None:
    element = soup.find("meta", attrs=attrs)

    return (
        _clean(element.get("content"))
        if element and element.get("content")
        else None
    )


def _first_non_empty(*values: str | None) -> str | None:
    for value in values:
        cleaned = _clean(value)

        if cleaned:
            return cleaned

    return None


def _thumbnail(url: str, soup: BeautifulSoup) -> str | None:
    image = (
        _meta(soup, property="og:image")
        or _meta(soup, name="twitter:image")
        or _meta(soup, property="twitter:image")
        or _meta(soup, itemprop="image")
    )

    if not image:
        return None

    return urljoin(url, image)


def _youtube_video_id(url: str) -> str | None:
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()

    if "youtu.be" in host:
        video_id = parsed.path.strip("/").split("/")[0]
        return video_id or None

    if "youtube.com" in host:
        if parsed.path == "/watch":
            return parse_qs(parsed.query).get("v", [None])[0]

        if parsed.path.startswith("/shorts/"):
            return parsed.path.split("/shorts/", 1)[1].split("/")[0]

        if parsed.path.startswith("/embed/"):
            return parsed.path.split("/embed/", 1)[1].split("/")[0]

    return None


def _is_youtube_url(url: str) -> bool:
    host = (urlparse(url).hostname or "").lower()

    return "youtube.com" in host or "youtu.be" in host


async def _build_youtube_document(url: str) -> KnowledgeDocument:
    video_id = _youtube_video_id(url)

    try:
        async with httpx.AsyncClient(
            follow_redirects=True,
            timeout=12,
        ) as client:
            response = await client.get(
                "https://www.youtube.com/oembed",
                params={
                    "url": url,
                    "format": "json",
                },
                headers={
                    "User-Agent": "Mozilla/5.0 (compatible; MemoraBot/2.0)",
                    "Accept": "application/json",
                },
            )

            response.raise_for_status()
            data = response.json()

        title = _clean(data.get("title"))
        author = _clean(data.get("author_name"))
        thumbnail_url = _clean(data.get("thumbnail_url"))

        content = ". ".join(
            item
            for item in [
                f"YouTube video title: {title}" if title else None,
                f"Channel: {author}" if author else None,
                f"YouTube video ID: {video_id}" if video_id else None,
                f"Source URL: {url}",
            ]
            if item
        )

        return KnowledgeDocument(
            url=url,
            content_type="video",
            extraction_method="fallback",
            page_title=title or "YouTube video",
            description=(
                f"YouTube video by {author}"
                if author
                else "YouTube video"
            ),
            readable_title=title or "YouTube video",
            thumbnail_url=thumbnail_url
            or (
                f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
                if video_id
                else None
            ),
            content=content,
            homepage_data=None,
            confidence=0.55,
        )

    except Exception:
        thumbnail_url = (
            f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
            if video_id
            else None
        )

        return KnowledgeDocument(
            url=url,
            content_type="video",
            extraction_method="fallback",
            page_title="YouTube video",
            description="YouTube video metadata could not be fully loaded.",
            readable_title="YouTube video",
            thumbnail_url=thumbnail_url,
            content=f"YouTube video URL: {url}",
            homepage_data=None,
            confidence=0.35,
        )


async def _reader_fallback(url: str) -> str:
    try:
        reader_urls = [
            f"https://r.jina.ai/http://{url}",
            f"https://r.jina.ai/http://{url.removeprefix('https://').removeprefix('http://')}",
        ]

        async with httpx.AsyncClient(timeout=20) as client:
            for reader_url in reader_urls:
                response = await client.get(
                    reader_url,
                    headers={
                        "Accept": "text/plain",
                        "User-Agent": "Mozilla/5.0",
                    },
                )

                if response.status_code < 400:
                    text = _clean(response.text)

                    if len(text) > 300:
                        return text

        return ""

    except Exception:
        return ""


def _json_ld_text(soup: BeautifulSoup) -> str:
    useful_values: list[str] = []

    keys = {
        "headline",
        "name",
        "description",
        "articleBody",
        "text",
        "about",
        "keywords",
        "datePublished",
        "author",
        "creator",
        "publisher",
    }

    def collect(value: object) -> None:
        if isinstance(value, dict):
            for key, nested in value.items():
                if key in keys:
                    if isinstance(nested, str):
                        useful_values.append(nested)
                    elif isinstance(nested, dict):
                        name = nested.get("name")

                        if isinstance(name, str):
                            useful_values.append(name)
                    elif isinstance(nested, list):
                        for item in nested:
                            collect(item)

                elif isinstance(nested, dict | list):
                    collect(nested)

        elif isinstance(value, list):
            for item in value:
                collect(item)

    for script in soup.find_all(
        "script",
        attrs={"type": "application/ld+json"},
    ):
        raw = script.string or script.get_text()

        try:
            collect(json.loads(raw))
        except Exception:
            continue

    return "\n".join(
        dict.fromkeys(
            _clean(value)
            for value in useful_values
            if _clean(value)
        )
    )


def _metadata_text(url: str, soup: BeautifulSoup) -> str:
    values = [
        f"Source URL: {url}",
        _clean(soup.title.string if soup.title else ""),
        _meta(soup, property="og:title"),
        _meta(soup, name="twitter:title"),
        _meta(soup, name="description"),
        _meta(soup, property="og:description"),
        _meta(soup, name="twitter:description"),
        _meta(soup, name="keywords"),
    ]

    return "\n".join(
        dict.fromkeys(
            value for value in values if value and _clean(value)
        )
    )


def _visible_text(soup: BeautifulSoup) -> str:
    for element in soup.select(
        "script, style, noscript, svg, canvas, nav, footer, header, form"
    ):
        element.decompose()

    selectors = [
        "article",
        "main",
        "h1",
        "h2",
        "h3",
        "p",
        "li",
        "blockquote",
    ]

    values: list[str] = []

    for selector in selectors:
        for element in soup.select(selector):
            text = _clean(element.get_text(" ", strip=True))

            if len(text) >= 30:
                values.append(text)

            if len(" ".join(values)) > 16000:
                break

    return "\n".join(dict.fromkeys(values))


def _homepage_data(soup: BeautifulSoup) -> HomepageData:
    navigation = [
        _clean(item.get_text())
        for item in soup.select("nav a")
    ][0:20]

    headings = [
        _clean(item.get_text())
        for item in soup.select("h1, h2")
    ][0:30]

    featured = [
        _clean(item.get_text())
        for item in soup.select("article h2, article h3")
    ][0:12]

    return HomepageData(
        navigation=[
            item for item in navigation if len(item) > 2
        ],
        headings=[
            item for item in headings if item
        ],
        featured_articles=[
            item for item in featured if item
        ],
    )


def _classify(url: str, soup: BeautifulSoup) -> ContentType:
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    path = parsed.path.lower()

    description = _meta(soup, name="description") or ""

    combined = (
        f"{host} {path} "
        f"{_clean(soup.title.string if soup.title else '')} "
        f"{description}"
    ).lower()

    checks: list[tuple[ContentType, bool]] = [
        (
            "government",
            host.endswith((".gov", ".gov.in"))
            or "government" in combined,
        ),
        (
            "video",
            any(
                item in host
                for item in (
                    "youtube.com",
                    "youtu.be",
                    "vimeo.com",
                )
            ),
        ),
        (
            "repository",
            any(
                item in host
                for item in (
                    "github.com",
                    "gitlab.com",
                    "bitbucket.org",
                )
            ),
        ),
        (
            "forum",
            any(
                item in host
                for item in (
                    "reddit.com",
                    "stackoverflow.com",
                    "quora.com",
                )
            ),
        ),
        (
            "documentation",
            host.startswith("docs.")
            or "/docs" in path
            or "api reference" in combined,
        ),
        (
            "blog",
            host.startswith("blog.")
            or "/blog" in path
            or "blog" in combined,
        ),
        (
            "news",
            any(
                item in host
                for item in (
                    "bbc.",
                    "cnn.",
                    "reuters.",
                    "apnews.",
                    "thehindu.",
                    "indianexpress.",
                )
            )
            or "news" in combined,
        ),
        (
            "homepage",
            path in {"", "/", "/home", "/index.html"},
        ),
        (
            "article",
            soup.find("article") is not None
            or soup.find("meta", attrs={"name": "author"})
            is not None,
        ),
        (
            "product",
            any(
                item in combined
                for item in (
                    "pricing",
                    "features",
                    "product",
                )
            ),
        ),
    ]

    return next(
        (kind for kind, matches in checks if matches),
        "unknown",
    )


def _fallback_document(url: str, reason: str) -> KnowledgeDocument:
    parsed = urlparse(url)
    host = parsed.hostname or "Unknown website"
    path_words = " ".join(
        part
        for part in re.split(r"[-_/]+", parsed.path)
        if part
    )

    content = "\n".join(
        [
            f"Source URL: {url}",
            f"Website: {host}",
            f"Path context: {path_words}",
            f"Extraction note: {reason}",
        ]
    )

    return KnowledgeDocument(
        url=url,
        content_type="unknown",
        extraction_method="fallback",
        page_title=host,
        description=(
            "This page could not be fully extracted, "
            "so Memora saved available URL metadata."
        ),
        readable_title=host,
        thumbnail_url=None,
        content=content,
        homepage_data=None,
        confidence=0.2,
    )


async def build_knowledge_document(url: str) -> KnowledgeDocument:
    if _is_youtube_url(url):
        return await _build_youtube_document(url)

    try:
        html = await fetch_page(url)
    except Exception as exc:
        reader_content = await _reader_fallback(url)

        if reader_content:
            parsed = urlparse(url)
            host = parsed.hostname or "Unknown website"

            return KnowledgeDocument(
                url=url,
                content_type="unknown",
                extraction_method="fallback",
                page_title=host,
                description="Extracted with reader fallback.",
                readable_title=host,
                thumbnail_url=None,
                content=reader_content[:30000],
                homepage_data=None,
                confidence=0.65,
            )

        return _fallback_document(url, str(exc))

    soup = BeautifulSoup(html, "html.parser")

    page_title = _first_non_empty(
        _clean(soup.title.string if soup.title else ""),
        _meta(soup, property="og:title"),
        _meta(soup, name="twitter:title"),
    )

    description = _first_non_empty(
        _meta(soup, name="description"),
        _meta(soup, property="og:description"),
        _meta(soup, name="twitter:description"),
    )

    thumbnail_url = _thumbnail(url, soup)
    kind = _classify(url, soup)
    data = _homepage_data(soup) if kind in {"homepage", "blog"} else None

    extracted = (
        trafilatura.extract(
            html,
            url=url,
            include_comments=False,
            include_tables=True,
            favor_recall=True,
        )
        or ""
    )

    metadata_content = _metadata_text(url, soup)
    json_ld_content = _json_ld_text(soup)
    visible_content = _visible_text(soup)

    content_parts = [
        _clean(extracted),
        _clean(json_ld_content),
        _clean(metadata_content),
        _clean(visible_content),
    ]

    content = "\n\n".join(
        dict.fromkeys(
            part for part in content_parts if len(part) >= 20
        )
    )

    if data:
        homepage_content = "\n".join(
            [
                f"Website Title: {page_title or ''}",
                "Website Navigation:",
                *data.navigation,
                "Main Page Headings:",
                *data.headings,
                "Featured Articles / Examples:",
                *data.featured_articles,
            ]
        )

        content = "\n\n".join(
            part
            for part in [
                content,
                homepage_content,
            ]
            if part.strip()
        )

    method: ExtractionMethod = "article"
    confidence = 0.85

    if len(content.strip()) < 500:
        reader_content = await _reader_fallback(url)

        if len(reader_content) > len(content):
            content = reader_content[:30000]
            method = "fallback"
            confidence = 0.7

    if not content.strip():
        return _fallback_document(
            url,
            "No readable page text or metadata was found.",
        )

    content = content[:30000]

    if kind in {"homepage", "blog"}:
        method = "homepage"
    elif len(content) < 500:
        method = "fallback"
        confidence = 0.45
    elif not extracted and visible_content:
        method = "fallback"
        confidence = 0.65

    return KnowledgeDocument(
        url=url,
        content_type=kind,
        extraction_method=method,
        page_title=page_title,
        description=description,
        readable_title=page_title,
        thumbnail_url=thumbnail_url,
        content=content,
        homepage_data=data,
        confidence=confidence,
    )