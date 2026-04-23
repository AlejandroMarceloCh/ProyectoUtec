import uuid6
from sqlalchemy import Boolean, Column, Float, Integer, String, Uuid
from sqlalchemy.orm import relationship

from app.db.base import Base


class GymConfig(Base):
    __tablename__ = "gym_config"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid6.uuid7)
    name = Column(String(120), default="UTEC Gym", nullable=False)
    capacity = Column(Integer, default=100, nullable=False)  # Aforo máximo (soft warning)
    location = Column(String(255), nullable=True)

    # Coordenadas para el geofence de checkout
    geofence_lat = Column(Float, nullable=True)
    geofence_lng = Column(Float, nullable=True)
    geofence_radius_m = Column(Integer, default=100, nullable=False)

    is_active = Column(Boolean, default=True, nullable=False)

    sessions = relationship("TrainingSession", back_populates="gym")
