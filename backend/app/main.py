import os
import sqlalchemy as sa
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .config import settings
from .database import engine, Base, SessionLocal
from .services.image_service import UPLOAD_DIR
from .routers import (
    auth_router,
    posts_router,
    interactions_router,
    replies_router,
    users_router,
    topics_router,
    communities_router,
    notifications_router,
    uploads_router,
    ai_router
)

# Initialize database tables and ensure new columns exist without data loss
def ensure_schema_migrations():
    with engine.connect() as conn:
        try:
            conn.execute(sa.text("ALTER TABLE users ADD COLUMN banner_url TEXT;"))
            conn.commit()
        except Exception:
            pass
        try:
            conn.execute(sa.text("ALTER TABLE posts ADD COLUMN images TEXT;"))
            conn.commit()
        except Exception:
            pass
        try:
            conn.execute(sa.text("ALTER TABLE posts ADD COLUMN repost_of_id VARCHAR(36);"))
            conn.commit()
        except Exception:
            pass

ensure_schema_migrations()
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Complain AI API",
    description="The social network where AI gets called out. Backend API for complaints, feeds, reactions, and AI Rant Assistant.",
    version="1.0.0"
)

import mimetypes

# Ensure Windows recognizes webp and other image mime types properly
mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("image/jpeg", ".jpg")
mimetypes.add_type("image/jpeg", ".jpeg")
mimetypes.add_type("image/png", ".png")

# Mount local uploads directory for safe image serving
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api/v1
app.include_router(auth_router.router, prefix=settings.API_V1_STR)
app.include_router(posts_router.router, prefix=settings.API_V1_STR)
app.include_router(interactions_router.router, prefix=settings.API_V1_STR)
app.include_router(replies_router.router, prefix=settings.API_V1_STR)
app.include_router(users_router.router, prefix=settings.API_V1_STR)
app.include_router(topics_router.router, prefix=settings.API_V1_STR)
app.include_router(communities_router.router, prefix=settings.API_V1_STR)
app.include_router(notifications_router.router, prefix=settings.API_V1_STR)
app.include_router(uploads_router.router, prefix=settings.API_V1_STR)
app.include_router(ai_router.router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def startup_event():
    # Safely ensure schema columns exist without wiping data
    with engine.connect() as conn:
        try:
            conn.execute(sa.text("ALTER TABLE users ADD COLUMN banner_url TEXT;"))
            conn.commit()
        except Exception:
            pass
        try:
            conn.execute(sa.text("ALTER TABLE posts ADD COLUMN images TEXT;"))
            conn.commit()
        except Exception:
            pass
    Base.metadata.create_all(bind=engine)

    # Automatically seed initial database if empty or missing communities/follows
    from .seed import seed_database_if_empty
    db = SessionLocal()
    try:
        seed_database_if_empty(db)
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "name": "Complain AI API",
        "tagline": "The social network where AI gets called out.",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
