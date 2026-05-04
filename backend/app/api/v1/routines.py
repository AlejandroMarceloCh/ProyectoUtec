import json
import logging
import random
import re
from collections import Counter, defaultdict
from datetime import timedelta

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user
from app.core.config import LIMA_TZ, now_lima
from app.db.session import SessionLocal, get_db
from app.models.exercise import ExerciseLog, Routine
from app.models.qr_code import QRCode  # noqa: F401  (registra en metadata)
from app.models.training_session import TrainingSession
from app.models.user import User
from app.models.user_metrics import UserMetrics

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/routines", tags=["routines"])


# ---------------------------------------------------------------------------
# Catálogo canónico de ejercicios (taxonomía fija para el heatmap)
# ---------------------------------------------------------------------------

MUSCLE_GROUPS = [
    "pecho", "espalda_alta", "espalda_baja",
    "hombros_anterior", "hombros_lateral", "hombros_posterior",
    "biceps", "triceps", "antebrazo",
    "abdomen", "oblicuos",
    "cuadriceps", "isquios", "gluteos", "aductores", "gemelos",
    "trapecio",
]

EXERCISES = [
    # pecho
    {"nombre": "Bench Press", "primario": "pecho", "secundarios": ["triceps", "hombros_anterior"], "equipamiento": "barra"},
    {"nombre": "Incline DB Press", "primario": "pecho", "secundarios": ["hombros_anterior", "triceps"], "equipamiento": "mancuernas"},
    {"nombre": "Dumbbell Fly", "primario": "pecho", "secundarios": ["hombros_anterior"], "equipamiento": "mancuernas"},
    {"nombre": "Cable Crossover", "primario": "pecho", "secundarios": [], "equipamiento": "cables"},
    {"nombre": "Push Up", "primario": "pecho", "secundarios": ["triceps", "hombros_anterior"], "equipamiento": "peso_corporal"},
    {"nombre": "Dips", "primario": "triceps", "secundarios": ["pecho", "hombros_anterior"], "equipamiento": "peso_corporal"},
    # espalda
    {"nombre": "Pull Up", "primario": "espalda_alta", "secundarios": ["biceps", "hombros_posterior"], "equipamiento": "peso_corporal"},
    {"nombre": "Lat Pulldown", "primario": "espalda_alta", "secundarios": ["biceps"], "equipamiento": "cables"},
    {"nombre": "Bent Over Row", "primario": "espalda_alta", "secundarios": ["biceps", "trapecio"], "equipamiento": "barra"},
    {"nombre": "Seated Cable Row", "primario": "espalda_alta", "secundarios": ["biceps"], "equipamiento": "cables"},
    {"nombre": "Dumbbell Row", "primario": "espalda_alta", "secundarios": ["biceps"], "equipamiento": "mancuernas"},
    {"nombre": "T-Bar Row", "primario": "espalda_alta", "secundarios": ["biceps", "trapecio"], "equipamiento": "barra"},
    {"nombre": "Deadlift", "primario": "espalda_baja", "secundarios": ["gluteos", "isquios", "trapecio"], "equipamiento": "barra"},
    {"nombre": "Hyperextension", "primario": "espalda_baja", "secundarios": ["gluteos", "isquios"], "equipamiento": "maquina"},
    # hombros
    {"nombre": "OHP", "primario": "hombros_anterior", "secundarios": ["triceps", "trapecio"], "equipamiento": "barra"},
    {"nombre": "Dumbbell Shoulder Press", "primario": "hombros_anterior", "secundarios": ["triceps"], "equipamiento": "mancuernas"},
    {"nombre": "Lateral Raise", "primario": "hombros_lateral", "secundarios": [], "equipamiento": "mancuernas"},
    {"nombre": "Cable Lateral Raise", "primario": "hombros_lateral", "secundarios": [], "equipamiento": "cables"},
    {"nombre": "Rear Delt Fly", "primario": "hombros_posterior", "secundarios": ["espalda_alta"], "equipamiento": "mancuernas"},
    {"nombre": "Face Pull", "primario": "hombros_posterior", "secundarios": ["trapecio"], "equipamiento": "cables"},
    {"nombre": "Shrug", "primario": "trapecio", "secundarios": [], "equipamiento": "mancuernas"},
    # brazos
    {"nombre": "Bicep Curl", "primario": "biceps", "secundarios": ["antebrazo"], "equipamiento": "mancuernas"},
    {"nombre": "Hammer Curl", "primario": "biceps", "secundarios": ["antebrazo"], "equipamiento": "mancuernas"},
    {"nombre": "Preacher Curl", "primario": "biceps", "secundarios": [], "equipamiento": "barra"},
    {"nombre": "Tricep Pushdown", "primario": "triceps", "secundarios": [], "equipamiento": "cables"},
    {"nombre": "Tricep Extension", "primario": "triceps", "secundarios": [], "equipamiento": "mancuernas"},
    {"nombre": "Skull Crusher", "primario": "triceps", "secundarios": [], "equipamiento": "barra"},
    {"nombre": "Wrist Curl", "primario": "antebrazo", "secundarios": [], "equipamiento": "mancuernas"},
    # piernas
    {"nombre": "Squat", "primario": "cuadriceps", "secundarios": ["gluteos", "aductores"], "equipamiento": "barra"},
    {"nombre": "Front Squat", "primario": "cuadriceps", "secundarios": ["gluteos"], "equipamiento": "barra"},
    {"nombre": "Leg Press", "primario": "cuadriceps", "secundarios": ["gluteos"], "equipamiento": "maquina"},
    {"nombre": "Bulgarian Split Squat", "primario": "cuadriceps", "secundarios": ["gluteos"], "equipamiento": "mancuernas"},
    {"nombre": "Lunges", "primario": "cuadriceps", "secundarios": ["gluteos"], "equipamiento": "mancuernas"},
    {"nombre": "Leg Extension", "primario": "cuadriceps", "secundarios": [], "equipamiento": "maquina"},
    {"nombre": "Romanian DL", "primario": "isquios", "secundarios": ["gluteos", "espalda_baja"], "equipamiento": "barra"},
    {"nombre": "Leg Curl", "primario": "isquios", "secundarios": ["gemelos"], "equipamiento": "maquina"},
    {"nombre": "Hip Thrust", "primario": "gluteos", "secundarios": ["isquios"], "equipamiento": "barra"},
    {"nombre": "Glute Bridge", "primario": "gluteos", "secundarios": ["isquios"], "equipamiento": "peso_corporal"},
    {"nombre": "Cable Kickback", "primario": "gluteos", "secundarios": [], "equipamiento": "cables"},
    {"nombre": "Adductor Machine", "primario": "aductores", "secundarios": [], "equipamiento": "maquina"},
    {"nombre": "Calf Raise", "primario": "gemelos", "secundarios": [], "equipamiento": "maquina"},
    {"nombre": "Seated Calf Raise", "primario": "gemelos", "secundarios": [], "equipamiento": "maquina"},
    # core
    {"nombre": "Plank", "primario": "abdomen", "secundarios": ["oblicuos"], "equipamiento": "peso_corporal"},
    {"nombre": "Leg Raise", "primario": "abdomen", "secundarios": ["oblicuos"], "equipamiento": "peso_corporal"},
    {"nombre": "Cable Crunch", "primario": "abdomen", "secundarios": [], "equipamiento": "cables"},
    {"nombre": "Russian Twist", "primario": "oblicuos", "secundarios": ["abdomen"], "equipamiento": "peso_corporal"},
    {"nombre": "Side Plank", "primario": "oblicuos", "secundarios": ["abdomen"], "equipamiento": "peso_corporal"},
]

