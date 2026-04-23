"""
Script de seed masivo para demo.
Inserta: 80 alumnos, 4 staff, 600+ sesiones históricas (90 días),
sesiones activas actuales, y distribuye puntos realistas.
Ejecutar: python3 scripts/seed_demo.py
"""
import sys
import os
import random
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.db.base import Base
from app.db.session import engine
from app.models.user import User, UserRole
from app.models.faculty import Faculty
from app.models.gym_config import GymConfig
from app.models.training_session import TrainingSession, ExitMethod
from app.core.security import hash_password
from app.core.config import LIMA_TZ, now_lima
import app.models  # noqa — register all

# ── Datos base ────────────────────────────────────────────────────────────────

NOMBRES = [
    "Alejandro","Camila","Diego","Valeria","Sebastián","Luciana","Mateo","Fernanda",
    "Rodrigo","Patricia","Carlos","Andrea","Javier","Daniela","Miguel","Sofía",
    "Eduardo","Isabel","Andrés","Natalia","Luis","Gabriela","Pablo","Verónica",
    "Joaquín","Mariana","Felipe","Carolina","Cristian","Paola","Roberto","Claudia",
    "Álvaro","Lorena","Santiago","Elena","Fabián","Diana","Nicolás","Rebeca",
    "Tomás","Sara","Ignacio","Alicia","Emilio","Teresa","Gonzalo","Mónica",
    "Rafael","Silvana","Iván","Yolanda","César","Adriana","Arturo","Beatriz",
    "Ramón","Cindy","Héctor","Nadia","Óscar","Pilar","Julián","Roxana",
    "Renato","Xiomara","Bruno","Grecia","Hans","Melissa","Alex","Renzo",
    "Enzo","Fiorella","Alonso","Ariana","Marco","Liz","Kevin","Karolina",
]

APELLIDOS = [
    "García","Rodríguez","Martínez","López","González","Pérez","Sánchez","Ramírez",
    "Torres","Flores","Rivera","Gómez","Díaz","Reyes","Cruz","Morales","Ortiz",
    "Gutierrez","Chávez","Ramos","Mendoza","Herrera","Vargas","Castillo","Rojas",
    "Álvarez","Vega","Navarro","Espinoza","Paredes","Quispe","Huamán","Ccama",
    "Mamani","Condori","Ticona","Apaza","Limache","Cárdenas","Villanueva",
]

PASS_HASH = hash_password("Utec2024!")

FACULTIES_CODES = ["IND","CIV","AMB","QUI","MEC","ELE","MEC2","ENE","BIO","SI","CDIA","CC","CIBER","BA","AND"]

# Horario real del gym:
#   Lun-Vie: 09:00 - 17:00 (picos a la apertura y al cierre)
#   Sáb:     08:00 - 15:00
#   Dom:     cerrado

GYM_HOURS = {
    0: (9, 17),   # Lun
    1: (9, 17),   # Mar
    2: (9, 17),   # Mié
    3: (9, 17),   # Jue
    4: (9, 17),   # Vie
    5: (8, 15),   # Sáb
    6: None,      # Dom — cerrado
}

PEAK_HOURS = {
    0: [9, 10, 11, 16],
    1: [9, 10, 16],
    2: [9, 10, 11, 15, 16],
    3: [9, 10, 16],
    4: [9, 10, 15, 16],
    5: [8, 9, 10, 13, 14],
    6: [],
}


def random_hour_for_day(weekday: int) -> int | None:
    """Devuelve una hora válida dentro del horario del gym, o None si está cerrado."""
    hours = GYM_HOURS.get(weekday)
    if not hours:
        return None
    open_h, close_h = hours
    # Última entrada máximo 1h antes del cierre
    valid = list(range(open_h, close_h - 1))
    if not valid:
        return None
    if random.random() < 0.55:
        peaks = [h for h in PEAK_HOURS.get(weekday, []) if h in valid]
        if peaks:
            return random.choice(peaks)
    return random.choice(valid)


