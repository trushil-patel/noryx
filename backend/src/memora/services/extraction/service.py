import re
from html import unescape
import trafilatura
from bs4 import BeautifulSoup
from memora.models import ContentType, HomepageData, KnowledgeDocument
from memora.services.extraction.fetcher import fetch_page
from urllib.parse import urljoin, urlparse

def _clean(value: str | None) -> str:
    return re.sub(r"\s+", " ", unescape(value or "")).strip()


def _meta(soup: BeautifulSoup, **attrs: str) -> str | None:
    element = soup.find("meta", attrs=attrs)
    return _clean(element.get("content")) if element and element.get("content") else None

def _thumbnail(url: str, soup: BeautifulSoup) -> str | None:
    image = (
        _meta(soup, property="og:image")
        or _meta(soup, attrs={"name": "twitter:image"})
        or _meta(soup, attrs={"property": "twitter:image"})
    )

    if not image:
        return None

    return urljoin(url, image)

def _classify(url: str, soup: BeautifulSoup) -> ContentType:
    parsed = urlparse(url)
    host, path = (parsed.hostname or "").lower(), parsed.path.lower()
    description = _meta(soup, name="description") or ""
    combined = f"{host} {path} {_clean(soup.title.string if soup.title else '')} {description}".lower()
    checks: list[tuple[ContentType, bool]] = [
        ("government", host.endswith((".gov", ".gov.in")) or "government" in combined),
        ("video", any(x in host for x in ("youtube.com", "youtu.be", "vimeo.com"))),
        ("repository", any(x in host for x in ("github.com", "gitlab.com", "bitbucket.org"))),
        ("forum", any(x in host for x in ("reddit.com", "stackoverflow.com", "quora.com"))),
        ("documentation", host.startswith("docs.") or "/docs" in path or "api reference" in combined),
        ("blog", host.startswith("blog.") or "/blog" in path or "blog" in combined),
        ("news", any(x in host for x in ("bbc.", "cnn.", "reuters.")) or "news" in combined),
        ("homepage", path in {"", "/", "/home", "/index.html"}),
        ("article", soup.find("article") is not None or soup.find("meta", attrs={"name": "author"}) is not None),
        ("product", any(x in combined for x in ("pricing", "features", "product"))),
    ]
    return next((kind for kind, matches in checks if matches), "unknown")


async def build_knowledge_document(url: str) -> KnowledgeDocument:
    html = await fetch_page(url)
    soup = BeautifulSoup(html, "html.parser")
    page_title = _clean(soup.title.string if soup.title else "") or None
    description = _meta(soup, name="description") or _meta(soup, property="og:description")
    thumbnail_url = _thumbnail(url, soup)
    kind = _classify(url, soup)
    if kind in {"homepage", "blog"}:
        navigation = [_clean(x.get_text()) for x in soup.select("nav a")][0:20]
        headings = [_clean(x.get_text()) for x in soup.select("h1, h2")][0:30]
        featured = [_clean(x.get_text()) for x in soup.select("article h2, article h3")][0:12]
        data = HomepageData(navigation=[x for x in navigation if len(x) > 2], headings=[x for x in headings if x], featured_articles=[x for x in featured if x])
        content = "\n".join([f"Website Title: {page_title or ''}", "Website Navigation:", *data.navigation, "Main Page Headings:", *data.headings, "Featured Articles / Examples:", *data.featured_articles])
        method = "homepage"
    else:
        data = None
        extracted = trafilatura.extract(html, url=url, include_comments=False, include_tables=True) or ""
        content = _clean(extracted)
        if len(content) < 300:
            content = ". ".join(x for x in [page_title, description, _meta(soup, property="og:title")] if x)
        method = "article" if content else "fallback"
    return KnowledgeDocument(url=url, content_type=kind, extraction_method=method, page_title=page_title, description=description,thumbnail_url=thumbnail_url, readable_title=page_title, content=content, homepage_data=data, confidence=0.85 if len(content) > 300 else 0.45)