EXERCISES_BY_PRIMARY: dict[str, list[dict]] = defaultdict(list)
for ex in EXERCISES:
    EXERCISES_BY_PRIMARY[ex["primario"]].append(ex)


# ---------------------------------------------------------------------------
# Splits por días
# ---------------------------------------------------------------------------

SPLITS = {
    2: [
        ["pecho", "espalda_alta", "hombros_lateral", "biceps", "triceps"],
        ["cuadriceps", "isquios", "gluteos", "gemelos", "abdomen"],
    ],
    3: [
        ["pecho", "hombros_anterior", "hombros_lateral", "triceps"],
        ["espalda_alta", "espalda_baja", "biceps", "hombros_posterior"],
        ["cuadriceps", "isquios", "gluteos", "gemelos", "abdomen"],
    ],
    4: [
        ["cuadriceps", "isquios", "gluteos", "gemelos"],
        ["pecho", "hombros_anterior", "triceps"],
        ["espalda_baja", "isquios", "gluteos", "gemelos"],
        ["espalda_alta", "hombros_posterior", "biceps", "abdomen"],
    ],
    5: [
        ["pecho", "hombros_anterior", "hombros_lateral", "triceps"],
        ["espalda_alta", "espalda_baja", "biceps", "hombros_posterior"],
        ["cuadriceps", "isquios", "gluteos", "gemelos"],
        ["pecho", "espalda_alta", "hombros_lateral"],
        ["abdomen", "oblicuos", "biceps", "triceps"],
    ],
    6: [
        ["pecho", "hombros_anterior", "triceps"],
        ["espalda_alta", "biceps", "trapecio"],
        ["cuadriceps", "isquios", "gluteos"],
        ["hombros_lateral", "hombros_posterior", "abdomen"],
        ["espalda_alta", "biceps", "antebrazo"],
        ["cuadriceps", "gluteos", "gemelos"],
    ],
}

