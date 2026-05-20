from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
import os


class Settings(BaseSettings):
    PROJECT_NAME: str = "PolicyBot API"
    API_V1_STR: str = "/api/v1"
    
    # Database Settings
    DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/policybot",
        description="PostgreSQL Connection Database URL"
    )
    
    # JWT security settings
    SECRET_KEY: str = Field(
        default="45f096be2e89643198ab764f43de90c29215bb55428a2a4b8686f32e67d26859",
        description="Key used to encrypt/decrypt JWT tokens"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Pydantic Settings configuration to load from .env
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
