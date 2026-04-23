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


def cleanup_expired_used_tokens() -> None:
    """Borra los JTI vencidos de la tabla used_tokens para que no crezca sin límite."""
    from app.db.session import SessionLocal
    from app.models.used_token import UsedToken

    db = SessionLocal()
    try:
        deleted = (
            db.query(UsedToken)
            .filter(UsedToken.expires_at < now_lima())
            .delete(synchronize_session=False)
        )
        if deleted:
            db.commit()
            logger.info("Cleanup used_tokens: %d registros borrados", deleted)
    except Exception as e:
        db.rollback()
        logger.error("Error en cleanup_expired_used_tokens: %s", e)
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
        cleanup_expired_used_tokens,
        trigger="interval",
        minutes=settings.USED_TOKEN_CLEANUP_INTERVAL_MINUTES,
        id="cleanup_used_tokens",
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
