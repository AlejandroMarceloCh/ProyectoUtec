"""
Fixtures compartidos para todos los tests.
Usa SQLite en memoria — no requiere PostgreSQL corriendo.
"""
import pytest
import uuid6
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.gym_config import GymConfig
from app.models.user import User, UserRole
from app.core.security import hash_password, create_access_token


SQLITE_URL = "sqlite:///:memory:"

# StaticPool garantiza que todas las conexiones usen la misma DB en memoria
engine_test = create_engine(
    SQLITE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)


@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine_test)
    session = TestingSessionLocal()
    # Un gym por defecto ANTES de que arranque TestClient (lifespan seed),
    # así el seed no inserta el de producción (cap 100) y los tests son deterministas.
    session.add(
        GymConfig(
            name="UTEC Gym Test",
            capacity=10,
            geofence_lat=-12.0736,
            geofence_lng=-77.0820,
            geofence_radius_m=100,
        )
    )
    session.commit()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine_test)


@pytest.fixture(scope="function")
def client(db):
    from unittest.mock import patch

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    # Lifespan usa `engine` y `SessionLocal` importados en main — ambos deben apuntar a SQLite
    with (
        patch("app.main.engine", engine_test),
        patch("app.main.SessionLocal", TestingSessionLocal),
        patch("app.main.start_scheduler"),
        patch("app.main.stop_scheduler"),
    ):
        with TestClient(app, raise_server_exceptions=True) as c:
            yield c

    app.dependency_overrides.clear()


@pytest.fixture
def gym(db):
    """Mismo gym que inserta `db` (aforo 10)."""
    g = db.query(GymConfig).first()
    assert g is not None
    return g


@pytest.fixture
def student(db):
    """Usuario estudiante de prueba."""
    u = User(
        email="a20230001@utec.edu.pe",
        hashed_password=hash_password("password123"),
        full_name="Estudiante Test",
        role=UserRole.student,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@pytest.fixture
def scanner_user(db):
    """Usuario admin_staff que opera el escáner."""
    u = User(
        email="scanner@utec.pe",
        hashed_password=hash_password("password123"),
        full_name="Operador Scanner",
        role=UserRole.admin_staff,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@pytest.fixture
def student_token(student) -> str:
    return create_access_token(str(student.id))


@pytest.fixture
def scanner_token(scanner_user) -> str:
    return create_access_token(str(scanner_user.id))


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}
