import os

class Settings:
    PROJECT_NAME: str = "AI Question Paper Generation & Management System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "academic-super-secure-jwt-secret-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 365  # 1 year session expiration
    
    # AI Engine settings
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "auto") # auto, gemini, openai, local
    
    # Storage & Paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    is_vercel: bool = os.getenv("VERCEL") is not None or os.getenv("VERCEL_ENV") is not None
    
    if is_vercel:
        temp_dir: str = "/tmp"
        UPLOAD_DIR: str = os.path.join(temp_dir, "uploads")
        EXPORT_DIR: str = os.path.join(temp_dir, "exports")
        default_db: str = f"sqlite:///{os.path.join(temp_dir, 'exam_generator.db')}"
    else:
        UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads")
        EXPORT_DIR: str = os.path.join(BASE_DIR, "exports")
        default_db: str = "sqlite:///./exam_generator.db"

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", default_db)

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.EXPORT_DIR, exist_ok=True)

