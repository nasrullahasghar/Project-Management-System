"""
Integration tests for the /api/auth endpoints.

These hit your real PostgreSQL database (via DATABASE_URL in .env), the same
way Swagger UI would against the .NET backend. Each test uses a randomly
generated email so re-running the suite doesn't collide with leftover data.

Run with:
    pytest tests/test_auth_api.py -v
"""
import uuid

import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app


def unique_email() -> str:
    return f"test_{uuid.uuid4().hex[:10]}@example.com"


@pytest.mark.asyncio
async def test_register_creates_user_and_returns_token():
    email = unique_email()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/auth/register",
            json={
                "full_name": "Test User",
                "email": email,
                "password": "TestPass123!",
                "role": "TeamMember",
            },
        )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["email"] == email
    assert body["full_name"] == "Test User"
    assert body["role"] == "TeamMember"
    assert isinstance(body["token"], str) and len(body["token"]) > 0


@pytest.mark.asyncio
async def test_register_rejects_invalid_role():
    email = unique_email()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/auth/register",
            json={
                "full_name": "Test User",
                "email": email,
                "password": "TestPass123!",
                "role": "SuperAdmin",  # not a valid role
            },
        )

    assert response.status_code == 400


@pytest.mark.asyncio
async def test_register_rejects_duplicate_email():
    email = unique_email()
    payload = {
        "full_name": "Test User",
        "email": email,
        "password": "TestPass123!",
        "role": "TeamMember",
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        first = await client.post("/api/auth/register", json=payload)
        second = await client.post("/api/auth/register", json=payload)

    assert first.status_code == 200
    assert second.status_code == 400


@pytest.mark.asyncio
async def test_login_succeeds_with_correct_credentials():
    email = unique_email()
    password = "TestPass123!"
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        await client.post(
            "/api/auth/register",
            json={"full_name": "Test User", "email": email, "password": password, "role": "TeamMember"},
        )
        response = await client.post("/api/auth/login", json={"email": email, "password": password})

    assert response.status_code == 200
    assert response.json()["email"] == email


@pytest.mark.asyncio
async def test_login_fails_with_wrong_password():
    email = unique_email()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        await client.post(
            "/api/auth/register",
            json={"full_name": "Test User", "email": email, "password": "CorrectPass1!", "role": "TeamMember"},
        )
        response = await client.post("/api/auth/login", json={"email": email, "password": "WrongPass"})

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_fails_for_nonexistent_user():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/auth/login", json={"email": unique_email(), "password": "whatever"}
        )

    assert response.status_code == 401
