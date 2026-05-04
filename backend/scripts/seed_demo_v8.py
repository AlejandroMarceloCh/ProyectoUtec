"""
Seed demo v8 — 30 alumnos UTEC con historial realista para la demo de la pistola.

Crea:
- 30 alumnos con email a20240xxx@utec.edu.pe / password "Utec2024!"
- Distribución por facultad: 8 BA, 6 SI/CS, 5 IND, 4 BIO, 4 MEC, 3 CIV
- Sexo: 60% M, 35% F, 5% Otro (refleja distribución UTEC)
- Preferencias declaradas: 60% han completado preferencias (días + min + sexo)
- Historial: 4 semanas de sesiones cerradas, frecuencia variable
  - 10 alumnos "constantes" (3-4 sesiones/sem)
  - 10 alumnos "irregulares" (1-2 sesiones/sem)
  - 10 alumnos "nuevos" (1-3 sesiones totales, registrados <2 semanas)
- ExerciseLogs con distribución de reps:
  - 30% perfil "fuerza": compuestos a 4-6 reps + aislados a 8-10
  - 40% perfil "hipertrofia": compuestos a 8-10 + aislados a 12-15
  - 20% perfil "resistencia": compuestos a 12-15 + aislados a 15-20
  - 10% perfil "recomp": mixto

Uso (ejecutar dentro del container api):
    docker exec api python scripts/seed_demo_v8.py
"""
import random
import sys
import uuid
from datetime import timedelta

import uuid6
from sqlalchemy import select

# Setup path para correr desde scripts/
sys.path.insert(0, "/app")

from app.core.config import now_lima
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.exercise import ExerciseLog
from app.models.faculty import Faculty
from app.models.gym_config import GymConfig
from app.models.training_session import ExitMethod, TrainingSession
from app.models.user import User, UserRole

random.seed(42)  # determinista — la demo se ve igual cada vez

# ---------- 30 alumnos demo (nombres realistas peruanos) ----------
ALUMNOS = [
    # (nombre, código, faculty_code, sexo)
    ("Mateo Ramírez Torres", "a20240101", "BA",   "M"),
    ("Valentina Castro Vega", "a20240102", "BA",   "F"),
    ("Sebastián Morales Quispe", "a20240103", "BA",   "M"),
    ("Camila Rojas Sánchez", "a20240104", "BA",   "F"),
    ("Diego Mendoza Flores", "a20240105", "BA",   "M"),
    ("Lucía Paredes García", "a20240106", "BA",   "F"),
    ("Joaquín Huamán Núñez", "a20240107", "BA",   "M"),
    ("Renata Vargas Acuña", "a20240108", "BA",   "F"),
    ("Nicolás Salazar Chávez", "a20240201", "SI", "M"),
    ("Antonella Pérez Díaz", "a20240202", "SI", "F"),
    ("Alessandro Torres Lozano", "a20240203", "SI", "M"),
    ("Fátima Solís Aguirre", "a20240204", "SI", "F"),
    ("Bruno Chumpitaz Reyes", "a20240205", "SI", "M"),
    ("Isabella Quiroz Gómez", "a20240206", "SI", "F"),
    ("Andrés Carrasco Silva", "a20240301", "IND", "M"),
    ("Daniela Ortiz Maldonado", "a20240302", "IND", "F"),
    ("Rodrigo Alvarado Yupanqui", "a20240303", "IND", "M"),
    ("Adriana Cáceres Núñez", "a20240304", "IND", "F"),
    ("Fabián León Espinoza", "a20240305", "IND", "M"),
    ("Sofía Quintanilla Vera", "a20240401", "BIO", "F"),
    ("Mauricio Pinto Romero", "a20240402", "BIO", "M"),
    ("Ariana Bravo Manco", "a20240403", "BIO", "F"),
    ("Gonzalo Rosales Bazán", "a20240404", "BIO", "M"),
    ("Emilia Loayza Sandoval", "a20240501", "MEC", "F"),
    ("Tomás Cárdenas Bustamante", "a20240502", "MEC", "M"),
    ("Mía Velásquez Pacheco", "a20240503", "MEC", "F"),
    ("Sebastián Linares Cárdenas", "a20240504", "MEC", "M"),
    ("Romina Fuentes Espinoza", "a20240601", "CIV", "F"),
    ("Adrián Olivares Tapia", "a20240602", "CIV", "M"),
    ("Valeria Maldonado Rojas", "a20240603", "CIV", "F"),
]

