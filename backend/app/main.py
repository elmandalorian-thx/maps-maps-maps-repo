from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .services.firebase_service import FirebaseService
from .routers import (
    auth_router,
    queries_router,
    extraction_router,
    export_router,
    metadata_router,
)

# Initialize Firebase at startup
firebase_service = FirebaseService()

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