ENFOQUE_PARAMS = {
    "hipertrofia": {"reps": "8-12", "rir": "RIR 2", "compuesto_sets": 4, "aislado_sets": 3},
    "fuerza": {"reps": "4-6", "rir": "RIR 1", "compuesto_sets": 5, "aislado_sets": 3},
    "perdida_grasa": {"reps": "12-15", "rir": "RIR 3", "compuesto_sets": 3, "aislado_sets": 3},
    "resistencia": {"reps": "15-20", "rir": "RIR 3", "compuesto_sets": 3, "aislado_sets": 3},
    "recomp": {"reps": "10-12", "rir": "RIR 2", "compuesto_sets": 4, "aislado_sets": 3},
}

COMPOUND_GROUPS = {"pecho", "espalda_alta", "espalda_baja", "cuadriceps", "isquios", "gluteos", "hombros_anterior"}


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class GenerateRoutineRequest(BaseModel):
    dias_semana: int = Field(..., ge=2, le=6)
    sexo: str = Field(..., pattern="^(M|F|Otro)$")
    enfoque: str = Field(..., pattern="^(hipertrofia|fuerza|perdida_grasa|resistencia|recomp)$")


class ExerciseInRoutine(BaseModel):
    model_config = ConfigDict(extra="forbid")
    nombre: str = Field(..., max_length=80)
    grupo_primario: str
    grupos_secundarios: list[str] = Field(default_factory=list, max_length=8)
    series: int = Field(..., ge=1, le=10)
    reps: str = Field(..., max_length=10)
    rir_intensidad: str = Field(..., max_length=20)
    equipamiento: str = Field(..., max_length=30)
    orden: int = Field(..., ge=1, le=20)


class RoutineResponse(BaseModel):
    id: str
    dias_semana: int
    sexo: str
    enfoque: str
    rutina: dict[str, list[ExerciseInRoutine]]
    created_at: str


class LogExerciseRequest(BaseModel):
    nombre: str
    grupo_primario: str
    grupos_secundarios: list[str] = Field(default_factory=list)
    series: int = Field(..., ge=1, le=20)
    reps: int | None = Field(default=None, ge=1, le=200)


# ---------------------------------------------------------------------------
# Generación de rutina
# ---------------------------------------------------------------------------

def _select_exercise(grupo: str, used: set[str]) -> dict | None:
    pool = [e for e in EXERCISES_BY_PRIMARY.get(grupo, []) if e["nombre"] not in used]
    if not pool:
        pool = EXERCISES_BY_PRIMARY.get(grupo, [])
    if not pool:
        return None
    return random.choice(pool)


def _build_routine(dias: int, sexo: str, enfoque: str) -> dict[str, list[dict]]:
    split = SPLITS[dias]
    params = ENFOQUE_PARAMS[enfoque]

    plan: dict[str, list[dict]] = {}
    for i, grupos_dia in enumerate(split, start=1):
        used: set[str] = set()
        rutina_dia: list[dict] = []
        orden = 1

        compounds = [g for g in grupos_dia if g in COMPOUND_GROUPS]
        for grupo in compounds:
            ex = _select_exercise(grupo, used)
            if not ex:
                continue
            used.add(ex["nombre"])
            rutina_dia.append({
                "nombre": ex["nombre"],
                "grupo_primario": ex["primario"],
                "grupos_secundarios": ex["secundarios"],
                "series": params["compuesto_sets"],
                "reps": params["reps"],
                "rir_intensidad": params["rir"],
                "equipamiento": ex["equipamiento"],
                "orden": orden,
            })
            orden += 1

        for grupo in grupos_dia:
            if grupo in compounds:
                continue
            ex = _select_exercise(grupo, used)
            if not ex:
                continue
            used.add(ex["nombre"])
            sets = params["aislado_sets"]
            if sexo == "F" and grupo in ("gluteos", "cuadriceps"):
                sets += 1
            rutina_dia.append({
                "nombre": ex["nombre"],
                "grupo_primario": ex["primario"],
                "grupos_secundarios": ex["secundarios"],
                "series": sets,
                "reps": params["reps"],
                "rir_intensidad": params["rir"],
                "equipamiento": ex["equipamiento"],
                "orden": orden,
            })
            orden += 1

        plan[f"Dia {i}"] = rutina_dia

    return plan


