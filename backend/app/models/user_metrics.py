from sqlalchemy import Column, DateTime, Float, ForeignKey, String, Uuid

from app.db.base import Base


class UserMetrics(Base):
    """
    Cache de inferencias derivadas del historial del alumno (enfoque + frecuencia).
    Se actualiza por cron nocturno (3 AM Lima) y vía background-task en el cold-path
    del endpoint GET /routines/recommended.

    Schema minimal — las distribuciones de reps quedan in-memory para diagnóstico.
    """

    __tablename__ = "user_metrics"

    user_id             = Column(Uuid(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    enfoque_inferido    = Column(String(20), nullable=True)  # hipertrofia/fuerza/recomp/resistencia
    sesiones_por_semana = Column(Float, nullable=True)        # None si <7 días de actividad
    last_computed_at    = Column(DateTime(timezone=True), nullable=True)
