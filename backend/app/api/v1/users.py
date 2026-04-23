from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
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

    model_config = {"from_attributes": True}


class UserStatsResponse(BaseModel):
    total_sesiones: int
    horas_totales: float
    sesiones_este_mes: int


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
    )


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
