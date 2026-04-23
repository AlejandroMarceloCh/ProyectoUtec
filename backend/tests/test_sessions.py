"""Tests para los endpoints de check-in, check-out y ocupación."""
from unittest.mock import patch

import pytest

from app.core.security import create_qr_token
from app.core.config import now_lima
from tests.conftest import auth_header


class TestCheckin:
    def test_checkin_exitoso(self, client, gym, student, scanner_token):
        qr = create_qr_token(str(student.id))
        r = client.post(
            "/api/v1/sessions/checkin",
            json={"qr_token": qr},
            headers=auth_header(scanner_token),
        )
        assert r.status_code == 201
        data = r.json()
        assert data["esta_activa"] is True
        assert data["hora_salida"] is None
        assert data["user_id"] == str(student.id)

    def test_checkin_rechaza_qr_expirado(self, client, gym, student, scanner_token):
        from datetime import timedelta
        past = now_lima() - timedelta(minutes=2)
        with patch("app.core.security.now_lima", return_value=past):
            qr = create_qr_token(str(student.id))
        r = client.post(
            "/api/v1/sessions/checkin",
            json={"qr_token": qr},
            headers=auth_header(scanner_token),
        )
        assert r.status_code == 400
        assert "expirado" in r.json()["detail"].lower()

    def test_checkin_rechaza_replay_del_mismo_qr(self, client, gym, student, scanner_token):
        qr = create_qr_token(str(student.id))
        r1 = client.post(
            "/api/v1/sessions/checkin",
            json={"qr_token": qr},
            headers=auth_header(scanner_token),
        )
        assert r1.status_code == 201

        # Segundo intento con el mismo QR
        r2 = client.post(
            "/api/v1/sessions/checkin",
            json={"qr_token": qr},
            headers=auth_header(scanner_token),
        )
        assert r2.status_code == 409
        assert "ya fue utilizado" in r2.json()["detail"]

    def test_checkin_bloquea_sesion_concurrente(self, client, gym, student, scanner_token):
        qr1 = create_qr_token(str(student.id))
        client.post(
            "/api/v1/sessions/checkin",
            json={"qr_token": qr1},
            headers=auth_header(scanner_token),
        )
        qr2 = create_qr_token(str(student.id))
        r2 = client.post(
            "/api/v1/sessions/checkin",
            json={"qr_token": qr2},
            headers=auth_header(scanner_token),
        )
        assert r2.status_code == 409
        assert "sesión activa" in r2.json()["detail"]

    def test_checkin_requiere_rol_scanner(self, client, gym, student, student_token):
        """Un estudiante NO puede operar el escáner."""
        qr = create_qr_token(str(student.id))
        r = client.post(
            "/api/v1/sessions/checkin",
            json={"qr_token": qr},
            headers=auth_header(student_token),
        )
        assert r.status_code == 403

    def test_checkin_sin_auth_es_rechazado(self, client, gym, student):
        qr = create_qr_token(str(student.id))
        r = client.post("/api/v1/sessions/checkin", json={"qr_token": qr})
        assert r.status_code in (401, 403)  # Sin credentials → no autorizado


class TestCheckout:
    def _do_checkin(self, client, gym, student, scanner_token):
        qr = create_qr_token(str(student.id))
        client.post(
            "/api/v1/sessions/checkin",
            json={"qr_token": qr},
            headers=auth_header(scanner_token),
        )

    def test_checkout_manual_exitoso(self, client, gym, student, student_token, scanner_token):
        self._do_checkin(client, gym, student, scanner_token)
        r = client.post(
            "/api/v1/sessions/checkout",
            json={"method": "manual"},
            headers=auth_header(student_token),
        )
        assert r.status_code == 200
        data = r.json()
        assert data["esta_activa"] is False
        assert data["metodo_salida"] == "manual"
        assert data["hora_salida"] is not None
        assert data["puntos_otorgados"] is not None

    def test_checkout_sin_sesion_activa(self, client, gym, student, student_token):
        r = client.post(
            "/api/v1/sessions/checkout",
            json={"method": "manual"},
            headers=auth_header(student_token),
        )
        assert r.status_code == 404

    def test_checkout_auto_kill_es_rechazado_por_usuario(self, client, gym, student, student_token, scanner_token):
        self._do_checkin(client, gym, student, scanner_token)
        r = client.post(
            "/api/v1/sessions/checkout",
            json={"method": "auto_kill"},
            headers=auth_header(student_token),
        )
        assert r.status_code == 400

    def test_checkout_geofence_requiere_coordenadas(self, client, gym, student, student_token, scanner_token):
        self._do_checkin(client, gym, student, scanner_token)
        r = client.post(
            "/api/v1/sessions/checkout",
            json={"method": "geofence_timeout"},
            headers=auth_header(student_token),
        )
        assert r.status_code == 400
        assert "coordenadas" in r.json()["detail"].lower()

    def test_checkout_geofence_rechaza_si_dentro_del_gym(self, client, gym, student, student_token, scanner_token):
        """Si el usuario sigue dentro del radio, el servidor rechaza el checkout."""
        self._do_checkin(client, gym, student, scanner_token)
        r = client.post(
            "/api/v1/sessions/checkout",
            json={
                "method": "geofence_timeout",
                "latitude": gym.geofence_lat,    # exactamente en el centro del gym
                "longitude": gym.geofence_lng,
            },
            headers=auth_header(student_token),
        )
        assert r.status_code == 400
        assert "dentro del gym" in r.json()["detail"]


class TestMyActiveSession:
    def test_sin_sesion_activa(self, client, student, student_token):
        r = client.get("/api/v1/sessions/me/active", headers=auth_header(student_token))
        assert r.status_code == 200
        assert r.json()["tiene_sesion_activa"] is False

    def test_con_sesion_activa(self, client, gym, student, student_token, scanner_token):
        qr = create_qr_token(str(student.id))
        client.post(
            "/api/v1/sessions/checkin",
            json={"qr_token": qr},
            headers=auth_header(scanner_token),
        )
        r = client.get("/api/v1/sessions/me/active", headers=auth_header(student_token))
        assert r.status_code == 200
        data = r.json()
        assert data["tiene_sesion_activa"] is True
        assert data["sesion"]["esta_activa"] is True


class TestOccupancy:
    def test_sin_sesiones(self, client, gym):
        r = client.get("/api/v1/sessions/occupancy")
        assert r.status_code == 200
        data = r.json()
        assert data["ocupacion_actual"] == 0
        assert data["capacidad"] == 10
        assert data["alerta_aforo"] is False

    def test_con_una_sesion_activa(self, client, gym, student, scanner_token):
        qr = create_qr_token(str(student.id))
        client.post(
            "/api/v1/sessions/checkin",
            json={"qr_token": qr},
            headers=auth_header(scanner_token),
        )
        r = client.get("/api/v1/sessions/occupancy")
        assert r.status_code == 200
        assert r.json()["ocupacion_actual"] == 1
