import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from backend.app.core.config import settings, BASE_DIR
from backend.app.core.database import Base, engine
from backend.app.middleware.audit_middleware import ObservabilityAndRateLimitMiddleware
from backend.app.routers.auth import router as auth_router
from backend.app.routers.posts import router as posts_router
from backend.app.routers.comments import router as comments_router
from backend.app.routers.likes import router as likes_router
from backend.app.routers.exports import router as exports_router
from backend.app.routers.system import router as system_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database tables are created
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown logic if any

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Production-Grade Multi-Tenant Technical Publication Platform with RBAC, JWT Auth, and High-Performance Lakehouse & AI Systems deep dives.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# 1. GZip Compression (Day 4: Payload Optimization)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 2. CORS Middleware (Day 3: Security & Cross-Origin Rules)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Observability & Rate Limiting Middleware (Day 4 & 5)
app.add_middleware(ObservabilityAndRateLimitMiddleware)

# Include API Routers (Day 2: REST URI Design & Versioning)
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(posts_router, prefix=settings.API_V1_STR)
app.include_router(comments_router, prefix=settings.API_V1_STR)
app.include_router(likes_router, prefix=settings.API_V1_STR)
app.include_router(exports_router, prefix=settings.API_V1_STR)
app.include_router(system_router)

# Mount Static Uploads
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Mount Frontend static directory
frontend_dir = BASE_DIR / "frontend"
if frontend_dir.exists():
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
