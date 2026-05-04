import re
from typing import Optional, Any
from pydantic import BaseModel, field_validator

VALID_DOMAINS = re.compile(r"^[^@]+@(utec\.edu\.pe|utec\.pe)$")


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    faculty_id: Optional[str] = None
    # Preferencias del alumno (opcionales — completables después en perfil)
    preferred_days_per_week: Optional[int] = None
    preferred_minutes_per_session: Optional[int] = None
    sexo: Optional[str] = None

    @field_validator("email")
    @classmethod
    def validate_utec_email(cls, v: str) -> str:
        v = v.lower().strip()
        if not VALID_DOMAINS.match(v):
            raise ValueError("El correo debe ser @utec.edu.pe o @utec.pe")
        return v

    @field_validator("password")
    @classmethod
    def validate_password_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres")
        return v


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: Optional[dict[str, Any]] = None


class RefreshRequest(BaseModel):
    refresh_token: str
