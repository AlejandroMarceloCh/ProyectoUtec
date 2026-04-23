"""
Tests para los modelos SQLAlchemy (validaciones, propiedades, lógica de dominio).
No requieren base de datos — testean la lógica pura del ORM.
"""
from datetime import timedelta

import pytest

from app.core.config import now_lima
from app.models.user import User, UserRole
from app.models.training_session import TrainingSession, ExitMethod
from app.core.scheduler import _calcular_puntos_base


# ---------------------------------------------------------------------------
# User — validaciones de email
# ---------------------------------------------------------------------------

class TestUserEmail:
    def test_acepta_email_utec_edu_pe(self):
        u = User()
        u.email = "a20230001@utec.edu.pe"
        assert u.email == "a20230001@utec.edu.pe"

    def test_acepta_email_utec_pe(self):
        u = User()
        u.email = "juan.garcia@utec.pe"
        assert u.email == "juan.garcia@utec.pe"

    def test_normaliza_a_minusculas(self):
        u = User()
        u.email = "A20230001@UTEC.EDU.PE"
        assert u.email == "a20230001@utec.edu.pe"

    def test_rechaza_gmail(self):
        u = User()
        with pytest.raises(ValueError, match="utec"):
            u.email = "estudiante@gmail.com"

    def test_rechaza_dominio_parecido(self):
        u = User()
        with pytest.raises(ValueError):
            u.email = "hacker@utec.edu.pe.evil.com"

    def test_rechaza_sin_arroba(self):
        u = User()
        with pytest.raises(ValueError):
            u.email = "sinArroba_utec.edu.pe"


# ---------------------------------------------------------------------------
# User — soft delete
# ---------------------------------------------------------------------------

class TestUserSoftDelete:
    def test_soft_delete_marca_deleted_at(self):
        u = User()
        u.is_active = True
        u.deleted_at = None
        u.soft_delete()
        assert u.deleted_at is not None
        assert u.is_active is False

    def test_is_deleted_property(self):
        u = User()
        u.deleted_at = None
        assert u.is_deleted is False
        u.soft_delete()
        assert u.is_deleted is True


# ---------------------------------------------------------------------------
# TrainingSession — duracion_efectiva y propiedades
# ---------------------------------------------------------------------------

class TestTrainingSession:
    def test_duracion_efectiva_retorna_none_si_activa(self):
        s = TrainingSession()
        s.hora_entrada = now_lima()
        s.hora_salida = None
        assert s.duracion_efectiva is None
        assert s.duracion_minutos is None

    def test_duracion_efectiva_calcula_correctamente(self):
        entrada = now_lima()
        s = TrainingSession()
        s.hora_entrada = entrada
        s.hora_salida = entrada + timedelta(minutes=75)
        assert s.duracion_minutos == 75

    def test_esta_activa_cuando_no_hay_salida(self):
        s = TrainingSession()
        s.hora_salida = None
        assert s.esta_activa is True

    def test_no_esta_activa_cuando_hay_salida(self):
        s = TrainingSession()
        s.hora_salida = now_lima()
        assert s.esta_activa is False

    def test_metodo_salida_enum_valores(self):
        assert ExitMethod.manual.value == "manual"
        assert ExitMethod.geofence_timeout.value == "geofence_timeout"
        assert ExitMethod.auto_kill.value == "auto_kill"


# ---------------------------------------------------------------------------
# Lógica de puntos (scheduler)
# ---------------------------------------------------------------------------

class TestPuntosCalculo:
    def test_sesion_corta_otorga_puntos_base(self):
        """0-4 minutos = solo puntos base (10)"""
        assert _calcular_puntos_base(0) == 10
        assert _calcular_puntos_base(4) == 10

    def test_sesion_de_30_minutos(self):
        """10 base + 30//5 = 10 + 6 = 16"""
        assert _calcular_puntos_base(30) == 16

    def test_sesion_de_60_minutos(self):
        """10 base + 60//5 = 10 + 12 = 22"""
        assert _calcular_puntos_base(60) == 22

    def test_sesion_de_120_minutos(self):
        """10 base + 120//5 = 10 + 24 = 34"""
        assert _calcular_puntos_base(120) == 34

    def test_auto_kill_aplica_penalizacion_20_porciento(self):
        """Auto-kill sobre 60 min: 22 puntos * 0.80 = 17"""
        base = _calcular_puntos_base(60)
        penalizado = int(base * 0.80)
        assert penalizado == 17

    def test_roles_enum_valores(self):
        assert UserRole.student.value == "student"
        assert UserRole.trainer.value == "trainer"
        assert UserRole.utec_staff.value == "utec_staff"
        assert UserRole.admin_staff.value == "admin_staff"
