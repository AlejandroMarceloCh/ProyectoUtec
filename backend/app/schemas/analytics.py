from typing import Optional
from pydantic import BaseModel


class HeatmapCell(BaseModel):
    """Una celda del heatmap: día × hora → valor promedio."""
    dia: int          # 0=Lunes … 6=Domingo
    hora: int         # 6 a 22 (6am a 10pm)
    valor: float      # Promedio de sesiones que iniciaron en este slot por semana
    intensidad: float # 0.0 (vacío) a 1.0 (máxima ocupación) — para el color del heatmap


class HeatmapResponse(BaseModel):
    cells: list[HeatmapCell]
    max_valor: float
    periodo_semanas: int
    total_sesiones_analizadas: int


class WeeklySlot(BaseModel):
    dia: int
    hora: int
    semana_actual: int        # Sesiones esta semana en este slot
    promedio_historico: float # Promedio de las semanas anteriores


class WeeklyComparisonResponse(BaseModel):
    slots: list[WeeklySlot]
    semana_actual_total: int
    promedio_historico_total: float


class FacultyRankingItem(BaseModel):
    rank: int
    faculty_id: str
    name: str
    code: str
    total_points: int
    logo_url: Optional[str] = None


class FacultyRankingResponse(BaseModel):
    ranking: list[FacultyRankingItem]
