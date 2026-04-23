"""
Endpoints de analítica:
- GET /analytics/heatmap          → grid día×hora con intensidad de afluencia
- GET /analytics/weekly-comparison → semana actual vs. promedio histórico
- GET /analytics/faculty-ranking   → ranking de facultades por puntos
"""
from collections import Counter, defaultdict
from datetime import date, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.v1.deps import require_role
from app.core.config import LIMA_TZ, now_lima
from app.db.session import get_db
from app.models.faculty import Faculty
from app.models.training_session import TrainingSession
from app.models.user import User, UserRole
from app.schemas.analytics import (
    FacultyRankingItem,
    FacultyRankingResponse,
    HeatmapCell,
    HeatmapResponse,
    WeeklyComparisonResponse,
    WeeklySlot,
)

router = APIRouter(prefix="/analytics", tags=["analytics"])

HORAS_GYM = range(6, 23)   # 6am a 10pm (17 slots)
DIAS_SEMANA = range(7)      # 0=Lunes … 6=Domingo (weekday())


def _hora_entrada_aware(session: TrainingSession):
    """Devuelve hora_entrada timezone-aware, normalizando si SQLite la devolvió naive."""
    h = session.hora_entrada
    if h.tzinfo is None:
        return h.replace(tzinfo=LIMA_TZ)
    return h


def _fetch_sessions_range(db: Session, desde, hasta) -> list[TrainingSession]:
    return (
        db.query(TrainingSession)
        .filter(
            TrainingSession.hora_entrada >= desde,
            TrainingSession.hora_entrada < hasta,
            TrainingSession.hora_salida.is_not(None),
        )
        .all()
    )


# ---------------------------------------------------------------------------
# GET /analytics/heatmap
# ---------------------------------------------------------------------------

@router.get("/heatmap", response_model=HeatmapResponse)
def get_heatmap(
    semanas: int = Query(default=4, ge=1, le=52, description="Semanas de historial a analizar"),
    db: Session = Depends(get_db),
):
    """
    Devuelve un grid 7×17 (día × hora) con el promedio de sesiones por slot.
    La intensidad (0.0–1.0) está lista para mapear a colores en el frontend.
    Solo cuenta sesiones completadas (con hora_salida).
    """
    cutoff = now_lima() - timedelta(weeks=semanas)
    sessions = _fetch_sessions_range(db, cutoff, now_lima())

    # Contar sesiones por (dia_semana, hora)
    slot_counter: Counter = Counter()
    for s in sessions:
        entrada = _hora_entrada_aware(s)
        dia = entrada.weekday()   # 0=Lunes, 6=Domingo
        hora = entrada.hour
        if hora in HORAS_GYM:
            slot_counter[(dia, hora)] += 1

    # Promedio por semana para cada slot
    cells: list[HeatmapCell] = []
    for dia in DIAS_SEMANA:
        for hora in HORAS_GYM:
            total = slot_counter.get((dia, hora), 0)
            valor = round(total / semanas, 2)
            cells.append(HeatmapCell(dia=dia, hora=hora, valor=valor, intensidad=0.0))

    # Normalizar intensidad respecto al slot más concurrido
    max_valor = max((c.valor for c in cells), default=1.0) or 1.0
    for cell in cells:
        cell.intensidad = round(cell.valor / max_valor, 4)

    return HeatmapResponse(
        cells=cells,
        max_valor=max_valor,
        periodo_semanas=semanas,
        total_sesiones_analizadas=len(sessions),
    )


# ---------------------------------------------------------------------------
# GET /analytics/weekly-comparison
# ---------------------------------------------------------------------------

@router.get("/weekly-comparison", response_model=WeeklyComparisonResponse)
def get_weekly_comparison(
    semanas_historico: int = Query(default=4, ge=1, le=52),
    db: Session = Depends(get_db),
):
    """
    Compara la semana actual contra el promedio de las N semanas anteriores.
    Útil para mostrar en el dashboard si esta semana está más o menos concurrida
    que lo habitual.
    """
    ahora = now_lima()
    # Lunes de esta semana a las 00:00
    inicio_semana_actual = (ahora - timedelta(days=ahora.weekday())).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    inicio_historico = inicio_semana_actual - timedelta(weeks=semanas_historico)

    sesiones_actuales = _fetch_sessions_range(db, inicio_semana_actual, ahora)
    sesiones_historicas = _fetch_sessions_range(db, inicio_historico, inicio_semana_actual)

    # Contar semana actual
    actual_counter: Counter = Counter()
    for s in sesiones_actuales:
        entrada = _hora_entrada_aware(s)
        dia = entrada.weekday()
        hora = entrada.hour
        if hora in HORAS_GYM:
            actual_counter[(dia, hora)] += 1

    # Promediar historial
    hist_counter: Counter = Counter()
    for s in sesiones_historicas:
        entrada = _hora_entrada_aware(s)
        dia = entrada.weekday()
        hora = entrada.hour
        if hora in HORAS_GYM:
            hist_counter[(dia, hora)] += 1

    slots: list[WeeklySlot] = []
    for dia in DIAS_SEMANA:
        for hora in HORAS_GYM:
            slots.append(WeeklySlot(
                dia=dia,
                hora=hora,
                semana_actual=actual_counter.get((dia, hora), 0),
                promedio_historico=round(
                    hist_counter.get((dia, hora), 0) / semanas_historico, 2
                ),
            ))

    return WeeklyComparisonResponse(
        slots=slots,
        semana_actual_total=len(sesiones_actuales),
        promedio_historico_total=round(len(sesiones_historicas) / semanas_historico, 1),
    )


# ---------------------------------------------------------------------------
# GET /analytics/faculty-ranking
# ---------------------------------------------------------------------------

@router.get("/faculty-ranking", response_model=FacultyRankingResponse)
def get_faculty_ranking(db: Session = Depends(get_db)):
    """Ranking de facultades por puntos acumulados. Público."""
    faculties = (
        db.query(Faculty)
        .filter(Faculty.is_active == True)
        .order_by(Faculty.total_points.desc())
        .all()
    )

    ranking = [
        FacultyRankingItem(
            rank=i + 1,
            faculty_id=str(f.id),
            name=f.name,
            code=f.code,
            total_points=f.total_points,
            logo_url=f.logo_url,
        )
        for i, f in enumerate(faculties)
    ]

    return FacultyRankingResponse(ranking=ranking)