# Templates de ejercicios por perfil (distribución bimodal real para test infer_enfoque)
EXERCISE_TEMPLATES = {
    "fuerza": [
        # Compuestos pesados (5 reps) + accesorios moderados (8-10)
        ("Bench Press", "pecho", ["triceps", "hombros_anterior"], 5, 5),
        ("Squat", "cuadriceps", ["gluteos", "aductores"], 5, 5),
        ("Deadlift", "espalda_baja", ["gluteos", "isquios"], 5, 4),
        ("OHP", "hombros_anterior", ["triceps"], 5, 5),
        ("Bent Over Row", "espalda_alta", ["biceps"], 5, 5),
        # Accesorios
        ("Lateral Raise", "hombros_lateral", [], 10, 3),
        ("Bicep Curl", "biceps", ["antebrazo"], 8, 3),
        ("Tricep Pushdown", "triceps", [], 10, 3),
    ],
    "hipertrofia": [
        # Compuestos a 8-10 + aislados a 12-15
        ("Bench Press", "pecho", ["triceps"], 8, 4),
        ("Incline DB Press", "pecho", ["hombros_anterior"], 10, 3),
        ("Lat Pulldown", "espalda_alta", ["biceps"], 10, 4),
        ("Squat", "cuadriceps", ["gluteos"], 8, 4),
        ("Leg Press", "cuadriceps", ["gluteos"], 12, 3),
        ("Lateral Raise", "hombros_lateral", [], 15, 4),
        ("Bicep Curl", "biceps", [], 12, 4),
        ("Cable Crossover", "pecho", [], 15, 3),
    ],
    "resistencia": [
        # Todo en rangos altos
        ("Push Up", "pecho", ["triceps"], 18, 4),
        ("Pull Up", "espalda_alta", ["biceps"], 12, 4),
        ("Lunges", "cuadriceps", ["gluteos"], 20, 3),
        ("Plank", "abdomen", ["oblicuos"], 1, 4),
        ("Russian Twist", "oblicuos", ["abdomen"], 30, 3),
        ("Hip Thrust", "gluteos", ["isquios"], 18, 4),
        ("Glute Bridge", "gluteos", [], 20, 3),
    ],
    "recomp": [
        # Mix
        ("Bench Press", "pecho", ["triceps"], 10, 4),
        ("Romanian DL", "isquios", ["gluteos"], 12, 3),
        ("Lat Pulldown", "espalda_alta", ["biceps"], 12, 4),
        ("Lateral Raise", "hombros_lateral", [], 14, 3),
        ("Leg Curl", "isquios", [], 14, 3),
    ],
}

PERFIL_DIST = (
    ["fuerza"] * 9 +
    ["hipertrofia"] * 12 +
    ["resistencia"] * 6 +
    ["recomp"] * 3
)
random.shuffle(PERFIL_DIST)


