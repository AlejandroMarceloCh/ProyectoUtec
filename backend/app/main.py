import logging
import uuid
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.core.rate_limit import limiter
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.db.seed import seed_gym_if_empty, seed_faculties_if_empty
from app.core.scheduler import start_scheduler, stop_scheduler

# Registrar todos los modelos antes de create_all()
import app.models  # noqa: F401

from app.api.v1 import auth, qr, sessions, analytics, users

logger = logging.getLogger("uvicorn.error")


def _cors_headers(request: Request) -> dict[str, str]:
    """Cabeceras CORS para respuestas que no pasan por el middleware (p. ej. 500 sin body JSON)."""
    origin = request.headers.get("origin")
    allowed = settings.cors_origins_list
    if origin and (origin in allowed or not settings.is_production):
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
            "Vary": "Origin",
        }
    return {}


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    if settings.is_production:
        from alembic.config import Config
        from alembic import command
        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")
    else:
        Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_gym_if_empty(db)
        seed_faculties_if_empty(db)
    finally:
        db.close()
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(
    title="UTEC Gym API",
    description="Backend para el control de acceso y afluencia del gimnasio UTEC",
    version="1.0.0",
    lifespan=lifespan,
)

# Rate limiter global
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=settings.cors_origin_regex_effective,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or uuid.uuid4().hex[:16]
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["x-request-id"] = request_id
    return response


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={"detail": "Demasiadas solicitudes. Intenta de nuevo en unos segundos."},
        headers=_cors_headers(request),
    )


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    logger.exception("Database error")
    detail = (
        "Error de base de datos. ¿Está PostgreSQL corriendo y DATABASE_URL correcto? "
        "(ej. docker compose up db)"
    )
    if not settings.is_production:
        detail = f"{detail} Detalle: {exc!s}"
    return JSONResponse(
        status_code=503,
        content={"detail": detail},
        headers=_cors_headers(request),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    if isinstance(exc, RequestValidationError):
        return await request_validation_exception_handler(request, exc)

    logger.exception("Unhandled error")
    detail = "Error interno del servidor"
    if not settings.is_production:
        detail = f"{detail}: {exc!s}"
    return JSONResponse(
        status_code=500,
        content={"detail": detail},
        headers=_cors_headers(request),
    )

app.include_router(auth.router, prefix="/api/v1")
app.include_router(qr.router, prefix="/api/v1")
app.include_router(sessions.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")


@app.get("/health", tags=["health"])
def health_check() -> dict:
    return {"status": "ok", "service": "utec-gym-api"}


@app.get("/ready", tags=["health"])
def readiness_check() -> dict:
    """Readiness: verifica que la BD responde (para load balancer / k8s)."""
    from sqlalchemy import text
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ready"}
    finally:
        db.close()
