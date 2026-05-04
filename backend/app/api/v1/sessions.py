import logging
import math
import uuid
from datetime import timedelta
from zoneinfo import ZoneInfo

from app.core.config import LIMA_TZ

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import update
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from app.api.v1.deps import get_current_user, require_role
from app.core.config import now_lima, settings
from app.core.rate_limit import limiter
from app.core.scheduler import _calcular_puntos_base
from app.db.session import get_db
from app.models.faculty import Faculty
from app.models.gym_config import GymConfig
from app.models.qr_code import QRCode
from app.models.training_session import ExitMethod, TrainingSession
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

        # Streak: actualiza si la sesión es de un día nuevo
        # Si el último día de streak fue ayer → +1; si fue hoy → no cambia; si fue hace >1 día → reset a 1
        today = hora_salida.date()
        last = user.last_streak_day.date() if user.last_streak_day else None
        if last is None:
            user.current_streak = 1
        elif last == today:
            pass  # mismo día, no contar 2 veces
        elif (today - last).days == 1:
            user.current_streak += 1
        else:
            user.current_streak = 1
        user.last_streak_day = hora_salida
        if user.current_streak > user.max_streak:
            user.max_streak = user.current_streak

        # Invalida cache de métricas — el próximo GET /routines/recommended
        # las recalculará reflejando esta nueva sesión
        from app.models.user_metrics import UserMetrics
        m = db.query(UserMetrics).filter(UserMetrics.user_id == user.id).first()
        if m:
            m.last_computed_at = None  # fuerza cold path en próximo GET


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
        photo_url=user.photo_url,
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
    # Validación atómica: marca el QR como usado y devuelve user_id en una sola query.
    # Si el código no existe, ya fue usado, o expiró → no devuelve filas → 400.
    stmt = (
        update(QRCode)
        .where(
            QRCode.code == body.code,
            QRCode.used_at.is_(None),
            QRCode.expires_at > now_lima(),
        )
        .values(used_at=now_lima())
        .returning(QRCode.user_id)
    )
    result = db.execute(stmt).first()
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="QR inválido, expirado o ya utilizado. Genera uno nuevo.",
        )
    user_id = result[0]

    user = db.query(User).filter(
        User.id == user_id,
        User.is_active == True,
        User.deleted_at.is_(None),
    ).first()
    if not user:
        db.rollback()  # revertir el marcado del QR si el user no es válido
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
    db.query(GymConfig).filter(GymConfig.id == gym.id).with_for_update().first()
    ocupacion_actual = db.query(TrainingSession).filter(
        TrainingSession.gym_id == gym.id,
        TrainingSession.hora_salida.is_(None),
    ).count()

    if ocupacion_actual >= gym.capacity:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Aforo lleno ({ocupacion_actual}/{gym.capacity}). Espera a que alguien salga.",
        )

    session = TrainingSession(user_id=user.id, gym_id=gym.id)
    db.add(session)
    db.commit()
    db.refresh(session)

    new_occ = ocupacion_actual + 1
    logger.info(
        "checkin OK scanner=%s user=%s code=%s ocupacion=%d/%d",
        _scanner.email, user.email, body.code, new_occ, gym.capacity,
    )
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
def get_recent_checkins(
    limit: int = 5,
    db: Session = Depends(get_db),
    _staff: User = Depends(
        require_role(UserRole.admin_staff, UserRole.trainer, UserRole.utec_staff)
    ),
):
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


@router.get("/occupancy/by-faculty")
def get_occupancy_by_faculty(db: Session = Depends(get_db)):
    """Aforo desglosado por facultad — community/FOMO. Endpoint público.
    Devuelve: [{faculty_code, faculty_name, count}] ordenado por count desc."""
    from sqlalchemy import func
    gym = _get_active_gym(db)
    rows = (
        db.query(
            Faculty.code,
            Faculty.name,
            func.count(TrainingSession.id).label("count"),
        )
        .join(User, User.faculty_id == Faculty.id)
        .join(TrainingSession, TrainingSession.user_id == User.id)
        .filter(
            TrainingSession.gym_id == gym.id,
            TrainingSession.hora_salida.is_(None),
        )
        .group_by(Faculty.code, Faculty.name)
        .order_by(func.count(TrainingSession.id).desc())
        .all()
    )
    return {
        "gym_id": str(gym.id),
        "by_faculty": [
            {"faculty_code": code, "faculty_name": name, "count": count}
            for code, name, count in rows
        ],
    }


@router.get("/{session_id}")
def get_session_detail(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Detalle de una sesión. Solo el propio alumno o staff puede verla."""
    try:
        sid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="session_id inválido")

    session = db.query(TrainingSession).filter(TrainingSession.id == sid).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")

    is_staff = current_user.role in (UserRole.admin_staff, UserRole.trainer, UserRole.utec_staff)
    if not is_staff and session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sin acceso a esta sesión")

    return {
        "session": {
            "id": str(session.id),
            "hora_entrada": session.hora_entrada,
            "hora_salida": session.hora_salida,
            "duracion_minutos": session.duracion_minutos,
            "puntos_otorgados": session.puntos_otorgados,
            "metodo_salida": session.metodo_salida,
            "esta_activa": session.esta_activa,
            "ejercicios": [],
            "resumen_muscular": {},
        }
    }
