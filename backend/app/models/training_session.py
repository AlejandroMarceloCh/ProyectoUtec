import enum
import uuid6
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Index, Integer, Uuid
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.core.config import now_lima


class ExitMethod(str, enum.Enum):
    manual = "manual"
    geofence_timeout = "geofence_timeout"
    auto_kill = "auto_kill"


class TrainingSession(Base):
    __tablename__ = "training_sessions"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid6.uuid7)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False)
    gym_id = Column(Uuid(as_uuid=True), ForeignKey("gym_config.id"), nullable=True)
    hora_entrada = Column(DateTime(timezone=True), default=now_lima, nullable=False)
    hora_salida = Column(DateTime(timezone=True), nullable=True)
    metodo_salida = Column(Enum(ExitMethod), nullable=True)
    # Guardado al cerrar la sesión; None si la sesión sigue activa
    puntos_otorgados = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=now_lima, nullable=False)

    user = relationship("User", back_populates="training_sessions")
    gym = relationship("GymConfig", back_populates="sessions")

    @property
    def duracion_efectiva(self) -> Optional[timedelta]:
        if self.hora_salida is None:
            return None
        return self.hora_salida - self.hora_entrada

    @property
    def duracion_minutos(self) -> Optional[int]:
        delta = self.duracion_efectiva
        if delta is None:
            return None
        return int(delta.total_seconds() // 60)

    @property
    def esta_activa(self) -> bool:
        return self.hora_salida is None

    __table_args__ = (
        # Índice parcial: acelera la query de ocupación actual (sesiones abiertas)
        Index(
            "ix_training_sessions_active",
            "hora_salida",
            postgresql_where=(hora_salida == None),  # noqa: E711
        ),
        # Historial del usuario ordenado por fecha descendente
        Index("ix_training_sessions_user_entrada", "user_id", "hora_entrada"),
        # Agregaciones del heatmap por gimnasio y fecha
        Index("ix_training_sessions_gym_entrada", "gym_id", "hora_entrada"),
    )
