from sqlalchemy import Column, DateTime, ForeignKey, Index, String, Uuid
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.core.config import now_lima


class QRCode(Base):
    """
    Códigos QR opacos de un solo uso para check-in al gym.
    Reemplaza al JWT denso anterior — el código es un NanoID corto guardado
    en DB con TTL. Validación atómica vía UPDATE...RETURNING en checkin.
    """

    __tablename__ = "qr_codes"

    code = Column(String(24), primary_key=True)  # NanoID 21 chars
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=now_lima, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="qr_codes")

    __table_args__ = (
        Index("ix_qr_codes_expires_at", "expires_at"),
    )
