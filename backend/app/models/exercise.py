import uuid6
from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String, Uuid
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.core.config import now_lima


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid6.uuid7)
    nombre = Column(String, nullable=False, unique=True)
    grupo_primario = Column(String, nullable=False)
    grupos_secundarios = Column(ARRAY(String), nullable=False, default=list)
    equipamiento = Column(String, nullable=False)


class Routine(Base):
    __tablename__ = "routines"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid6.uuid7)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False)
    dias_semana = Column(Integer, nullable=False)
    sexo = Column(String, nullable=False)
    enfoque = Column(String, nullable=False)
    plan_json = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=now_lima, nullable=False)

    __table_args__ = (
        Index("ix_routines_user_created", "user_id", "created_at"),
    )


class ExerciseLog(Base):
    __tablename__ = "exercise_logs"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid6.uuid7)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False)
    session_id = Column(Uuid(as_uuid=True), ForeignKey("training_sessions.id"), nullable=True)
    nombre = Column(String, nullable=False)
    grupo_primario = Column(String, nullable=False)
    grupos_secundarios = Column(ARRAY(String), nullable=False, default=list)
    series = Column(Integer, nullable=False)
    reps = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=now_lima, nullable=False)

    __table_args__ = (
        Index("ix_exercise_logs_user_created", "user_id", "created_at"),
    )
