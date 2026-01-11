import traceback
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routers import (
    auth_router,
    queries_router,
    extraction_router,
    export_router,
    metadata_router,
    base_terms_router,
    data_quality_router,
    positions_router,
    queue_router,
)

app = FastAPI(
    title="Maps Query Dashboard API",
    description="API for managing Google Maps business data extraction queries",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api")
app.include_router(queries_router, prefix="/api")
app.include_router(extraction_router, prefix="/api")
app.include_router(export_router, prefix="/api")
app.include_router(metadata_router, prefix="/api")
app.include_router(base_terms_router, prefix="/api")
app.include_router(data_quality_router, prefix="/api")
app.include_router(positions_router, prefix="/api")
app.include_router(queue_router, prefix="/api")


@app.get("/")
async def root():
    return {
        "message": "Maps Query Dashboard API",
        "docs": "/docs",
        "version": "1.0.0",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.on_event("startup")
async def startup_event():
    """Initialize Firebase on startup (non-blocking)."""
    try:
        from .services.firebase_service import FirebaseService
        firebase_service = FirebaseService()
        print("Firebase initialized successfully on startup")
    except Exception as e:
        print(f"Firebase initialization error on startup: {e}")
        traceback.print_exc()
