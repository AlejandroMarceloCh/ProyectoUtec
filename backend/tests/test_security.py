"""
Tests para app/core/security.py
Cubre: hashing, JWT de sesión, QR tokens, anti-replay y expiración.
"""
import time
import uuid
from datetime import timedelta
from unittest.mock import patch

import pytest
from jose import JWTError

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
    create_qr_token,
    decode_qr_token,
)


USER_ID = str(uuid.uuid4())


# ---------------------------------------------------------------------------
# Contraseñas
# ---------------------------------------------------------------------------

class TestPasswords:
    def test_hash_is_not_plaintext(self):
        hashed = hash_password("secreto123")
        assert hashed != "secreto123"

    def test_verify_correct_password(self):
        hashed = hash_password("secreto123")
        assert verify_password("secreto123", hashed) is True

    def test_reject_wrong_password(self):
        hashed = hash_password("secreto123")
        assert verify_password("otraClave", hashed) is False

    def test_two_hashes_same_password_are_different(self):
        h1 = hash_password("secreto123")
        h2 = hash_password("secreto123")
        assert h1 != h2  # bcrypt usa salt aleatorio


# ---------------------------------------------------------------------------
# JWT de sesión
# ---------------------------------------------------------------------------

class TestSessionTokens:
    def test_access_token_decodifica_correctamente(self):
        token = create_access_token(USER_ID)
        payload = decode_access_token(token)
        assert payload["sub"] == USER_ID
        assert payload["type"] == "access"

    def test_refresh_token_decodifica_correctamente(self):
        token = create_refresh_token(USER_ID)
        payload = decode_refresh_token(token)
        assert payload["sub"] == USER_ID
        assert payload["type"] == "refresh"

    def test_access_token_rechaza_refresh(self):
        refresh = create_refresh_token(USER_ID)
        with pytest.raises(JWTError):
            decode_access_token(refresh)

    def test_refresh_token_rechaza_access(self):
        access = create_access_token(USER_ID)
        with pytest.raises(JWTError):
            decode_refresh_token(access)

    def test_token_manipulado_es_rechazado(self):
        token = create_access_token(USER_ID)
        corrupted = token[:-5] + "XXXXX"
        with pytest.raises(JWTError):
            decode_access_token(corrupted)

    def test_token_expirado_es_rechazado(self):
        from app.core.config import now_lima
        past = now_lima() - timedelta(hours=2)
        with patch("app.core.security.now_lima", return_value=past):
            token = create_access_token(USER_ID)
        with pytest.raises(JWTError):
            decode_access_token(token)


# ---------------------------------------------------------------------------
# QR Tokens
# ---------------------------------------------------------------------------

class TestQRTokens:
    def test_qr_token_contiene_sub_y_jti(self):
        token = create_qr_token(USER_ID)
        payload = decode_qr_token(token)
        assert payload["sub"] == USER_ID
        assert "jti" in payload
        assert payload["type"] == "gym_qr"

    def test_cada_qr_tiene_jti_unico(self):
        t1 = create_qr_token(USER_ID)
        t2 = create_qr_token(USER_ID)
        p1 = decode_qr_token(t1)
        p2 = decode_qr_token(t2)
        assert p1["jti"] != p2["jti"]

    def test_qr_firmado_con_clave_diferente_a_session(self):
        """El QR usa QR_SECRET_KEY, no SECRET_KEY — no deben ser intercambiables."""
        qr_token = create_qr_token(USER_ID)
        with pytest.raises(JWTError):
            decode_access_token(qr_token)

    def test_qr_expirado_es_rechazado(self):
        from app.core.config import now_lima
        past = now_lima() - timedelta(minutes=2)
        with patch("app.core.security.now_lima", return_value=past):
            token = create_qr_token(USER_ID)
        with pytest.raises(JWTError):
            decode_qr_token(token)

    def test_qr_token_manipulado_es_rechazado(self):
        token = create_qr_token(USER_ID)
        corrupted = token[:-4] + "ZZZZ"
        with pytest.raises(JWTError):
            decode_qr_token(corrupted)
