"""Tests para los endpoints de autenticación."""
import pytest
from tests.conftest import auth_header


class TestRegister:
    def test_registro_exitoso(self, client):
        r = client.post("/api/v1/auth/register", json={
            "email": "nuevo@utec.edu.pe",
            "password": "password123",
            "full_name": "Nuevo Usuario",
        })
        assert r.status_code == 201
        data = r.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_registro_rechaza_email_externo(self, client):
        r = client.post("/api/v1/auth/register", json={
            "email": "user@gmail.com",
            "password": "password123",
            "full_name": "Externo",
        })
        assert r.status_code == 422

    def test_registro_rechaza_password_corta(self, client):
        r = client.post("/api/v1/auth/register", json={
            "email": "user@utec.edu.pe",
            "password": "123",
            "full_name": "Usuario",
        })
        assert r.status_code == 422

    def test_registro_rechaza_email_duplicado(self, client, student):
        r = client.post("/api/v1/auth/register", json={
            "email": student.email,
            "password": "password123",
            "full_name": "Duplicado",
        })
        assert r.status_code == 409

    def test_acepta_dominio_utec_pe(self, client):
        r = client.post("/api/v1/auth/register", json={
            "email": "docente@utec.pe",
            "password": "password123",
            "full_name": "Docente UTEC",
        })
        assert r.status_code == 201


class TestLogin:
    def test_login_exitoso(self, client, student):
        r = client.post("/api/v1/auth/login", json={
            "email": student.email,
            "password": "password123",
        })
        assert r.status_code == 200
        assert "access_token" in r.json()

    def test_login_rechaza_password_incorrecta(self, client, student):
        r = client.post("/api/v1/auth/login", json={
            "email": student.email,
            "password": "wrong_password",
        })
        assert r.status_code == 401

    def test_login_rechaza_email_inexistente(self, client):
        r = client.post("/api/v1/auth/login", json={
            "email": "noexiste@utec.edu.pe",
            "password": "password123",
        })
        assert r.status_code == 401


class TestRefresh:
    def test_refresh_genera_nuevo_access_token(self, client, student):
        login = client.post("/api/v1/auth/login", json={
            "email": student.email, "password": "password123"
        }).json()

        r = client.post("/api/v1/auth/refresh", json={
            "refresh_token": login["refresh_token"]
        })
        assert r.status_code == 200
        assert "access_token" in r.json()

    def test_refresh_rechaza_access_token_como_refresh(self, client, student_token):
        r = client.post("/api/v1/auth/refresh", json={
            "refresh_token": student_token
        })
        assert r.status_code == 401
