from pydantic_settings import BaseSettings, SettingsConfigDict


class Setting(BaseSettings):
    database_url: str
    jwt_secret_key: str
    jwt_issuer: str
    jwt_audience: str
    jwt_expiry_minutes: int = 60
    jwt_algorithm: str
    frontend_origin: str = "http://localhost:4200"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding = "utf-8"
    )

settings = Setting()