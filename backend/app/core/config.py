from zoneinfo import ZoneInfo
from datetime import datetime
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator


LIMA_TZ = ZoneInfo("America/Lima")


def now_lima() -> datetime:
    return datetime.now(tz=LIMA_TZ)


INSECURE_SECRETS = {
    "clave_secreta_de_prueba_32_chars_minimo_aqui",
    "otra_clave_qr_diferente_32_chars_minimo",
    "cambia_esto_por_una_clave_segura_de_64_chars",
    "otra_clave_diferente_para_los_tokens_de_qr",
    "dev-secret-change-in-production-min-32-chars-long",
    "dev-qr-secret-change-in-production-32ch",
}


class Settings(BaseSettings):
    DATABASE_URL: str

    SECRET_KEY: str
    QR_SECRET_KEY: str

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    QR_TOKEN_EXPIRE_SECONDS: int = 30

    GYM_AUTO_KILL_MINUTES: int = 120
    SCHEDULER_INTERVAL_MINUTES: int = 5
    USED_TOKEN_CLEANUP_INTERVAL_MINUTES: int = 60

    # CORS: comma-separated origins; Expo web suele usar 8081 u otros puertos
    CORS_ORIGINS: str = (
        "http://localhost:8081,http://127.0.0.1:8081,"
        "http://localhost:19006,http://127.0.0.1:19006,"
        "http://localhost:3000,http://127.0.0.1:3000"
    )
    # Cualquier localhost / 127.0.0.1 con puerto — SOLO en dev.
    # En producción se ignora (ver property cors_origin_regex_effective).
    CORS_ORIGIN_REGEX: str = r"https?://(localhost|127\.0\.0\.1)(:\d+)?$"

    # Rate limits (requests por ventana)
    RATE_LIMIT_LOGIN: str = "10/minute"
    RATE_LIMIT_REGISTER: str = "5/minute"
    RATE_LIMIT_CHECKIN: str = "60/minute"
    RATE_LIMIT_REFRESH: str = "30/minute"

    APP_ENV: str = "development"

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    @field_validator("SECRET_KEY", "QR_SECRET_KEY")
    @classmethod
    def _no_insecure_in_prod(cls, v: str, info) -> str:
        if len(v) < 32:
            raise ValueError(f"{info.field_name} debe tener al menos 32 caracteres")
        return v

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() == "production"

    @property
    def cors_origin_regex_effective(self) -> str | None:
        """Regex CORS solo activo fuera de prod — en prod solo whitelist explícita."""
        return None if self.is_production else self.CORS_ORIGIN_REGEX

    def assert_production_safe(self) -> None:
        """Falla el arranque si APP_ENV=production y hay secretos inseguros."""
        if not self.is_production:
            return
        if self.SECRET_KEY in INSECURE_SECRETS or self.QR_SECRET_KEY in INSECURE_SECRETS:
            raise RuntimeError(
                "SECRET_KEY / QR_SECRET_KEY tienen valores por defecto inseguros. "
                "Generá claves con `openssl rand -hex 32` antes de ir a producción."
            )
        if not self.cors_origins_list:
            raise RuntimeError(
                "CORS_ORIGINS vacío en producción. Definí los orígenes permitidos."
            )


settings = Settings()
settings.assert_production_safe()
