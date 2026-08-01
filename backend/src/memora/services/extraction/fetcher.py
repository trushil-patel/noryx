import ipaddress
import socket
from urllib.parse import urljoin, urlparse

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
    settings = get_settings()
    current_url = url
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml",
    }

    async with httpx.AsyncClient(
        follow_redirects=False,
        timeout=settings.fetch_timeout_seconds,
    ) as client:
        for redirect_count in range(settings.max_redirects + 1):
            _assert_public_url(current_url)
            async with client.stream("GET", current_url, headers=headers) as response:
                if response.is_redirect:
                    location = response.headers.get("location")
                    if not location:
                        raise ValueError("Redirect response did not include a destination")
                    if redirect_count == settings.max_redirects:
                        raise ValueError("Too many redirects")
                    current_url = urljoin(str(response.url), location)
                    continue

                response.raise_for_status()
                content_type = response.headers.get("content-type", "")
                if "text/html" not in content_type.lower():
                    raise ValueError(f"Unsupported content type: {content_type}")

                content = bytearray()
                async for chunk in response.aiter_bytes():
                    content.extend(chunk)
                    if len(content) > settings.max_page_bytes:
                        raise ValueError("Page is too large to extract")

                encoding = response.encoding or "utf-8"
                return bytes(content).decode(encoding, errors="replace")

    raise ValueError("Unable to fetch URL")
