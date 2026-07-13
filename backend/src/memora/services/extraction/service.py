import re
from html import unescape
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


def _thumbnail(url: str, soup: BeautifulSoup) -> str | None:
    image = (
        _meta(soup, property="og:image")
        or _meta(soup, name="twitter:image")
        or _meta(soup, property="twitter:image")
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

    oembed_url = "https://www.youtube.com/oembed"

    try:
        async with httpx.AsyncClient(
            follow_redirects=True,
            timeout=12,
        ) as client:
            response = await client.get(
                oembed_url,
                params={
                    "url": url,
                    "format": "json",
                },
                headers={
                    "User-Agent": (
                        "Mozilla/5.0 (compatible; MemoraBot/2.0)"
                    ),
                    "Accept": "application/json",
                },
            )

            response.raise_for_status()
            data = response.json()

        title = _clean(data.get("title"))
        author = _clean(data.get("author_name"))
        thumbnail_url = _clean(data.get("thumbnail_url"))

        content_parts = [
            f"YouTube video title: {title}",
            f"Channel: {author}",
            f"Source URL: {url}",
        ]

        if video_id:
            content_parts.append(f"YouTube video ID: {video_id}")

        content = ". ".join(
            part for part in content_parts if part and not part.endswith(": ")
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
            thumbnail_url=thumbnail_url or (
                f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
                if video_id
                else None
            ),
            content=content,
            homepage_data=None,
            confidence=0.55,
        )

    except Exception:
        title = "YouTube video"
        thumbnail_url = (
            f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
            if video_id
            else None
        )

        return KnowledgeDocument(
            url=url,
            content_type="video",
            extraction_method="fallback",
            page_title=title,
            description="YouTube video metadata could not be fully loaded.",
            readable_title=title,
            thumbnail_url=thumbnail_url,
            content=f"YouTube video URL: {url}",
            homepage_data=None,
            confidence=0.35,
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


async def build_knowledge_document(url: str) -> KnowledgeDocument:
    if _is_youtube_url(url):
        return await _build_youtube_document(url)

    html = await fetch_page(url)
    soup = BeautifulSoup(html, "html.parser")

    page_title = (
        _clean(soup.title.string if soup.title else "")
        or None
    )

    description = (
        _meta(soup, name="description")
        or _meta(soup, property="og:description")
    )

    thumbnail_url = _thumbnail(url, soup)
    kind = _classify(url, soup)

    if kind in {"homepage", "blog"}:
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

        data = HomepageData(
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

        content = "\n".join(
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

        method = "homepage"

    else:
        data = None

        extracted = (
            trafilatura.extract(
                html,
                url=url,
                include_comments=False,
                include_tables=True,
            )
            or ""
        )

        content = _clean(extracted)

        if len(content) < 300:
            content = ". ".join(
                item
                for item in [
                    page_title,
                    description,
                    _meta(soup, property="og:title"),
                ]
                if item
            )

        method = "article" if content else "fallback"

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
        confidence=0.85 if len(content) > 300 else 0.45,
    )