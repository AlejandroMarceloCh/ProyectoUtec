from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from app.models.training_session import ExitMethod


class CheckinRequest(BaseModel):
    code: str
    # Coords del lector (recepción) — opcionales; si el gym tiene geofence
    # configurado se valida que el escaneo ocurra dentro del radio.
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class CheckoutRequest(BaseModel):
    method: ExitMethod
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class UserProfile(BaseModel):
    """Perfil mínimo del alumno — visible para la recepción tras escaneo."""
    id: str
    full_name: str
    email: str
    role: str
    faculty_name: Optional[str] = None
    faculty_code: Optional[str] = None
    points: int = 0
    photo_url: Optional[str] = None


class CheckinResponse(BaseModel):
    """Respuesta completa del check-in: sesión + perfil del usuario."""
    status: str = "ok"
    usuario: UserProfile
    sesion: "SessionResponse"
    ocupacion_actual: int
    capacidad: int
    alerta_aforo: bool


class SessionResponse(BaseModel):
    id: str
    user_id: str
    hora_entrada: datetime
    hora_salida: Optional[datetime] = None
    metodo_salida: Optional[ExitMethod] = None
    duracion_minutos: Optional[int] = None
    puntos_otorgados: Optional[int] = None
    esta_activa: bool

    model_config = {"from_attributes": True}


class ActiveSessionResponse(BaseModel):
    tiene_sesion_activa: bool
    sesion: Optional[SessionResponse] = None


class OccupancyResponse(BaseModel):
    ocupacion_actual: int
    capacidad: int
    porcentaje: float
    alerta_aforo: bool
