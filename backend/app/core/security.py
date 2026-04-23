import uuid
from datetime import datetime, timedelta
from typing import Any

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings, now_lima

ALGORITHM = "HS256"
QR_TOKEN_TYPE = "gym_qr"
ACCESS_TOKEN_TYPE = "access"
REFRESH_TOKEN_TYPE = "refresh"


# ---------------------------------------------------------------------------
# Contraseñas
# ---------------------------------------------------------------------------

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


# ---------------------------------------------------------------------------
# JWT de sesión (login)
# ---------------------------------------------------------------------------

def create_access_token(user_id: str) -> str:
    now = now_lima()
    payload = {
        "sub": str(user_id),
        "type": ACCESS_TOKEN_TYPE,
        "iat": now,
        "exp": now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    now = now_lima()
    payload = {
        "sub": str(user_id),
        "type": REFRESH_TOKEN_TYPE,
        "iat": now,
        "exp": now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    """
    Decodifica y valida un access token.
    Lanza JWTError si el token es inválido, expirado o del tipo incorrecto.
    """
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    if payload.get("type") != ACCESS_TOKEN_TYPE:
        raise JWTError("Tipo de token incorrecto")
    return payload


def decode_refresh_token(token: str) -> dict[str, Any]:
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    if payload.get("type") != REFRESH_TOKEN_TYPE:
        raise JWTError("Tipo de token incorrecto")
    return payload


# ---------------------------------------------------------------------------
# Token QR dinámico (TTL 30s, anti-replay via jti)
# ---------------------------------------------------------------------------

def create_qr_token(user_id: str) -> str:
    """
    Genera el JWT que se codifica en el QR dinámico del usuario.
    Incluye un jti único para prevenir replay attacks.
    TTL: 30 segundos.
    """
    now = now_lima()
    jti = str(uuid.uuid4())
    payload = {
        "sub": str(user_id),
        "jti": jti,
        "type": QR_TOKEN_TYPE,
        "iat": now,
        "exp": now + timedelta(seconds=settings.QR_TOKEN_EXPIRE_SECONDS),
    }
    return jwt.encode(payload, settings.QR_SECRET_KEY, algorithm=ALGORITHM)


def decode_qr_token(token: str) -> dict[str, Any]:
    """
    Decodifica y valida un token QR.
    Verifica firma, expiración y tipo.
    NO verifica si el jti ya fue usado — eso lo hace el endpoint de check-in
    consultando la tabla used_tokens.

    Lanza JWTError si el token es inválido o expirado.
    """
    payload = jwt.decode(token, settings.QR_SECRET_KEY, algorithms=[ALGORITHM])
    if payload.get("type") != QR_TOKEN_TYPE:
        raise JWTError("El token no es un QR de acceso al gym")
    if "jti" not in payload:
        raise JWTError("El token no contiene un identificador único (jti)")
    return payload
