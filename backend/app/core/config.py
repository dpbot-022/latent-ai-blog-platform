import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

class Settings:
    PROJECT_NAME: str = "LATENT — Production AI & Systems Engineering Journal"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security & JWT (Day 3)
    SECRET_KEY: str = os.getenv("SECRET_KEY", "nexusai-production-super-secret-key-change-in-prod-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database (Day 4)
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/nexusai.db")
    
    # File Uploads (Day 4)
    UPLOAD_DIR: Path = BASE_DIR / "frontend" / "uploads"
    MAX_UPLOAD_SIZE_MB: int = 5
    ALLOWED_EXTENSIONS: set = {"png", "jpg", "jpeg", "webp", "gif"}
    
    # CORS (Day 3)
    BACKEND_CORS_ORIGINS: list[str] = ["*"]
    
    # Rate Limiting (Day 4)
    RATE_LIMIT_PER_MINUTE: int = 120

settings = Settings()
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
