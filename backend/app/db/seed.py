"""Datos mínimos para que el API funcione en deploy (Docker / primera ejecución)."""
from sqlalchemy.orm import Session

from app.models.faculty import Faculty
from app.models.gym_config import GymConfig

UTEC_FACULTIES = [
    {"name": "Ingeniería Industrial",               "code": "IND"},
    {"name": "Ingeniería Civil",                    "code": "CIV"},
    {"name": "Ingeniería Ambiental",                "code": "AMB"},
    {"name": "Ingeniería Química",                  "code": "QUI"},
    {"name": "Ingeniería Mecatrónica",              "code": "MEC"},
    {"name": "Ingeniería Electrónica",              "code": "ELE"},
    {"name": "Ingeniería Mecánica",                 "code": "MEC2"},
    {"name": "Ingeniería de la Energía",            "code": "ENE"},
    {"name": "Bioingeniería",                       "code": "BIO"},
    {"name": "Sistemas de Información",             "code": "SI"},
    {"name": "Ciencia de Datos e IA",               "code": "CDIA"},
    {"name": "Ciencia de la Computación",           "code": "CC"},
    {"name": "Ciberseguridad",                      "code": "CIBER"},
    {"name": "Business Analytics",                  "code": "BA"},
    {"name": "Administración y Negocios Digitales", "code": "AND"},
]


def seed_gym_if_empty(db: Session) -> None:
    if db.query(GymConfig).count() > 0:
        return
    db.add(
        GymConfig(
            name="UTEC Gym",
            capacity=100,
            geofence_lat=-12.0736,
            geofence_lng=-77.0820,
            geofence_radius_m=100,
        )
    )
    db.commit()


def seed_faculties_if_empty(db: Session) -> None:
    if db.query(Faculty).count() > 0:
        return
    for f in UTEC_FACULTIES:
        db.add(Faculty(name=f["name"], code=f["code"]))
    db.commit()
