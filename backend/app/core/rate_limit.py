"""Rate limiter compartido para los endpoints sensibles."""
from slowapi import Limiter
from slowapi.util import get_remote_address


def _client_key(request) -> str:
    """Clave por IP, honrando X-Forwarded-For detrás del proxy."""
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return get_remote_address(request)


limiter = Limiter(key_func=_client_key, headers_enabled=False)
