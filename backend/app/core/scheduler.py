import logging
from datetime import timedelta

from apscheduler.schedulers.background import BackgroundScheduler

from app.core.config import settings, now_lima

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler(timezone="America/Lima")


def auto_kill_expired_sessions() -> None:
    """
    Cierra todas las sesiones que llevan más de GYM_AUTO_KILL_MINUTES sin
    registrar salida. Marca 'metodo_salida' como 'auto_kill' y calcula los
    puntos con penalización del 20%.
    """
    # Importación tardía para evitar circular imports en el arranque
    from app.db.session import SessionLocal
    from app.models.training_session import TrainingSession, ExitMethod
    from app.models.user import User, UserRole
    from app.models.faculty import Faculty
    from sqlalchemy import and_

    db = SessionLocal()
    try:
        cutoff = now_lima() - timedelta(minutes=settings.GYM_AUTO_KILL_MINUTES)

        expired: list[TrainingSession] = (
            db.query(TrainingSession)
            .filter(
                and_(
                    TrainingSession.hora_salida.is_(None),
                    TrainingSession.hora_entrada <= cutoff,
                )
            )
            .all()
        )

        if not expired:
            return

        logger.info("Auto-kill: cerrando %d sesiones expiradas", len(expired))

        for session in expired:
            hora_salida = now_lima()
            session.hora_salida = hora_salida
            session.metodo_salida = ExitMethod.auto_kill

            # Calcular duración y puntos con penalización del 20%
            minutos = int((hora_salida - session.hora_entrada).total_seconds() // 60)
            puntos_base = _calcular_puntos_base(minutos)
            session.puntos_otorgados = int(puntos_base * 0.80)

            # Actualizar puntos del usuario (solo si es student)
            user: User = db.query(User).filter(User.id == session.user_id).first()
            if user and user.role == UserRole.student and session.puntos_otorgados > 0:
                user.points += session.puntos_otorgados
                # Actualizar total de la facultad
                if user.faculty_id:
                    faculty: Faculty = db.query(Faculty).filter(
                        Faculty.id == user.faculty_id
                    ).first()
                    if faculty:
                        faculty.total_points += session.puntos_otorgados

        db.commit()
        logger.info("Auto-kill completado: %d sesiones cerradas", len(expired))

    except Exception as e:
        db.rollback()
        logger.error("Error en auto_kill_expired_sessions: %s", e)
    finally:
        db.close()


def cleanup_expired_qr_codes() -> None:
    """Borra los QR codes vencidos para que la tabla no crezca sin límite."""
    from app.db.session import SessionLocal
    from app.models.qr_code import QRCode

    db = SessionLocal()
    try:
        deleted = (
            db.query(QRCode)
            .filter(QRCode.expires_at < now_lima())
            .delete(synchronize_session=False)
        )
        if deleted:
            db.commit()
            logger.info("Cleanup qr_codes: %d registros borrados", deleted)
    except Exception as e:
        db.rollback()
        logger.error("Error en cleanup_expired_qr_codes: %s", e)
    finally:
        db.close()


def update_user_metrics() -> None:
    """3 AM Lima: recalcula enfoque + frecuencia para usuarios activos en últimas 4 semanas.
    Usa 4 queries agregadas + 1 bulk UPSERT — escalable a miles de usuarios."""
    from app.db.session import SessionLocal
    from app.models.exercise import ExerciseLog
    from app.models.training_session import TrainingSession
    from app.models.user import User
    from app.api.v1.routines import (
        COMPOUND_GROUPS, MIN_DAYS_FOR_FREQ_INFERENCE,
        _bulk_upsert_metrics, _ensure_aware, _pick_bucket,
    )
    from sqlalchemy import case, func

    cutoff = now_lima() - timedelta(days=28)
    db = SessionLocal()
    try:
        # Q1: distribución de buckets de reps por (user_id, bucket, is_compound)
        is_compound_case = case(
            (ExerciseLog.grupo_primario.in_(COMPOUND_GROUPS), 1),
            else_=0,
        ).label("is_compound")
        rep_bucket_case = case(
            (ExerciseLog.reps <= 6, "fuerza"),
            (ExerciseLog.reps <= 12, "hipertrofia"),
            (ExerciseLog.reps <= 15, "recomp"),
            else_="resistencia",
        ).label("bucket")
        rows = (
            db.query(
                ExerciseLog.user_id,
                rep_bucket_case,
                is_compound_case,
                func.sum(ExerciseLog.series).label("total_sets"),
            )
            .filter(ExerciseLog.created_at >= cutoff, ExerciseLog.reps.isnot(None))
            .group_by(ExerciseLog.user_id, rep_bucket_case, is_compound_case)
            .all()
        )
        per_user_dist: dict = {}
        for uid, bucket, is_comp, total in rows:
            per_user_dist.setdefault(uid, {})[(bucket, is_comp)] = float(total or 0)

        # Q2: count de sesiones cerradas por user
        session_counts = dict(
            db.query(TrainingSession.user_id, func.count(TrainingSession.id))
            .filter(TrainingSession.hora_entrada >= cutoff,
                    TrainingSession.hora_salida.isnot(None))
            .group_by(TrainingSession.user_id)
            .all()
        )

        # Q3: primera sesión por user (en la ventana)
        first_session = dict(
            db.query(TrainingSession.user_id, func.min(TrainingSession.hora_entrada))
            .filter(TrainingSession.hora_entrada >= cutoff)
            .group_by(TrainingSession.user_id)
            .all()
        )

        active_user_ids = list(set(per_user_dist.keys()) | set(session_counts.keys()))

        # Q4: created_at de los users activos (bulk)
        users_created = dict(
            db.query(User.id, User.created_at)
            .filter(User.id.in_(active_user_ids))
            .all()
        ) if active_user_ids else {}
    finally:
        db.close()

    # Procesamiento in-memory (sin tocar DB)
    rows_to_upsert = []
    skipped = 0
    for uid in active_user_ids:
        try:
            dist = per_user_dist.get(uid, {})
            comp_buckets = {b: s for (b, c), s in dist.items() if c == 1}
            iso_buckets = {b: s for (b, c), s in dist.items() if c == 0}
            if comp_buckets:
                enfoque = _pick_bucket(comp_buckets)
            elif iso_buckets:
                enfoque = _pick_bucket(iso_buckets)
            else:
                enfoque = "hipertrofia"

            count = session_counts.get(uid, 0)
            primera = _ensure_aware(first_session.get(uid))
            creado = _ensure_aware(users_created.get(uid))
            inicio = max(d for d in (primera, creado, cutoff) if d is not None) if primera else None
            freq = None
            if inicio:
                dias = (now_lima() - inicio).total_seconds() / 86400
                if dias >= MIN_DAYS_FOR_FREQ_INFERENCE:
                    freq = count / (dias / 7)

            rows_to_upsert.append({
                "user_id": uid,
                "enfoque_inferido": enfoque,
                "sesiones_por_semana": freq,
                "last_computed_at": now_lima(),
            })
        except Exception as e:
            skipped += 1
            logger.warning("update_user_metrics skip user=%s: %s", uid, e)

    db = SessionLocal()
    try:
        _bulk_upsert_metrics(db, rows_to_upsert)
        logger.info("user_metrics: %d upserts (skipped %d, total activos %d)",
                    len(rows_to_upsert), skipped, len(active_user_ids))
    except Exception as e:
        logger.error("bulk upsert fallo: %s", e)
    finally:
        db.close()


def _calcular_puntos_base(minutos: int) -> int:
    """
    Fórmula de puntos: 10 puntos base por sesión + 1 punto por cada 5 minutos.
    Esta función centraliza la lógica para que sea idéntica en check-out manual y auto-kill.
    """
    return 10 + (minutos // 5)


def start_scheduler() -> None:
    scheduler.add_job(
        auto_kill_expired_sessions,
        trigger="interval",
        minutes=settings.SCHEDULER_INTERVAL_MINUTES,
        id="auto_kill_sessions",
        replace_existing=True,
        max_instances=1,  # Evita solapamiento si el job tarda más de lo esperado
    )
    scheduler.add_job(
        cleanup_expired_qr_codes,
        trigger="interval",
        minutes=settings.USED_TOKEN_CLEANUP_INTERVAL_MINUTES,
        id="cleanup_qr_codes",
        replace_existing=True,
        max_instances=1,
    )
    scheduler.add_job(
        update_user_metrics,
        trigger="cron",
        hour=3, minute=0,  # 3 AM Lima
        id="user_metrics_nightly",
        replace_existing=True,
        max_instances=1,
    )
    scheduler.start()
    logger.info(
        "Scheduler iniciado: auto-kill cada %d min (límite %d min); cleanup QR cada %d min",
        settings.SCHEDULER_INTERVAL_MINUTES,
        settings.GYM_AUTO_KILL_MINUTES,
        settings.USED_TOKEN_CLEANUP_INTERVAL_MINUTES,
    )


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler detenido")
