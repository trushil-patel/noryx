import socket
from types import SimpleNamespace

import httpx
import pytest

from memora.services.extraction import fetcher

ORIGINAL_ASYNC_CLIENT = httpx.AsyncClient


def public_dns(host: str, port: int, *_: object, **__: object):
    address = host if host == "127.0.0.1" else "93.184.216.34"
    return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (address, port))]


def client_factory(transport: httpx.MockTransport):
    def create_client(**_: object) -> httpx.AsyncClient:
        return ORIGINAL_ASYNC_CLIENT(transport=transport, follow_redirects=False)

    return create_client


@pytest.mark.asyncio
async def test_fetch_page_rejects_private_redirect_before_request(monkeypatch) -> None:
    requested: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requested.append(str(request.url))
        return httpx.Response(302, headers={"location": "http://127.0.0.1/admin"})

    transport = httpx.MockTransport(handler)
    monkeypatch.setattr(fetcher.socket, "getaddrinfo", public_dns)
    monkeypatch.setattr(fetcher.httpx, "AsyncClient", client_factory(transport))

    with pytest.raises(ValueError, match="Private or local"):
        await fetcher.fetch_page("https://example.com/start")

    assert requested == ["https://example.com/start"]


@pytest.mark.asyncio
async def test_fetch_page_enforces_streamed_size_limit(monkeypatch) -> None:
    def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            headers={"content-type": "text/html; charset=utf-8"},
            content=b"more than ten bytes",
        )

    transport = httpx.MockTransport(handler)
    monkeypatch.setattr(fetcher.socket, "getaddrinfo", public_dns)
    monkeypatch.setattr(fetcher.httpx, "AsyncClient", client_factory(transport))
    monkeypatch.setattr(
        fetcher,
        "get_settings",
        lambda: SimpleNamespace(
            fetch_timeout_seconds=1,
            max_page_bytes=10,
            max_redirects=2,
        ),
    )

    with pytest.raises(ValueError, match="too large"):
        await fetcher.fetch_page("https://example.com/large")
