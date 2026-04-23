import math
import uuid
from datetime import timedelta
from zoneinfo import ZoneInfo

from app.core.config import LIMA_TZ

from fastapi import APIRouter, Depends, HTTPException, Request, status
from jose import JWTError
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user, require_role
from app.core.config import now_lima, settings
from app.core.rate_limit import limiter
from app.core.security import decode_qr_token
from app.core.scheduler import _calcular_puntos_base
from app.db.session import get_db
from app.models.faculty import Faculty
from app.models.gym_config import GymConfig
from app.models.training_session import ExitMethod, TrainingSession
from app.models.used_token import UsedToken
from app.models.user import User, UserRole
from app.schemas.session import (
    ActiveSessionResponse,
    CheckinRequest,
    CheckinResponse,
    CheckoutRequest,
    OccupancyResponse,
    SessionResponse,
    UserProfile,
)

router = APIRouter(prefix="/sessions", tags=["sessions"])

# Radio de la Tierra en km (para validación del geofence en el servidor)
EARTH_RADIUS_KM = 6371.0


def _haversine_distance_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Distancia en metros entre dos coordenadas GPS."""
    import math
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return EARTH_RADIUS_KM * 2 * math.asin(math.sqrt(a)) * 1000


def _get_active_gym(db: Session) -> GymConfig:
    gym = db.query(GymConfig).filter(GymConfig.is_active == True).first()
    if not gym:
        raise HTTPException(status_code=503, detail="Configuración del gym no disponible")
    return gym


def _get_active_session(user_id, db: Session) -> TrainingSession | None:
    return db.query(TrainingSession).filter(
        TrainingSession.user_id == user_id,
        TrainingSession.hora_salida.is_(None),
    ).first()


def _close_session(
    session: TrainingSession,
    method: ExitMethod,
    db: Session,
) -> None:
    """Cierra una sesión, calcula y persiste los puntos. Reutilizado por checkout y auto-kill."""
    hora_salida = now_lima()
    session.hora_salida = hora_salida
    session.metodo_salida = method

    # Normalizar hora_entrada a aware si SQLite la devolvió naive
    hora_entrada = session.hora_entrada
    if hora_entrada.tzinfo is None:
        hora_entrada = hora_entrada.replace(tzinfo=LIMA_TZ)

    minutos = int((hora_salida - hora_entrada).total_seconds() // 60)
    puntos_base = _calcular_puntos_base(minutos)

    if method == ExitMethod.auto_kill:
        session.puntos_otorgados = int(puntos_base * 0.80)
    else:
        session.puntos_otorgados = puntos_base

    # Actualizar puntos solo si el usuario es estudiante
    user: User = db.query(User).filter(User.id == session.user_id).first()
    if user and user.role == UserRole.student and session.puntos_otorgados > 0:
        user.points += session.puntos_otorgados
        if user.faculty_id:
            faculty: Faculty = db.query(Faculty).filter(Faculty.id == user.faculty_id).first()
            if faculty:
                faculty.total_points += session.puntos_otorgados


# ---------------------------------------------------------------------------
# POST /sessions/checkin
# ---------------------------------------------------------------------------

def _build_user_profile(user: User, db: Session) -> UserProfile:
    faculty = db.query(Faculty).filter(Faculty.id == user.faculty_id).first() if user.faculty_id else None
    return UserProfile(
        id=str(user.id),
        full_name=user.full_name,
        email=user.email,
        role=user.role.value,
        faculty_name=faculty.name if faculty else None,
        faculty_code=faculty.code if faculty else None,
        points=user.points,
    )


@router.post("/checkin", response_model=CheckinResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(settings.RATE_LIMIT_CHECKIN)
def checkin(
    request: Request,
    body: CheckinRequest,
    db: Session = Depends(get_db),
    _scanner: User = Depends(
        require_role(UserRole.admin_staff, UserRole.trainer, UserRole.utec_staff)
    ),
):
    try:
        payload = decode_qr_token(body.qr_token)
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"QR inválido o expirado: {exc}",
        )

    user_id = uuid.UUID(payload["sub"])
    jti = payload["jti"]

    already_used = db.query(UsedToken).filter(UsedToken.jti == jti).first()
    if already_used:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este QR ya fue utilizado. Genera uno nuevo.",
        )

    user = db.query(User).filter(
        User.id == user_id,
        User.is_active == True,
        User.deleted_at.is_(None),
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    active = _get_active_session(user.id, db)
    if active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El usuario ya tiene una sesión activa en el gym.",
        )

    gym = _get_active_gym(db)

    # Validar que el escaneo ocurra dentro del radio del gym (si hay geofence).
    if gym.geofence_lat and gym.geofence_lng and body.latitude is not None and body.longitude is not None:
        distance_m = _haversine_distance_m(
            body.latitude, body.longitude, gym.geofence_lat, gym.geofence_lng
        )
        if distance_m > gym.geofence_radius_m:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"El escaneo está fuera del gym ({distance_m:.0f}m del centro, "
                    f"radio permitido {gym.geofence_radius_m}m)."
                ),
            )
    ocupacion_actual = db.query(TrainingSession).filter(
        TrainingSession.gym_id == gym.id,
        TrainingSession.hora_salida.is_(None),
    ).count()

    expires_at = now_lima() + timedelta(seconds=30)
    db.add(UsedToken(jti=jti, user_id=user.id, expires_at=expires_at))

    session = TrainingSession(user_id=user.id, gym_id=gym.id)
    db.add(session)
    db.commit()
    db.refresh(session)

    new_occ = ocupacion_actual + 1
    return CheckinResponse(
        status="ok",
        usuario=_build_user_profile(user, db),
        sesion=SessionResponse(
            id=str(session.id),
            user_id=str(session.user_id),
            hora_entrada=session.hora_entrada,
            hora_salida=session.hora_salida,
            metodo_salida=session.metodo_salida,
            duracion_minutos=session.duracion_minutos,
            puntos_otorgados=session.puntos_otorgados,
            esta_activa=session.esta_activa,
        ),
        ocupacion_actual=new_occ,
        capacidad=gym.capacity,
        alerta_aforo=new_occ >= gym.capacity * 0.8,
    )


# ---------------------------------------------------------------------------
# POST /sessions/checkout
# ---------------------------------------------------------------------------

@router.post("/checkout", response_model=SessionResponse)
def checkout(
    body: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cierra la sesión activa del usuario autenticado.
    Métodos: manual, geofence_timeout.
    (auto_kill es ejecutado solo por el scheduler, no por este endpoint)
    """
    if body.method == ExitMethod.auto_kill:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El método auto_kill es reservado para el sistema. Usa 'manual' o 'geofence_timeout'.",
        )

    session = _get_active_session(current_user.id, db)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No tienes una sesión activa en el gym.",
        )

    # Validar geofence en el servidor (doble verificación)
    if body.method == ExitMethod.geofence_timeout:
        if body.latitude is None or body.longitude is None:
            raise HTTPException(
                status_code=400,
                detail="Se requieren coordenadas (latitude, longitude) para el checkout por geofence.",
            )
        gym = _get_active_gym(db)
        if gym.geofence_lat and gym.geofence_lng:
            distance_m = _haversine_distance_m(
                body.latitude, body.longitude,
                gym.geofence_lat, gym.geofence_lng,
            )
            if distance_m <= gym.geofence_radius_m:
                raise HTTPException(
                    status_code=400,
                    detail=f"Sigues dentro del gym ({distance_m:.0f}m del centro). "
                           "El checkout por geofence requiere que hayas salido del área.",
                )

    _close_session(session, body.method, db)
    db.commit()
    db.refresh(session)

    return SessionResponse(
        id=str(session.id),
        user_id=str(session.user_id),
        hora_entrada=session.hora_entrada,
        hora_salida=session.hora_salida,
        metodo_salida=session.metodo_salida,
        duracion_minutos=session.duracion_minutos,
        puntos_otorgados=session.puntos_otorgados,
        esta_activa=session.esta_activa,
    )


