from datetime import datetime, timezone

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base, get_db
from app.main import app
from app.models import *  # noqa: F401,F403


@pytest_asyncio.fixture
async def client():
    """Create a test client with an in-memory database."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.mark.asyncio
async def test_list_sessions_empty(client):
    resp = await client.get("/api/tests/sessions")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_get_session_not_found(client):
    resp = await client.get("/api/tests/sessions/999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_schedule_crud(client):
    # Create
    resp = await client.post("/api/schedule", json={
        "name": "Test Schedule",
        "interval_minutes": 15,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Test Schedule"
    assert data["interval_minutes"] == 15
    assert data["enabled"] is True
    schedule_id = data["id"]

    # List
    resp = await client.get("/api/schedule")
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    # Update
    resp = await client.put(f"/api/schedule/{schedule_id}", json={"enabled": False})
    assert resp.status_code == 200
    assert resp.json()["enabled"] is False

    # Delete
    resp = await client.delete(f"/api/schedule/{schedule_id}")
    assert resp.status_code == 204

    # Verify deleted
    resp = await client.get("/api/schedule")
    assert resp.status_code == 200
    assert len(resp.json()) == 0


@pytest.mark.asyncio
async def test_alert_threshold_crud(client):
    # Create
    resp = await client.post("/api/alerts/thresholds", json={
        "metric_name": "download_mbps",
        "condition": "lt",
        "threshold_value": 25.0,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["metric_name"] == "download_mbps"
    threshold_id = data["id"]

    # List
    resp = await client.get("/api/alerts/thresholds")
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    # Delete
    resp = await client.delete(f"/api/alerts/thresholds/{threshold_id}")
    assert resp.status_code == 204

    resp = await client.get("/api/alerts/thresholds")
    assert resp.status_code == 200
    assert len(resp.json()) == 0
