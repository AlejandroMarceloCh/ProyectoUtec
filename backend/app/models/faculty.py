import uuid6
from sqlalchemy import Boolean, Column, Integer, String, Uuid
from sqlalchemy.orm import relationship

from app.db.base import Base


class Faculty(Base):
    __tablename__ = "faculties"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid6.uuid7)
    name = Column(String(120), nullable=False)
    code = Column(String(10), unique=True, nullable=False)
    # Prefijo del correo para auto-inferencia (ej: todos los @utec.edu.pe son inferidos por código de alumno)
    email_prefix = Column(String(20), nullable=True)
    total_points = Column(Integer, default=0, nullable=False)
    logo_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    users = relationship("User", back_populates="faculty")