def main():
    db = SessionLocal()
    now = now_lima()
    pwd_hash = hash_password("Utec2024!")

    # Mapa faculty_code → id
    faculties = {f.code: f for f in db.query(Faculty).all()}

    gym = db.query(GymConfig).filter(GymConfig.is_active == True).first()
    if not gym:
        print("ERROR: no hay GymConfig activo. Corre seed_demo.py primero.")
        return

    created_users = 0
    created_sessions = 0
    created_logs = 0

    for i, (full_name, codigo, fac_code, sexo) in enumerate(ALUMNOS):
        email = f"{codigo}@utec.edu.pe"
        if db.query(User).filter(User.email == email).first():
            continue  # ya existe (idempotente)

        faculty = faculties.get(fac_code)
        perfil = PERFIL_DIST[i]

        # Categoría de actividad
        if i < 10:
            categoria = "constante"  # 3-4 sesiones/sem × 4 semanas
            registrado_dias_atras = 60
            preferred_days = random.choice([3, 4, 5])
            preferred_min = random.choice([45, 60, 75])
            num_sesiones = random.randint(12, 16)
        elif i < 20:
            categoria = "irregular"  # 1-2 sesiones/sem
            registrado_dias_atras = 45
            preferred_days = random.choice([2, 3])
            preferred_min = random.choice([30, 45, 60])
            num_sesiones = random.randint(4, 8)
        else:
            categoria = "nuevo"  # registrado reciente, pocas sesiones
            registrado_dias_atras = random.randint(3, 12)
            # 50% no ha llenado preferencias todavía
            preferred_days = random.choice([3, 4]) if random.random() > 0.5 else None
            preferred_min = random.choice([45, 60]) if random.random() > 0.5 else None
            num_sesiones = random.randint(1, 4)

        # Sexo preference: 60% lo ponen, resto no
        sexo_pref = sexo if random.random() > 0.4 else None

        user = User(
            id=uuid6.uuid7(),
            email=email,
            hashed_password=pwd_hash,
            full_name=full_name,
            role=UserRole.student,
            faculty_id=faculty.id if faculty else None,
            preferred_days_per_week=preferred_days,
            preferred_minutes_per_session=preferred_min,
            sexo=sexo_pref,
            points=0,  # los puntos se acumularán al cerrar sesiones
            created_at=now - timedelta(days=registrado_dias_atras),
        )
        db.add(user)
        db.flush()  # obtener user.id sin commit
        created_users += 1

        # Generar sesiones distribuidas en las últimas 4 semanas
        ventana_inicio = now - timedelta(days=min(28, registrado_dias_atras))
        ventana_fin = now - timedelta(hours=12)
        if ventana_fin <= ventana_inicio:
            continue

        intervalo_total = (ventana_fin - ventana_inicio).total_seconds()
        ejercicios = EXERCISE_TEMPLATES[perfil]

        for s_i in range(num_sesiones):
            # Hora aleatoria dentro de la ventana, sesgada a tarde (6-9 PM)
            offset = random.uniform(0, intervalo_total)
            entrada = ventana_inicio + timedelta(seconds=offset)
            # Ajustar a horario gym (6-22h)
            entrada = entrada.replace(hour=random.choice([7, 8, 17, 18, 19, 20]),
                                      minute=random.randint(0, 59))
            duracion_min = random.randint(40, 90)
            salida = entrada + timedelta(minutes=duracion_min)
            puntos = 10 + (duracion_min // 5)

            session = TrainingSession(
                id=uuid6.uuid7(),
                user_id=user.id,
                gym_id=gym.id,
                hora_entrada=entrada,
                hora_salida=salida,
                metodo_salida=ExitMethod.manual,
                puntos_otorgados=puntos,
            )
            db.add(session)
            db.flush()
            created_sessions += 1
            user.points += puntos

            # Logs de ejercicios para esta sesión (4-7 ejercicios random del perfil)
            n_ejs = random.randint(4, min(7, len(ejercicios)))
            sample = random.sample(ejercicios, n_ejs)
            for nombre, primario, secundarios, reps, series in sample:
                log = ExerciseLog(
                    id=uuid6.uuid7(),
                    user_id=user.id,
                    session_id=session.id,
                    nombre=nombre,
                    grupo_primario=primario,
                    grupos_secundarios=secundarios,
                    series=series,
                    reps=reps,
                    created_at=entrada + timedelta(minutes=random.randint(5, duracion_min - 5)),
                )
                db.add(log)
                created_logs += 1

        # Sumar puntos a la facultad
        if faculty:
            faculty.total_points += user.points

    db.commit()
    print(f"✓ {created_users} alumnos creados")
    print(f"✓ {created_sessions} sesiones cerradas")
    print(f"✓ {created_logs} exercise logs")
    print(f"✓ password de todos: Utec2024!")
    print()
    print("Ejemplos para probar:")
    print("  - a20240101@utec.edu.pe (constante BA Mateo)")
    print("  - a20240202@utec.edu.pe (constante SI Antonella)")
    print("  - a20240501@utec.edu.pe (constante MEC Emilia)")
    print("  - a20240603@utec.edu.pe (nuevo CIV Valeria)")


if __name__ == "__main__":
    main()
