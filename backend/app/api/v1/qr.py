from fastapi import APIRouter, Depends

from app.api.v1.deps import get_current_user
from app.core.security import create_qr_token
from app.models.user import User

router = APIRouter(prefix="/qr", tags=["qr"])


@router.get("/generate")
def generate_qr(current_user: User = Depends(get_current_user)) -> dict:
    """
    Genera un token JWT de 30 segundos para que el alumno muestre su QR.
    La app llama a este endpoint cada 25 segundos para mantener el QR fresco.
    """
    token = create_qr_token(str(current_user.id))
    return {
        "qr_token": token,
        "ttl_seconds": 30,
        "user_id": str(current_user.id),
        "full_name": current_user.full_name,
    }
