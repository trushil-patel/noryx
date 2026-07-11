import ipaddress
import socket
from urllib.parse import urlparse
import httpx
from memora.config import get_settings

USER_AGENT = "Mozilla/5.0 (compatible; MemoraBot/2.0; +https://memora.app)"


def _assert_public_url(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise ValueError("Only public HTTP and HTTPS URLs are supported")
    for result in socket.getaddrinfo(parsed.hostname, parsed.port or 443):
        address = ipaddress.ip_address(result[4][0])
        if not address.is_global:
            raise ValueError("Private or local network URLs are not allowed")


async def fetch_page(url: str) -> str:
    _assert_public_url(url)
    settings = get_settings()
    async with httpx.AsyncClient(follow_redirects=True, timeout=settings.fetch_timeout_seconds) as client:
        response = await client.get(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml"})
        response.raise_for_status()
        if "text/html" not in response.headers.get("content-type", ""):
            raise ValueError(f"Unsupported content type: {response.headers.get('content-type', '')}")
        if len(response.content) > settings.max_page_bytes:
            raise ValueError("Page is too large to extract")
        _assert_public_url(str(response.url))
        return response.text
