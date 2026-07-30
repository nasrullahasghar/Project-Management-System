from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Equivalent to appsettings.json + IConfiguration in the .NET project.
    Values are read from a .env file (see .env.example) or real environment variables.
    """

    database_url: str
    jwt_secret_key: str
    jwt_issuer: str
    jwt_audience: str
    jwt_expiry_minutes: int = 60
    frontend_origin: str = "http://localhost:4200"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


# Import this single instance anywhere you need config values,
# same idea as injecting IConfiguration in a .NET controller.
settings = Settings()
