# Importar todos los modelos aquí garantiza que SQLAlchemy los registre
# en Base.metadata antes de llamar a create_all()
from app.models.faculty import Faculty
from app.models.user import User
from app.models.training_session import TrainingSession
from app.models.qr_code import QRCode
from app.models.gym_config import GymConfig
from app.models.exercise import Exercise, Routine, ExerciseLog
from app.models.user_metrics import UserMetrics

__all__ = ["Faculty", "User", "TrainingSession", "QRCode", "GymConfig", "Exercise", "Routine", "ExerciseLog", "UserMetrics"]
