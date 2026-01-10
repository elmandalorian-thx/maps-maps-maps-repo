import os
import json
from dotenv import load_dotenv

# Load environment variables from backend/.env first, then fallback to parent .env
backend_env = os.path.join(os.path.dirname(__file__), '..', '.env')
parent_env = os.path.join(os.path.dirname(__file__), '..', '..', '.env')

if os.path.exists(backend_env):
    load_dotenv(backend_env)
elif os.path.exists(parent_env):
    load_dotenv(parent_env)

class Settings:
    # Google Maps API
    GOOGLE_MAPS_API_KEY: str = os.getenv("GOOGLE_MAPS_API_KEY", "")

    # Firebase - supports both file path and JSON string (for Cloud Run)
    FIREBASE_CREDENTIALS_PATH: str = os.getenv("FIREBASE_CREDENTIALS_PATH", "")
    FIREBASE_CREDENTIALS: str = os.getenv("FIREBASE_CREDENTIALS", "")  # JSON string
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "")

    # CORS - Parse from env or use defaults
    @property
    def CORS_ORIGINS(self) -> list:
        cors_env = os.getenv("CORS_ORIGINS", "")
        if cors_env:
            try:
                return json.loads(cors_env)
            except json.JSONDecodeError:
                pass
        return [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://localhost:5176",
            "http://localhost:3000",
            "https://elmandalorian-thx.github.io",
        ]

settings = Settings()
