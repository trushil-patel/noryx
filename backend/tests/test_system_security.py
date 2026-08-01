from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from memora.main import app
from memora.models import User
from memora.routes import system


def test_health_response_has_security_headers() -> None:
    response = TestClient(app).get("/api/health")

    assert response.status_code == 200
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["cache-control"] == "no-store"


@pytest.mark.asyncio
async def test_database_diagnostic_is_disabled_by_default(monkeypatch) -> None:
    monkeypatch.setattr(
        system,
        "get_settings",
        lambda: SimpleNamespace(enable_diagnostic_endpoints=False),
    )

    with pytest.raises(HTTPException) as raised:
        await system.test_db(User(id="00000000-0000-0000-0000-000000000000"))

    assert raised.value.status_code == 404
