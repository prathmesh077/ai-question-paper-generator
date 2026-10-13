import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.core.config import settings
from backend.app.core.database import engine, Base, SessionLocal
from backend.app.services.seed_data import seed_initial_data

from backend.app.api.auth import router as auth_router
from backend.app.api.syllabus import router as syllabus_router
from backend.app.api.questions import router as questions_router
from backend.app.api.generator import router as generator_router
from backend.app.api.papers import router as papers_router
from backend.app.api.analytics import router as analytics_router
from backend.app.api.quizzes import router as quizzes_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    
    # Pre-seed initial database state
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title="AI Question Paper Generation & Management System",
    description="Automated university-standard question paper generation grounded in syllabus via RAG, intelligent anti-duplicate detection, Bloom's taxonomy balancing, and multi-format export (PDF/DOCX).",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for exports
app.mount("/static/exports", StaticFiles(directory=settings.EXPORT_DIR), name="exports")

# Include Routers
app.include_router(auth_router, prefix="/api")
app.include_router(syllabus_router, prefix="/api")
app.include_router(questions_router, prefix="/api")
app.include_router(generator_router, prefix="/api")
app.include_router(papers_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(quizzes_router, prefix="/api")


@app.get("/api/health")
def health():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "api_v1": "/api",
        "status": "online"
    }

# Mount React frontend static assets if built
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
else:
    @app.get("/")
    def root():
        return {
            "system": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "docs_url": "/docs",
            "api_v1": "/api",
            "status": "online",
            "message": "Frontend build not detected. Run 'npm run dev' or 'npm run build' in frontend/"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
