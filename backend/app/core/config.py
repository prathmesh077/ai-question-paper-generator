import os

def load_env_files():
    """Automatically loads environment variables from .env.local, .env, or env.local if present."""
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    candidate_paths = [
        os.path.join(base_dir, ".env.local"),
        os.path.join(base_dir, ".env"),
        os.path.join(base_dir, "env.local"),
        os.path.join(base_dir, "frontend", ".env.local"),
        os.path.join(base_dir, "frontend", ".env"),
        os.path.join(base_dir, "frontend", "env.local"),
    ]
    for env_file in candidate_paths:
        if os.path.exists(env_file):
            try:
                with open(env_file, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            key, val = line.split("=", 1)
                            key = key.strip()
                            val = val.strip().strip("'\"")
                            if key and key not in os.environ:
                                os.environ[key] = val
            except Exception:
                pass

load_env_files()

class Settings:
    PROJECT_NAME: str = "AI Question Paper Generation & Management System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "academic-super-secure-jwt-secret-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 365  # 1 year session expiration
    
    # AI Engine settings
    GEMINI_API_KEY: str = (
        os.getenv("GEMINI_API_KEY")
        or os.getenv("GOOGLE_API_KEY")
        or os.getenv("GOOGLE_GEMINI_API_KEY")
        or os.getenv("VITE_GEMINI_API_KEY")
        or ""
    ).strip()
    
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "").strip()
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "gemini" if GEMINI_API_KEY else "auto")
    
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
