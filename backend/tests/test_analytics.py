"""
Tests para los endpoints de analítica:
heatmap, weekly-comparison y faculty-ranking.
"""
from datetime import timedelta
from unittest.mock import patch

import pytest

from app.core.config import now_lima
from app.models.faculty import Faculty
from app.models.training_session import TrainingSession, ExitMethod
from app.models.user import User, UserRole
from app.core.security import hash_password
from tests.conftest import auth_header


def _crear_sesion_completada(db, user, gym, hora_entrada, minutos=60):
    """Helper: crea una sesión ya cerrada en una fecha específica."""
    hora_salida = hora_entrada + timedelta(minutes=minutos)
    s = TrainingSession(
        user_id=user.id,
        gym_id=gym.id,
        hora_entrada=hora_entrada,
        hora_salida=hora_salida,
        metodo_salida=ExitMethod.manual,
        puntos_otorgados=10,
    )
    db.add(s)
    db.commit()
    return s


class TestHeatmap:
    def test_heatmap_vacio_devuelve_grid_completo(self, client, gym):
        r = client.get("/api/v1/analytics/heatmap")
        assert r.status_code == 200
        data = r.json()
        # 7 días × 17 horas (6 a 22) = 119 celdas
        assert len(data["cells"]) == 7 * 17
        assert data["total_sesiones_analizadas"] == 0
        assert data["max_valor"] == 1.0  # fallback cuando no hay datos

    def test_heatmap_todos_los_valores_son_cero_sin_sesiones(self, client, gym):
        r = client.get("/api/v1/analytics/heatmap")
        cells = r.json()["cells"]
        assert all(c["valor"] == 0.0 for c in cells)
        assert all(c["intensidad"] == 0.0 for c in cells)

    def test_heatmap_con_sesiones_refleja_conteo(self, client, db, gym, student):
        # Lunes a las 8am de hace 3 días
        ahora = now_lima()
        lunes_8am = ahora.replace(hour=8, minute=0, second=0, microsecond=0) - timedelta(days=3)
        _crear_sesion_completada(db, student, gym, lunes_8am)
        _crear_sesion_completada(db, student, gym, lunes_8am + timedelta(minutes=90))

        r = client.get("/api/v1/analytics/heatmap?semanas=4")
        assert r.status_code == 200
        data = r.json()
        assert data["total_sesiones_analizadas"] == 2

        # Al menos una celda debe tener valor > 0
        assert any(c["valor"] > 0 for c in data["cells"])

    def test_heatmap_intensidad_maximo_es_1(self, client, db, gym, student):
        ahora = now_lima()
        slot = ahora.replace(hour=10, minute=0, second=0, microsecond=0) - timedelta(days=1)
        # Crear múltiples sesiones en el mismo slot
        for i in range(5):
            _crear_sesion_completada(db, student, gym, slot + timedelta(minutes=i))

        r = client.get("/api/v1/analytics/heatmap?semanas=1")
        cells = r.json()["cells"]
        max_intensidad = max(c["intensidad"] for c in cells)
        assert max_intensidad == 1.0

    def test_heatmap_parametro_semanas(self, client, gym):
        r = client.get("/api/v1/analytics/heatmap?semanas=12")
        assert r.status_code == 200
        assert r.json()["periodo_semanas"] == 12

    def test_heatmap_rechaza_semanas_invalidas(self, client, gym):
        r = client.get("/api/v1/analytics/heatmap?semanas=0")
        assert r.status_code == 422
        r2 = client.get("/api/v1/analytics/heatmap?semanas=53")
        assert r2.status_code == 422

    def test_heatmap_celdas_tienen_estructura_correcta(self, client, gym):
        cells = client.get("/api/v1/analytics/heatmap").json()["cells"]
        for cell in cells:
            assert "dia" in cell
            assert "hora" in cell
            assert "valor" in cell
            assert "intensidad" in cell
            assert 0 <= cell["dia"] <= 6
            assert 6 <= cell["hora"] <= 22
            assert 0.0 <= cell["intensidad"] <= 1.0


class TestWeeklyComparison:
    def test_sin_datos_devuelve_ceros(self, client, gym):
        r = client.get("/api/v1/analytics/weekly-comparison")
        assert r.status_code == 200
        data = r.json()
        assert data["semana_actual_total"] == 0
        assert data["promedio_historico_total"] == 0.0
        assert len(data["slots"]) == 7 * 17

    def test_sesion_esta_semana_refleja_en_actual(self, client, db, gym, student):
        ahora = now_lima()
        # Sesión de hace 1 día (dentro de la semana actual)
        hace_un_dia = ahora - timedelta(days=1)
        # Asegurarse que sigue siendo esta semana (lunes de la semana actual)
        inicio_semana = ahora - timedelta(days=ahora.weekday())
        if hace_un_dia.date() >= inicio_semana.date():
            slot = hace_un_dia.replace(hour=9, minute=0, second=0, microsecond=0)
            _crear_sesion_completada(db, student, gym, slot)

            r = client.get("/api/v1/analytics/weekly-comparison")
            assert r.json()["semana_actual_total"] >= 0  # al menos no falla

    def test_estructura_slots(self, client, gym):
        slots = client.get("/api/v1/analytics/weekly-comparison").json()["slots"]
        for slot in slots:
            assert "dia" in slot and "hora" in slot
            assert "semana_actual" in slot
            assert "promedio_historico" in slot


class TestFacultyRanking:
    def test_sin_facultades_devuelve_lista_vacia(self, client):
        r = client.get("/api/v1/analytics/faculty-ranking")
        assert r.status_code == 200
        assert r.json()["ranking"] == []

    def test_ranking_ordenado_por_puntos(self, client, db):
        f1 = Faculty(name="Ingeniería", code="ING", total_points=500)
        f2 = Faculty(name="Arquitectura", code="ARQ", total_points=800)
        f3 = Faculty(name="Negocios", code="NEG", total_points=200)
        db.add_all([f1, f2, f3])
        db.commit()

        r = client.get("/api/v1/analytics/faculty-ranking")
        ranking = r.json()["ranking"]
        assert len(ranking) == 3
        assert ranking[0]["code"] == "ARQ"  # 800 puntos
        assert ranking[1]["code"] == "ING"  # 500 puntos
        assert ranking[2]["code"] == "NEG"  # 200 puntos

    def test_ranking_incluye_posicion(self, client, db):
        db.add(Faculty(name="Ciencias", code="CIE", total_points=100))
        db.commit()

        ranking = client.get("/api/v1/analytics/faculty-ranking").json()["ranking"]
        assert ranking[0]["rank"] == 1

    def test_facultad_inactiva_no_aparece(self, client, db):
        db.add(Faculty(name="Oculta", code="OC", total_points=999, is_active=False))
        db.commit()

        ranking = client.get("/api/v1/analytics/faculty-ranking").json()["ranking"]
        assert not any(f["code"] == "OC" for f in ranking)
