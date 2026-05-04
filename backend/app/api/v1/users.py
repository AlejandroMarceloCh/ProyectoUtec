import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user, require_role
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.training_session import TrainingSession

from app.models.faculty import Faculty

router = APIRouter(prefix="/users", tags=["users"])


class FacultyOption(BaseModel):
    id: str
    name: str
    code: str


class UserMeResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    faculty_id: Optional[str]
    points: int
    preferred_days_per_week: Optional[int] = None
    preferred_minutes_per_session: Optional[int] = None
    sexo: Optional[str] = None
    current_streak: int = 0
    max_streak: int = 0

    model_config = {"from_attributes": True}


class UpdatePreferencesRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    preferred_days_per_week: Optional[int] = Field(None, ge=2, le=6)
    preferred_minutes_per_session: Optional[int] = Field(None, ge=20, le=180)
    sexo: Optional[str] = Field(None, pattern="^(M|F|Otro)$")


class UserStatsResponse(BaseModel):
    total_sesiones: int
    horas_totales: float
    sesiones_este_mes: int


class UserRankingResponse(BaseModel):
    posicion: int
    total_usuarios: int


@router.get("/faculties", response_model=list[FacultyOption])
def list_faculties(db: Session = Depends(get_db)):
    """Lista pública de facultades para el selector de registro."""
    faculties = db.query(Faculty).filter(Faculty.is_active == True).order_by(Faculty.name).all()
    return [FacultyOption(id=str(f.id), name=f.name, code=f.code) for f in faculties]


@router.get("/me", response_model=UserMeResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserMeResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role.value,
        faculty_id=str(current_user.faculty_id) if current_user.faculty_id else None,
        points=current_user.points,
        preferred_days_per_week=current_user.preferred_days_per_week,
        preferred_minutes_per_session=current_user.preferred_minutes_per_session,
        sexo=current_user.sexo,
        current_streak=current_user.current_streak,
        max_streak=current_user.max_streak,
    )


@router.patch("/me/preferences")
def update_preferences(
    body: UpdatePreferencesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Actualiza preferencias de horario del alumno. Campos individualmente opcionales."""
    if body.preferred_days_per_week is not None:
        current_user.preferred_days_per_week = body.preferred_days_per_week
    if body.preferred_minutes_per_session is not None:
        current_user.preferred_minutes_per_session = body.preferred_minutes_per_session
    if body.sexo is not None:
        current_user.sexo = body.sexo
    db.commit()
    return {
        "status": "ok",
        "preferred_days_per_week": current_user.preferred_days_per_week,
        "preferred_minutes_per_session": current_user.preferred_minutes_per_session,
        "sexo": current_user.sexo,
    }


@router.get("/me/stats", response_model=UserStatsResponse)
def get_my_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from datetime import datetime, timedelta
    from app.core.config import now_lima

    sessions = db.query(TrainingSession).filter(
        TrainingSession.user_id == current_user.id,
        TrainingSession.hora_salida.is_not(None),
    ).all()

    total_minutos = sum(s.duracion_minutos or 0 for s in sessions)

    from app.core.config import LIMA_TZ
    inicio_mes = now_lima().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    sesiones_mes = sum(
        1 for s in sessions
        if (s.hora_entrada if s.hora_entrada.tzinfo else s.hora_entrada.replace(tzinfo=LIMA_TZ)) >= inicio_mes
    )

    return UserStatsResponse(
        total_sesiones=len(sessions),
        horas_totales=round(total_minutos / 60, 1),
        sesiones_este_mes=sesiones_mes,
    )


@router.get("/me/ranking", response_model=UserRankingResponse)
def get_my_ranking(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Posición del usuario en el ranking global por puntos (estudiantes solo)."""
    total_students = db.query(User).filter(
        User.role == UserRole.student,
        User.deleted_at.is_(None),
    ).count()

    better_than_me = db.query(User).filter(
        User.role == UserRole.student,
        User.deleted_at.is_(None),
        User.points > current_user.points,
    ).count()

    posicion = better_than_me + 1
    return UserRankingResponse(posicion=posicion, total_usuarios=total_students)


@router.get("/{user_id}")
def get_user_detail(
    user_id: str,
    db: Session = Depends(get_db),
    _staff: User = Depends(
        require_role(UserRole.admin_staff, UserRole.trainer, UserRole.utec_staff)
    ),
):
    """Detalle de un alumno para la interfaz de recepción. Solo staff."""
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="user_id inválido")

    user = db.query(User).filter(User.id == uid, User.deleted_at.is_(None)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    faculty = db.query(Faculty).filter(Faculty.id == user.faculty_id).first() if user.faculty_id else None

    sessions = (
        db.query(TrainingSession)
        .filter(TrainingSession.user_id == uid)
        .order_by(TrainingSession.hora_entrada.desc())
        .limit(5)
        .all()
    )

    return {
        "user": {
            "full_name": user.full_name,
            "email": user.email,
            "faculty_name": faculty.name if faculty else None,
            "faculty_code": faculty.code if faculty else None,
            "points": user.points,
            "is_blocked": not user.is_active,
            "total_sessions": db.query(TrainingSession).filter(TrainingSession.user_id == uid).count(),
            "recent_entries": [
                {
                    "hora_entrada": s.hora_entrada,
                    "hora_salida": s.hora_salida,
                    "esta_activa": s.esta_activa,
                }
                for s in sessions
            ],
        }
    }
