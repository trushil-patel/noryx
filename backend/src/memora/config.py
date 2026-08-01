from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    port: int = 5000
    frontend_origins: list[str] = ["http://localhost:3000"]
    supabase_url: str
    supabase_publishable_key: str
    supabase_service_role_key: str
    gemini_api_key: str
    gemini_model: str = "gemini-2.5-flash"
    embedding_model: str = "gemini-embedding-001"
    fetch_timeout_seconds: float = 10.0
    max_page_bytes: int = 5_000_000
    max_redirects: int = 5
    enable_diagnostic_endpoints: bool = False

    @field_validator("frontend_origins", mode="before")
    @classmethod
    def parse_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
