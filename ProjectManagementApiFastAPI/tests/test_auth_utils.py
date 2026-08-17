import pytest
from jose import jwt as jose_jwt

from ProjectManagementApiFastAPI.app.utils.auth_utils import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)
from ProjectManagementApiFastAPI.app.core.config import settings


def test_password_hash_is_bcrypt_and_not_plaintext():
    plain = "MySecurePass123!"
    hashed = hash_password(plain)
    assert hashed != plain
    assert hashed.startswith("$2b$")


def test_verify_password_accepts_correct_password():
    plain = "MySecurePass123!"
    hashed = hash_password(plain)
    assert verify_password(plain, hashed) is True


def test_verify_password_rejects_wrong_password():
    hashed = hash_password("MySecurePass123!")
    assert verify_password("SomethingElse", hashed) is False


def test_access_token_contains_expected_claims():
    token = create_access_token(user_id=42, email="jane@example.com", full_name="Jane Doe", role="Admin")
    claims = decode_access_token(token)

    assert claims["sub"] == "42"
    assert claims["email"] == "jane@example.com"
    assert claims["name"] == "Jane Doe"
    assert claims["role"] == "Admin"
    assert claims["iss"] == settings.jwt_issuer
    assert claims["aud"] == settings.jwt_audience


def test_decode_rejects_token_signed_with_wrong_key():
    bad_token = jose_jwt.encode(
        {"sub": "1", "aud": settings.jwt_audience, "iss": settings.jwt_issuer},
        "a-completely-different-secret",
        algorithm="HS256",
    )
    with pytest.raises(Exception):
        decode_access_token(bad_token)
