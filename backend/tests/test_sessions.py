"""Tests para los endpoints de check-in, check-out y ocupación."""
from datetime import timedelta

import pytest
from nanoid import generate

from app.core.config import now_lima, settings
from app.models.qr_code import QRCode
from tests.conftest import auth_header


def _new_qr(db, student, *, expired: bool = False) -> str:
    """Genera y persiste un QR code válido (o expirado) para `student`."""
    code = generate(size=21)
    expires_at = (
        now_lima() - timedelta(seconds=10)
        if expired
        else now_lima() + timedelta(seconds=settings.QR_TOKEN_EXPIRE_SECONDS)
    )
    db.add(QRCode(code=code, user_id=student.id, expires_at=expires_at))
    db.commit()
    return code


class TestCheckin:
    def test_checkin_exitoso(self, client, gym, student, scanner_token, db):
        code = _new_qr(db, student)
        r = client.post(
            "/api/v1/sessions/checkin",
            json={"code": code},
            headers=auth_header(scanner_token),
        )
        assert r.status_code == 201
        data = r.json()
        assert data["sesion"]["esta_activa"] is True
        assert data["sesion"]["hora_salida"] is None
        assert data["sesion"]["user_id"] == str(student.id)

    def test_checkin_rechaza_qr_expirado(self, client, gym, student, scanner_token, db):
        code = _new_qr(db, student, expired=True)
        r = client.post(
            "/api/v1/sessions/checkin",
            json={"code": code},
            headers=auth_header(scanner_token),
        )
        assert r.status_code == 400
        assert "expirado" in r.json()["detail"].lower() or "inválido" in r.json()["detail"].lower()

    def test_checkin_rechaza_replay_del_mismo_qr(self, client, gym, student, scanner_token, db):
        code = _new_qr(db, student)
        r1 = client.post(
            "/api/v1/sessions/checkin",
            json={"code": code},
            headers=auth_header(scanner_token),
        )
        assert r1.status_code == 201

        # Segundo intento con el mismo code → ya está marcado como usado
        r2 = client.post(
            "/api/v1/sessions/checkin",
            json={"code": code},
            headers=auth_header(scanner_token),
        )
        assert r2.status_code == 400
        assert "usado" in r2.json()["detail"].lower() or "inválido" in r2.json()["detail"].lower()

    def test_checkin_bloquea_sesion_concurrente(self, client, gym, student, scanner_token, db):
        code1 = _new_qr(db, student)
        client.post(
            "/api/v1/sessions/checkin",
            json={"code": code1},
            headers=auth_header(scanner_token),
        )
        code2 = _new_qr(db, student)
        r2 = client.post(
            "/api/v1/sessions/checkin",
            json={"code": code2},
            headers=auth_header(scanner_token),
        )
        assert r2.status_code == 409
        assert "sesión activa" in r2.json()["detail"]

    def test_checkin_requiere_rol_scanner(self, client, gym, student, student_token, db):
        """Un estudiante NO puede operar el escáner."""
        code = _new_qr(db, student)
        r = client.post(
            "/api/v1/sessions/checkin",
            json={"code": code},
            headers=auth_header(student_token),
        )
        assert r.status_code == 403

    def test_checkin_sin_auth_es_rechazado(self, client, gym, student, db):
        code = _new_qr(db, student)
        r = client.post("/api/v1/sessions/checkin", json={"code": code})
        assert r.status_code in (401, 403)


class TestCheckout:
    def _do_checkin(self, client, gym, student, scanner_token, db):
        code = _new_qr(db, student)
        client.post(
            "/api/v1/sessions/checkin",
            json={"code": code},
            headers=auth_header(scanner_token),
        )

    def test_checkout_manual_exitoso(self, client, gym, student, student_token, scanner_token, db):
        self._do_checkin(client, gym, student, scanner_token, db)
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

    def test_checkout_auto_kill_es_rechazado_por_usuario(self, client, gym, student, student_token, scanner_token, db):
        self._do_checkin(client, gym, student, scanner_token, db)
        r = client.post(
            "/api/v1/sessions/checkout",
            json={"method": "auto_kill"},
            headers=auth_header(student_token),
        )
        assert r.status_code == 400

    def test_checkout_geofence_requiere_coordenadas(self, client, gym, student, student_token, scanner_token, db):
        self._do_checkin(client, gym, student, scanner_token, db)
        r = client.post(
            "/api/v1/sessions/checkout",
            json={"method": "geofence_timeout"},
            headers=auth_header(student_token),
        )
        assert r.status_code == 400
        assert "coordenadas" in r.json()["detail"].lower()

    def test_checkout_geofence_rechaza_si_dentro_del_gym(self, client, gym, student, student_token, scanner_token, db):
        """Si el usuario sigue dentro del radio, el servidor rechaza el checkout."""
        self._do_checkin(client, gym, student, scanner_token, db)
        r = client.post(
            "/api/v1/sessions/checkout",
            json={
                "method": "geofence_timeout",
                "latitude": gym.geofence_lat,
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

    def test_con_sesion_activa(self, client, gym, student, student_token, scanner_token, db):
        code = _new_qr(db, student)
        client.post(
            "/api/v1/sessions/checkin",
            json={"code": code},
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

    def test_con_una_sesion_activa(self, client, gym, student, scanner_token, db):
        code = _new_qr(db, student)
        client.post(
            "/api/v1/sessions/checkin",
            json={"code": code},
            headers=auth_header(scanner_token),
        )
        r = client.get("/api/v1/sessions/occupancy")
        assert r.status_code == 200
        assert r.json()["ocupacion_actual"] == 1