def make_session(user: User, gym: GymConfig, day_offset: int, db: Session) -> bool:
    """Crea una sesión completa en un día pasado dentro del horario real del gym.
    Retorna False si el gym está cerrado ese día (domingo)."""
    dt_base = now_lima() - timedelta(days=day_offset)
    weekday = dt_base.weekday()
    hour = random_hour_for_day(weekday)
    if hour is None:
        return False

    entrada = dt_base.replace(hour=hour, minute=random.randint(0, 45), second=0, microsecond=0)

    # Duración máxima limitada por el cierre del gym
    _, close_h = GYM_HOURS[weekday]
    max_min = int((dt_base.replace(hour=close_h, minute=0) - entrada).total_seconds() // 60)
    max_min = max(20, min(max_min, 90))
    duracion_min = random.randint(20, max_min)
    salida = entrada + timedelta(minutes=duracion_min)

    method = random.choices(
        [ExitMethod.manual, ExitMethod.geofence_timeout, ExitMethod.auto_kill],
        weights=[0.70, 0.20, 0.10],
    )[0]

    puntos_base = 10 + (duracion_min // 5)
    puntos = int(puntos_base * 0.80) if method == ExitMethod.auto_kill else puntos_base

    db.add(TrainingSession(
        user_id=user.id,
        gym_id=gym.id,
        hora_entrada=entrada,
        hora_salida=salida,
        metodo_salida=method,
        puntos_otorgados=puntos,
    ))

    if user.role == UserRole.student:
        user.points += puntos
        if user.faculty_id:
            faculty = db.get(Faculty, user.faculty_id)
            if faculty:
                faculty.total_points += puntos
    return True


def run():
    db: Session = SessionLocal()
    print("🏋️  UTEC Gym — Seed masivo demo")

    # Asegurar tablas
    Base.metadata.create_all(bind=engine)

    # ── Gym ──────────────────────────────────────────────────────────────────
    gym = db.query(GymConfig).first()
    if not gym:
        gym = GymConfig(name="UTEC Gym", capacity=100,
                        geofence_lat=-12.0736, geofence_lng=-77.0820, geofence_radius_m=100)
        db.add(gym)
        db.commit()
        db.refresh(gym)
    print(f"✅ Gym: {gym.name} (cap. {gym.capacity})")

    # ── Facultades ────────────────────────────────────────────────────────────
    faculties_by_code: dict[str, Faculty] = {}
    for code in FACULTIES_CODES:
        f = db.query(Faculty).filter(Faculty.code == code).first()
        if not f:
            names = {
                "IND": "Ingeniería Industrial", "CIV": "Ingeniería Civil",
                "AMB": "Ingeniería Ambiental", "QUI": "Ingeniería Química",
                "MEC": "Ingeniería Mecatrónica", "ELE": "Ingeniería Electrónica",
                "MEC2": "Ingeniería Mecánica", "ENE": "Ingeniería de la Energía",
                "BIO": "Bioingeniería", "SI": "Sistemas de Información",
                "CDIA": "Ciencia de Datos e IA", "CC": "Ciencia de la Computación",
                "CIBER": "Ciberseguridad", "BA": "Business Analytics",
                "AND": "Administración y Negocios Digitales",
            }
            f = Faculty(name=names[code], code=code)
            db.add(f)
            db.flush()
        faculties_by_code[code] = f
    db.commit()
    print(f"✅ Facultades: {len(faculties_by_code)}")

    # ── Staff fijo para demo ──────────────────────────────────────────────────
    STAFF = [
        ("recepcion@utec.pe", "Recepcionista UTEC", UserRole.admin_staff),
        ("entrenador1@utec.pe", "Coach Marco Delgado", UserRole.trainer),
        ("entrenador2@utec.pe", "Coach Ana Torres", UserRole.trainer),
        ("staff@utec.pe", "Personal UTEC", UserRole.utec_staff),
    ]
    for email, name, role in STAFF:
        if not db.query(User).filter(User.email == email).first():
            db.add(User(email=email, hashed_password=PASS_HASH, full_name=name, role=role))
    db.commit()
    print(f"✅ Staff: {len(STAFF)} usuarios (password: Utec2024!)")

    # ── Alumnos ───────────────────────────────────────────────────────────────
    students: list[User] = []
    existing_emails = {u.email for u in db.query(User.email).all()}
    created = 0

    nombres_pool = list(NOMBRES)
    random.shuffle(nombres_pool)
    used_names: set[str] = set()

    for i in range(1, 121):  # 120 alumnos
        nombre = random.choice(NOMBRES)
        apellido = random.choice(APELLIDOS)
        full_name = f"{nombre} {apellido}"
        # Garantizar código único
        email = f"a{20200000 + i:08d}@utec.edu.pe"
        if email in existing_emails:
            continue

        faculty = faculties_by_code[random.choice(FACULTIES_CODES)]
        u = User(
            email=email,
            hashed_password=PASS_HASH,
            full_name=full_name,
            role=UserRole.student,
            faculty_id=faculty.id,
            points=0,
        )
        db.add(u)
        students.append(u)
        existing_emails.add(email)
        created += 1

    db.commit()
    # Re-fetch with IDs
    students = db.query(User).filter(User.role == UserRole.student).all()
    print(f"✅ Alumnos: {len(students)} (password: Utec2024!)")

    # ── Sesiones históricas (90 días) ─────────────────────────────────────────
    # Limpiar sesiones viejas para re-seeding limpio
    existing_sessions = db.query(TrainingSession).count()
    if existing_sessions > 0:
        print(f"⚠️  Ya hay {existing_sessions} sesiones. Saltando sesiones históricas (solo activas).")
        skip_history = True
    else:
        skip_history = False

    session_count = 0
    if not skip_history:
        # Reset puntos
        for s in students:
            s.points = 0
        for f in faculties_by_code.values():
            f.total_points = 0
        db.commit()

        # Cada alumno entrena entre 3-7 veces por semana en promedio
        # 90 días → ~12-18 semanas → 36-126 sesiones por alumno
        for student in students:
            # Frecuencia base: alumnos activos 4-6x/semana, pasivos 1-2x/semana
            freq = random.choices([1, 2, 3, 4, 5, 6], weights=[0.1, 0.15, 0.2, 0.25, 0.2, 0.1])[0]
            sessions_total = int(90 * freq / 7)

            # Distribuir en 90 días con variación (no todos los días)
            day_offsets = sorted(random.sample(range(1, 91), min(sessions_total, 90)))

            for offset in day_offsets:
                if make_session(student, gym, offset, db):
                    session_count += 1

            if session_count % 500 == 0:
                db.commit()
                print(f"   ... {session_count} sesiones insertadas")

        db.commit()
        print(f"✅ Sesiones históricas: {session_count}")

    # ── Sesiones activas AHORA (para mostrar aforo en vivo) ───────────────────
    # Poner entre 12-18 alumnos dentro del gym ahora mismo
    active_count = random.randint(12, 18)
    active_students = random.sample(students, active_count)
    now = now_lima()

    for s in active_students:
        # Asegurarse de que no tenga ya una sesión activa
        has_active = db.query(TrainingSession).filter(
            TrainingSession.user_id == s.id,
            TrainingSession.hora_salida.is_(None),
        ).first()
        if not has_active:
            entrada = now - timedelta(minutes=random.randint(5, 90))
            db.add(TrainingSession(user_id=s.id, gym_id=gym.id, hora_entrada=entrada))

    db.commit()
    print(f"✅ Sesiones activas ahora: {active_count} alumnos en el gym")

    # ── Resumen final ─────────────────────────────────────────────────────────
    total_sessions = db.query(TrainingSession).count()
    top_faculties = (
        db.query(Faculty)
        .filter(Faculty.total_points > 0)
        .order_by(Faculty.total_points.desc())
        .limit(5)
        .all()
    )

    print("\n" + "="*50)
    print("🏆 TOP 5 FACULTADES")
    for i, f in enumerate(top_faculties, 1):
        print(f"  {i}. {f.name} ({f.code}) — {f.total_points:,} pts")

    top_students = db.query(User).filter(User.role == UserRole.student).order_by(User.points.desc()).limit(5).all()
    print("\n🥇 TOP 5 ALUMNOS")
    for i, u in enumerate(top_students, 1):
        print(f"  {i}. {u.full_name} — {u.points:,} pts")

    occ = db.query(TrainingSession).filter(
        TrainingSession.gym_id == gym.id,
        TrainingSession.hora_salida.is_(None),
    ).count()

    print(f"\n📊 Total sesiones en BD: {total_sessions:,}")
    print(f"🏋️  Aforo actual: {occ}/{gym.capacity}")
    print("\n✅ Credenciales demo:")
    print("   Recepcionista: recepcion@utec.pe / Utec2024!")
    print("   Entrenador:    entrenador1@utec.pe / Utec2024!")
    print("   Alumno demo:   a20200001@utec.edu.pe / Utec2024!")
    print("="*50)

    db.close()


if __name__ == "__main__":
    run()
