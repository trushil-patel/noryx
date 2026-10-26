import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest

from memora.models import User
from memora.routes import knowledge


@pytest.mark.asyncio
@pytest.mark.parametrize("slow_stage", ["embedding", "rpc"])
async def test_search_returns_keyword_results_when_semantics_timeout(monkeypatch, slow_stage):
    import time

    item = {"id": "one", "title": "Python development", "user_id": "owner"}
    client = MagicMock()
    selection = client.table.return_value.select.return_value.eq.return_value
    selection.order.return_value.limit.return_value.execute.return_value = SimpleNamespace(
        data=[item]
    )
    client.rpc.return_value.execute.return_value = SimpleNamespace(data=[])

    async def embed(query):
        if slow_stage == "embedding":
            await asyncio.sleep(1)
        return [0.1]

    if slow_stage == "rpc":

        def slow_rpc():
            time.sleep(0.1)
            return SimpleNamespace(data=[])

        client.rpc.return_value.execute.side_effect = slow_rpc

    monkeypatch.setattr(knowledge, "admin_client", lambda: client)
    monkeypatch.setattr(
        knowledge, "get_settings", lambda: SimpleNamespace(search_semantic_timeout_seconds=0.01)
    )
    monkeypatch.setattr(knowledge, "generate_query_embedding", embed)
    result = await asyncio.wait_for(knowledge.search(User(id="owner"), "python", 20), 0.5)
    assert result["items"] == [item]
    client.table.return_value.select.return_value.eq.assert_called_once_with("user_id", "owner")


@pytest.mark.asyncio
async def test_search_keeps_semantic_matches(monkeypatch):
    client = MagicMock()
    selection = client.table.return_value.select.return_value.eq.return_value
    selection.order.return_value.limit.return_value.execute.return_value = SimpleNamespace(
        data=[]
    )
    item = {"id": "semantic", "title": "Django framework", "similarity": 0.9}
    client.rpc.return_value.execute.return_value = SimpleNamespace(data=[item])
    monkeypatch.setattr(knowledge, "admin_client", lambda: client)
    monkeypatch.setattr(
        knowledge, "get_settings", lambda: SimpleNamespace(search_semantic_timeout_seconds=1)
    )
    monkeypatch.setattr(knowledge, "generate_query_embedding", AsyncMock(return_value=[0.1]))
    result = await knowledge.search(User(id="owner"), "python", 20)
    assert result["items"] == [item]
    assert client.rpc.call_args.args[1]["match_user_id"] == "owner"