@router.post("/generate", response_model=RoutineResponse, status_code=status.HTTP_201_CREATED)
def generate_routine(
    body: GenerateRoutineRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.dias_semana not in SPLITS:
        raise HTTPException(status_code=400, detail="dias_semana debe estar entre 2 y 6")

    plan = _build_routine(body.dias_semana, body.sexo, body.enfoque)
    routine = Routine(
        user_id=current_user.id,
        dias_semana=body.dias_semana,
        sexo=body.sexo,
        enfoque=body.enfoque,
        plan_json=json.dumps(plan),
    )
    db.add(routine)
    db.commit()
    db.refresh(routine)

    return RoutineResponse(
        id=str(routine.id),
        dias_semana=routine.dias_semana,
        sexo=routine.sexo,
        enfoque=routine.enfoque,
        rutina={k: [ExerciseInRoutine(**ex) for ex in v] for k, v in plan.items()},
        created_at=routine.created_at.isoformat(),
    )


@router.get("/me", response_model=RoutineResponse | None)
def get_my_routine(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    routine = (
        db.query(Routine)
        .filter(Routine.user_id == current_user.id)
        .order_by(Routine.created_at.desc())
        .first()
    )
    if not routine:
        return None
    plan = json.loads(routine.plan_json)
    return RoutineResponse(
        id=str(routine.id),
        dias_semana=routine.dias_semana,
        sexo=routine.sexo,
        enfoque=routine.enfoque,
        rutina={k: [ExerciseInRoutine(**ex) for ex in v] for k, v in plan.items()},
        created_at=routine.created_at.isoformat(),
    )


# ---------------------------------------------------------------------------
# Log de ejercicios + Heatmap
# ---------------------------------------------------------------------------

@router.post("/log", status_code=status.HTTP_201_CREATED)
def log_exercise(
    body: LogExerciseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.grupo_primario not in MUSCLE_GROUPS:
        raise HTTPException(status_code=400, detail=f"grupo_primario inválido: {body.grupo_primario}")

    active = (
        db.query(TrainingSession)
        .filter(TrainingSession.user_id == current_user.id, TrainingSession.hora_salida.is_(None))
        .first()
    )
    log = ExerciseLog(
        user_id=current_user.id,
        session_id=active.id if active else None,
        nombre=body.nombre,
        grupo_primario=body.grupo_primario,
        grupos_secundarios=body.grupos_secundarios,
        series=body.series,
        reps=body.reps,
    )
    db.add(log)
    db.commit()
    return {"status": "ok"}


@router.get("/heatmap")
def get_heatmap(
    range: str = "week",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = now_lima()
    cutoff = None
    if range == "day":
        cutoff = now - timedelta(days=1)
    elif range == "week":
        cutoff = now - timedelta(days=7)
    elif range == "month":
        cutoff = now - timedelta(days=30)
    elif range != "all":
        raise HTTPException(status_code=400, detail="range debe ser day, week, month o all")

    q = db.query(ExerciseLog).filter(ExerciseLog.user_id == current_user.id)
    if cutoff:
        q = q.filter(ExerciseLog.created_at >= cutoff)

    counts: dict[str, float] = {g: 0.0 for g in MUSCLE_GROUPS}
    for log in q.all():
        counts[log.grupo_primario] = counts.get(log.grupo_primario, 0) + log.series
        for sec in (log.grupos_secundarios or []):
            counts[sec] = counts.get(sec, 0) + log.series * 0.5

    max_v = max(counts.values()) if counts.values() else 0
    normalized = {k: (v / max_v if max_v > 0 else 0.0) for k, v in counts.items()}

    return {
        "range": range,
        "max_sets": max_v,
        "groups": normalized,
        "raw": counts,
    }


# ===========================================================================
# Recomendación de rutina basada en preferencias + patrón histórico (v8)
# ===========================================================================

# --- Inferencia de enfoque por moda ponderada ---
REP_BUCKETS = [
    ("fuerza",       1, 6),
    ("hipertrofia",  7, 12),
    ("recomp",      13, 15),
    ("resistencia", 16, 99),
]
TIE_PRIORITY = {"hipertrofia": 0, "recomp": 1, "fuerza": 2, "resistencia": 3}


def _bucket_for(reps: int) -> str:
    for name, lo, hi in REP_BUCKETS:
        if lo <= reps <= hi:
            return name
    return "hipertrofia"


def _pick_bucket(buckets: dict[str, float]) -> str:
    """max(sets) con desempate determinista (hipertrofia > recomp > fuerza > resistencia)."""
    return max(buckets.items(), key=lambda kv: (kv[1], -TIE_PRIORITY.get(kv[0], 99)))[0]


def infer_enfoque(logs: list[ExerciseLog]) -> tuple[str, dict, dict]:
    """Cuenta cada SET (ponderado por log.series) en su bucket de reps separando
    compuestos de aislados. El enfoque sale de la moda en compuestos; fallback aislados."""
    comp_dist: Counter[str] = Counter()
    iso_dist: Counter[str] = Counter()
    for l in logs:
        if l.reps is None:
            continue
        bucket = _bucket_for(l.reps)
        weight = l.series or 1
        if l.grupo_primario in COMPOUND_GROUPS:
            comp_dist[bucket] += weight
        else:
            iso_dist[bucket] += weight
    if comp_dist:
        return (_pick_bucket(dict(comp_dist)), dict(comp_dist), dict(iso_dist))
    if iso_dist:
        return (_pick_bucket(dict(iso_dist)), dict(comp_dist), dict(iso_dist))
    return ("hipertrofia", dict(comp_dist), dict(iso_dist))


# --- Frecuencia real (TZ-safe, sin extrapolar <7 días) ---
MIN_DAYS_FOR_FREQ_INFERENCE = 7


def _ensure_aware(dt):
    if dt is None:
        return None
    return dt if dt.tzinfo is not None else dt.replace(tzinfo=LIMA_TZ)


def compute_freq_per_week(user: User, db: Session) -> float | None:
    cutoff = now_lima() - timedelta(days=28)
    sessions = db.query(TrainingSession).filter(
        TrainingSession.user_id == user.id,
        TrainingSession.hora_entrada >= cutoff,
        TrainingSession.hora_salida.isnot(None),
    ).order_by(TrainingSession.hora_entrada.asc()).all()
    if not sessions:
        return None
    primera = _ensure_aware(sessions[0].hora_entrada)
    creado = _ensure_aware(user.created_at)
    inicio = max(d for d in (primera, creado, cutoff) if d is not None)
    dias_activos = (now_lima() - inicio).total_seconds() / 86400
    if dias_activos < MIN_DAYS_FOR_FREQ_INFERENCE:
        return None
    return len(sessions) / (dias_activos / 7)


# --- Volumen: cap previo + escalado dentro del cap ---
SETS_BUDGET = {30: 12, 45: 18, 60: 24, 75: 30, 90: 36, 120: 48}
MIN_COMPOUND_SETS = 3
MIN_ISOLATION_SETS = 2
MAX_EXERCISES_PER_DAY = 10


def _budget_for(minutes: int) -> int:
    return next((s for m, s in sorted(SETS_BUDGET.items()) if minutes <= m), 48)


def _exercises_per_day_cap(budget: int) -> int:
    """Cap deportivo + matemáticamente factible (mínimos por tipo respetan budget)."""
    return min(MAX_EXERCISES_PER_DAY, max(3, budget // 3))


def _prune_to_cap(plan_dia: list[dict], budget: int) -> list[dict]:
    """Garantiza: n_comp · MIN_COMP + n_iso · MIN_ISO ≤ budget."""
    compounds = [ex for ex in plan_dia if ex["grupo_primario"] in COMPOUND_GROUPS]
    isolations = [ex for ex in plan_dia if ex["grupo_primario"] not in COMPOUND_GROUPS]
    n_comp_max = min(len(compounds), budget // MIN_COMPOUND_SETS, MAX_EXERCISES_PER_DAY)
    keep_comp = compounds[:n_comp_max]
    remaining = budget - len(keep_comp) * MIN_COMPOUND_SETS
    n_iso_max = min(len(isolations), max(0, remaining // MIN_ISOLATION_SETS),
                    MAX_EXERCISES_PER_DAY - len(keep_comp))
    keep_iso = isolations[:n_iso_max]
    return keep_comp + keep_iso


def _scale_sets_to_budget(plan_dia: list[dict], budget: int) -> list[dict]:
    """Distribuye sets dentro del budget (pre-prune ya garantizó factibilidad).
    Compuestos primero (cap 5), después aislados (cap 4). total ≤ budget."""
    if not plan_dia:
        return plan_dia
    n = len(plan_dia)
    is_comp = [ex["grupo_primario"] in COMPOUND_GROUPS for ex in plan_dia]
    sets = [MIN_COMPOUND_SETS if c else MIN_ISOLATION_SETS for c in is_comp]
    total = sum(sets)
    while total < budget:
        added = False
        for i in range(n):
            if total >= budget:
                break
            if is_comp[i] and sets[i] < 5:
                sets[i] += 1; total += 1; added = True
        for i in range(n):
            if total >= budget:
                break
            if not is_comp[i] and sets[i] < 4:
                sets[i] += 1; total += 1; added = True
        if not added:
            break
    for i, ex in enumerate(plan_dia):
        ex["series"] = sets[i]
        # Reordenar para que compuestos queden primero (UX consistente)
    plan_dia.sort(key=lambda ex: (ex["grupo_primario"] not in COMPOUND_GROUPS, ex["orden"]))
    for i, ex in enumerate(plan_dia, start=1):
        ex["orden"] = i
    return plan_dia


def _build_routine_with_volume(dias: int, sexo: str, enfoque: str, minutes: int) -> dict:
    plan = _build_routine(dias, sexo, enfoque)
    budget = _budget_for(minutes)
    return {dia: _scale_sets_to_budget(_prune_to_cap(lista, budget), budget)
            for dia, lista in plan.items()}


# --- UPSERT atómico (lazy dialect resolution) ---

def _get_upsert_insert(db: Session):
    name = db.bind.dialect.name
    if name == "postgresql":
        from sqlalchemy.dialects.postgresql import insert as pg_insert
        return pg_insert
    from sqlalchemy.dialects.sqlite import insert as sqlite_insert
    return sqlite_insert


def _upsert_metrics(db: Session, user_id, enfoque: str | None, freq: float | None) -> None:
    insert_fn = _get_upsert_insert(db)
    stmt = insert_fn(UserMetrics).values(
        user_id=user_id,
        enfoque_inferido=enfoque,
        sesiones_por_semana=freq,
        last_computed_at=now_lima(),
    )
    stmt = stmt.on_conflict_do_update(
        index_elements=["user_id"],
        set_={
            "enfoque_inferido": stmt.excluded.enfoque_inferido,
            "sesiones_por_semana": stmt.excluded.sesiones_por_semana,
            "last_computed_at": stmt.excluded.last_computed_at,
        },
    )
    db.execute(stmt)
    db.commit()


def _bulk_upsert_metrics(db: Session, rows: list[dict]) -> None:
    if not rows:
        return
    insert_fn = _get_upsert_insert(db)
    stmt = insert_fn(UserMetrics).values(rows)
    stmt = stmt.on_conflict_do_update(
        index_elements=["user_id"],
        set_={
            "enfoque_inferido": stmt.excluded.enfoque_inferido,
            "sesiones_por_semana": stmt.excluded.sesiones_por_semana,
            "last_computed_at": stmt.excluded.last_computed_at,
        },
    )
    db.execute(stmt)
    db.commit()


# --- Cómputo en memoria + cold-path bg-task ---

def _compute_metrics_in_memory(user: User, db: Session) -> tuple[str, float | None]:
    cutoff = now_lima() - timedelta(days=28)
    logs = db.query(ExerciseLog).filter(
        ExerciseLog.user_id == user.id,
        ExerciseLog.created_at >= cutoff,
    ).all()
    enfoque, _, _ = infer_enfoque(logs)
    freq = compute_freq_per_week(user, db)
    return (enfoque, freq)


def _persist_metrics_bg(user_id, enfoque: str, freq: float | None) -> None:
    """Background task post-response: SOLO persiste valores ya calculados."""
    db = SessionLocal()
    try:
        _upsert_metrics(db, user_id, enfoque, freq)
    except Exception as e:
        db.rollback()
        logger.warning("persist_metrics_bg fallo user=%s: %s", user_id, e)
    finally:
        db.close()


# --- Endpoint: GET /routines/recommended ---

STALE_THRESHOLD_HOURS = 48


@router.get("/recommended", response_model=None)
def get_recommended_routine(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Recomendación viva basada en preferencias declaradas + patrón histórico."""
    dias = current_user.preferred_days_per_week or 3
    minutes = current_user.preferred_minutes_per_session or 60
    sexo = current_user.sexo or "Otro"

    m = db.query(UserMetrics).filter(UserMetrics.user_id == current_user.id).first()
    fresh = (
        m and m.last_computed_at and
        (now_lima() - _ensure_aware(m.last_computed_at)).total_seconds() < STALE_THRESHOLD_HOURS * 3600
    )

    if fresh:
        enfoque = m.enfoque_inferido or "hipertrofia"
        freq = m.sesiones_por_semana
    else:
        enfoque, freq = _compute_metrics_in_memory(current_user, db)
        background_tasks.add_task(_persist_metrics_bg, current_user.id, enfoque, freq)

    warning = None
    if freq is not None and freq < dias - 0.5:
        warning = (
            f"Tu objetivo es {dias} días/sem, pero las últimas 4 semanas "
            f"entrenaste {freq:.1f} veces/sem en promedio."
        )

    plan = _build_routine_with_volume(dias, sexo, enfoque, minutes)

    return {
        "id": "recommended",
        "dias_semana": dias,
        "sexo": sexo,
        "enfoque": enfoque,
        "minutes_per_session": minutes,
        "rutina": {k: [ExerciseInRoutine(**ex) for ex in v] for k, v in plan.items()},
        "warning": warning,
        "created_at": now_lima().isoformat(),
    }


# --- Endpoint: POST /routines/save (persiste plan exacto del cliente) ---

DAY_KEY_RE = re.compile(r"^Dia [1-7]$")


class SaveRoutineRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    dias_semana: int = Field(..., ge=2, le=6)
    sexo: str = Field(..., pattern="^(M|F|Otro)$")
    enfoque: str = Field(..., pattern="^(hipertrofia|fuerza|perdida_grasa|resistencia|recomp)$")
    rutina: dict[str, list[ExerciseInRoutine]] = Field(...)

    @field_validator("rutina")
    @classmethod
    def _validate_rutina(cls, v: dict[str, list[ExerciseInRoutine]]) -> dict:
        if not v:
            raise ValueError("rutina vacía")
        if len(v) > 7:
            raise ValueError("máx 7 días")
        for dia, exs in v.items():
            if not DAY_KEY_RE.match(dia):
                raise ValueError(f"clave de día inválida: {dia}")
            if len(exs) > MAX_EXERCISES_PER_DAY:
                raise ValueError(f"{dia}: máx {MAX_EXERCISES_PER_DAY} ejercicios")
            for ex in exs:
                if ex.grupo_primario not in MUSCLE_GROUPS:
                    raise ValueError(f"grupo_primario inválido: {ex.grupo_primario}")
        return v


@router.post("/save", response_model=RoutineResponse, status_code=201)
def save_routine(
    body: SaveRoutineRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Persiste el plan EXACTO que el alumno ve en pantalla. NO regenera."""
    if len(body.rutina) != body.dias_semana:
        raise HTTPException(
            status_code=400,
            detail=f"rutina tiene {len(body.rutina)} días pero dias_semana={body.dias_semana}",
        )
    plan_dicts = {k: [ex.model_dump() for ex in v] for k, v in body.rutina.items()}
    routine = Routine(
        user_id=current_user.id,
        dias_semana=body.dias_semana,
        sexo=body.sexo,
        enfoque=body.enfoque,
        plan_json=json.dumps(plan_dicts),
    )
    db.add(routine)
    db.commit()
    db.refresh(routine)
    return RoutineResponse(
        id=str(routine.id),
        dias_semana=routine.dias_semana,
        sexo=routine.sexo,
        enfoque=routine.enfoque,
        rutina=body.rutina,
        created_at=routine.created_at.isoformat(),
    )
