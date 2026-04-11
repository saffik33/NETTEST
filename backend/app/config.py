import json
import logging

from pydantic import model_validator
from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/nettest.db"
    CORS_ORIGINS: str = '["http://localhost:5173"]'
    DEFAULT_PING_TARGET: str = "8.8.8.8"
    DEFAULT_DNS_TARGETS: str = '["google.com","cloudflare.com","github.com"]'
    DEFAULT_TRACEROUTE_TARGET: str = "8.8.8.8"
    SPEED_TEST_TIMEOUT: int = 60
    PORT: int = 8000
    API_KEY: str = ""
    LOG_LEVEL: str = "INFO"

    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_USE_TLS: bool = True
    SMTP_FROM_EMAIL: str = ""

    @model_validator(mode="after")
    def validate_json_fields(self) -> "Settings":
        # Auto-convert plain strings to JSON arrays for CORS_ORIGINS
        # Accepts: '["http://example.com"]', 'http://example.com', 'http://a.com,http://b.com'
        try:
            parsed = json.loads(self.CORS_ORIGINS)
            if not isinstance(parsed, list):
                raise ValueError
        except (json.JSONDecodeError, TypeError, ValueError):
            # Treat as comma-separated origins, add https:// if no scheme
            origins = [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]
            origins = [
                f"https://{o}" if not o.startswith(("http://", "https://")) else o
                for o in origins
            ]
            self.CORS_ORIGINS = json.dumps(origins)

        try:
            json.loads(self.DEFAULT_DNS_TARGETS)
        except (json.JSONDecodeError, TypeError):
            raise ValueError(
                f"DEFAULT_DNS_TARGETS must be a JSON array, got: {self.DEFAULT_DNS_TARGETS!r}"
            )
        return self

    @property
    def cors_origins_list(self) -> list[str]:
        return json.loads(self.CORS_ORIGINS)

    @property
    def dns_targets_list(self) -> list[str]:
        return json.loads(self.DEFAULT_DNS_TARGETS)

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
