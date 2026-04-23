# Importar todos los modelos aquí garantiza que SQLAlchemy los registre
# en Base.metadata antes de llamar a create_all()
from app.models.faculty import Faculty
from app.models.user import User
from app.models.training_session import TrainingSession
from app.models.used_token import UsedToken
from app.models.gym_config import GymConfig

__all__ = ["Faculty", "User", "TrainingSession", "UsedToken", "GymConfig"]