# ---------------------------------------------------------------------------
# GET /sessions/me/active
# ---------------------------------------------------------------------------

@router.get("/me/active", response_model=ActiveSessionResponse)
def get_my_active_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = _get_active_session(current_user.id, db)
    if not session:
        return ActiveSessionResponse(tiene_sesion_activa=False)

    return ActiveSessionResponse(
        tiene_sesion_activa=True,
        sesion=SessionResponse(
            id=str(session.id),
            user_id=str(session.user_id),
            hora_entrada=session.hora_entrada,
            hora_salida=session.hora_salida,
            metodo_salida=session.metodo_salida,
            duracion_minutos=session.duracion_minutos,
            puntos_otorgados=session.puntos_otorgados,
            esta_activa=session.esta_activa,
        ),
    )


# ---------------------------------------------------------------------------
# GET /sessions/occupancy
# ---------------------------------------------------------------------------

@router.get("/me/history")
def get_my_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Historial de sesiones del usuario autenticado, ordenado por más reciente."""
    sessions = (
        db.query(TrainingSession)
        .filter(TrainingSession.user_id == current_user.id)
        .order_by(TrainingSession.hora_entrada.desc())
        .limit(50)
        .all()
    )
    return {
        "sessions": [
            SessionResponse(
                id=str(s.id),
                user_id=str(s.user_id),
                hora_entrada=s.hora_entrada,
                hora_salida=s.hora_salida,
                metodo_salida=s.metodo_salida,
                duracion_minutos=s.duracion_minutos,
                puntos_otorgados=s.puntos_otorgados,
                esta_activa=s.esta_activa,
            )
            for s in sessions
        ]
    }


@router.get("/recent")
def get_recent_checkins(limit: int = 5, db: Session = Depends(get_db)):
    """Últimos check-ins — público, sin auth. Lo pollea la pantalla /display."""
    limit = max(1, min(limit, 20))
    gym = _get_active_gym(db)

    rows = (
        db.query(TrainingSession)
        .filter(TrainingSession.gym_id == gym.id)
        .order_by(TrainingSession.hora_entrada.desc())
        .limit(limit)
        .all()
    )

    user_ids = [r.user_id for r in rows]
    users_by_id = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()}
    facs_by_id = {f.id: f for f in db.query(Faculty).all()}

    ocupacion = db.query(TrainingSession).filter(
        TrainingSession.gym_id == gym.id,
        TrainingSession.hora_salida.is_(None),
    ).count()

    items = []
    for s in rows:
        u = users_by_id.get(s.user_id)
        fac = facs_by_id.get(u.faculty_id) if u and u.faculty_id else None
        items.append({
            "session_id": str(s.id),
            "full_name": u.full_name if u else "—",
            "email": u.email if u else "",
            "faculty_code": fac.code if fac else None,
            "faculty_name": fac.name if fac else None,
            "points": u.points if u else 0,
            "hora_entrada": s.hora_entrada,
            "hora_salida": s.hora_salida,
            "esta_activa": s.hora_salida is None,
        })

    return {
        "items": items,
        "ocupacion_actual": ocupacion,
        "capacidad": gym.capacity,
    }


@router.get("/occupancy", response_model=OccupancyResponse)
def get_occupancy(db: Session = Depends(get_db)):
    """Ocupación actual del gym. Endpoint público (no requiere auth)."""
    gym = _get_active_gym(db)
    ocupacion = db.query(TrainingSession).filter(
        TrainingSession.gym_id == gym.id,
        TrainingSession.hora_salida.is_(None),
    ).count()

    porcentaje = round(ocupacion / gym.capacity * 100, 1) if gym.capacity else 0.0

    return OccupancyResponse(
        ocupacion_actual=ocupacion,
        capacidad=gym.capacity,
        porcentaje=porcentaje,
        alerta_aforo=porcentaje >= 80.0,
    )
