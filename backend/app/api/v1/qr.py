from datetime import timedelta

from fastapi import APIRouter, Depends
from nanoid import generate
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user
from app.core.config import now_lima, settings
from app.db.session import get_db
from app.models.qr_code import QRCode
from app.models.user import User

router = APIRouter(prefix="/qr", tags=["qr"])


@router.get("/generate")
def generate_qr(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Genera un código opaco aleatorio (NanoID 21 chars) y lo persiste en
    `qr_codes` con TTL = QR_TOKEN_EXPIRE_SECONDS. El QR resultante en el
    móvil es Version 2 (25×25 módulos) — 5× menos denso que el JWT viejo,
    legible al instante por cualquier escáner CMOS de gama baja.

    La app móvil llama a este endpoint cada 25s para mantener el code fresco.
    """
    code = generate(size=21)
    expires_at = now_lima() + timedelta(seconds=settings.QR_TOKEN_EXPIRE_SECONDS)
    db.add(QRCode(code=code, user_id=current_user.id, expires_at=expires_at))
    db.commit()
    return {
        "code": code,
        "ttl_seconds": settings.QR_TOKEN_EXPIRE_SECONDS,
        "user_id": str(current_user.id),
        "full_name": current_user.full_name,
    }
