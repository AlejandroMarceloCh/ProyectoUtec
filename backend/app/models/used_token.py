from sqlalchemy import Column, DateTime, ForeignKey, Index, String, Uuid
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.core.config import now_lima


class UsedToken(Base):
    """
    Blacklist de JTI (JWT ID) de tokens QR ya utilizados.
    Previene ataques de replay: un QR escaneado una vez no puede usarse de nuevo,
    incluso dentro del TTL de 30 segundos.
    """

    __tablename__ = "used_tokens"

    jti = Column(String(36), primary_key=True)  # UUID como string
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False)
    used_at = Column(DateTime(timezone=True), default=now_lima, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)  # Para limpiar registros viejos

    user = relationship("User", back_populates="used_tokens")

    __table_args__ = (
        Index("ix_used_tokens_expires_at", "expires_at"),
    )
