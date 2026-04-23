import re
import uuid6
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, Uuid
from sqlalchemy.orm import relationship, validates

from app.db.base import Base
from app.core.config import now_lima

import enum


VALID_EMAIL_DOMAINS = re.compile(r"^[^@]+@(utec\.edu\.pe|utec\.pe)$")


class UserRole(str, enum.Enum):
    student = "student"
    trainer = "trainer"
    utec_staff = "utec_staff"
    admin_staff = "admin_staff"


class User(Base):
    __tablename__ = "users"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid6.uuid7)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(120), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.student)
    faculty_id = Column(Uuid(as_uuid=True), ForeignKey("faculties.id"), nullable=True)
    points = Column(Integer, default=0, nullable=False)
    push_token = Column(String(255), nullable=True)  # Expo push notification token
    is_active = Column(Boolean, default=True, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=now_lima, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=now_lima, onupdate=now_lima, nullable=False)

    faculty = relationship("Faculty", back_populates="users")
    training_sessions = relationship("TrainingSession", back_populates="user")
    used_tokens = relationship("UsedToken", back_populates="user")

    @validates("email")
    def validate_email(self, key: str, value: str) -> str:
        if not VALID_EMAIL_DOMAINS.match(value.lower()):
            raise ValueError("El correo debe ser @utec.edu.pe o @utec.pe")
        return value.lower()

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None

    def soft_delete(self) -> None:
        self.deleted_at = now_lima()
        self.is_active = False
