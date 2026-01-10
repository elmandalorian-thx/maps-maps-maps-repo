import os
from datetime import datetime
from typing import List, Optional, Dict, Any
from firebase_admin import credentials, firestore, initialize_app
from ..config import settings


class FirebaseService:
    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if not FirebaseService._initialized:
            self._initialize_firebase()
            FirebaseService._initialized = True

    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK."""
        try:
            if settings.FIREBASE_CREDENTIALS_PATH and os.path.exists(
                settings.FIREBASE_CREDENTIALS_PATH
            ):
                cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
                initialize_app(cred)
            else:
                # Use application default credentials
                initialize_app()
            self.db = firestore.client()
            print("Firebase initialized successfully")
        except Exception as e:
            print(f"Warning: Firebase initialization failed: {e}")
            self.db = None

    # ==================== QUERIES ====================

    def get_queries(
        self,
        user_id: str,
        business_type: Optional[str] = None,
        city: Optional[str] = None,
        status: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Get all queries for a user with optional filters."""
        if not self.db:
            return []

        query = self.db.collection("queries").where("createdBy", "==", user_id)

        if business_type:
            query = query.where("businessType", "==", business_type)
        if city:
            query = query.where("city", "==", city)
        if status:
            query = query.where("status", "==", status)

        # Get results without ordering (to avoid index requirement during development)
        docs = query.stream()
        results = [{"id": doc.id, **doc.to_dict()} for doc in docs]

        # Sort by createdAt descending in Python
        results.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
        return results

    def get_query(self, query_id: str) -> Optional[Dict[str, Any]]:
        """Get a single query by ID."""
        if not self.db:
            return None

        doc = self.db.collection("queries").document(query_id).get()
        if doc.exists:
            return {"id": doc.id, **doc.to_dict()}
        return None

    def create_query(
        self, user_id: str, business_type: str, city: str
    ) -> Dict[str, Any]:
        """Create a new query."""
        if not self.db:
            raise Exception("Firebase not initialized")

        now = datetime.utcnow().isoformat()
        full_query = f"{business_type} {city}"

        # Check for duplicates
        existing = (
            self.db.collection("queries")
            .where("createdBy", "==", user_id)
            .where("fullQuery", "==", full_query)
            .limit(1)
            .stream()
        )
        if any(existing):
            raise ValueError("Query already exists")

        query_data = {
            "businessType": business_type,
            "city": city,
            "fullQuery": full_query,
            "status": "pending",
            "lastRunDate": None,
            "versionsCount": 0,
            "createdAt": now,
            "updatedAt": now,
            "createdBy": user_id,
        }

        doc_ref = self.db.collection("queries").add(query_data)
        return {"id": doc_ref[1].id, **query_data}

    def delete_query(self, query_id: str) -> bool:
        """Delete a query and its versions."""
        if not self.db:
            return False

        # Delete all versions first
        versions = (
            self.db.collection("queries")
            .document(query_id)
            .collection("versions")
            .stream()
        )
        for version in versions:
            # Delete businesses in version
            businesses = version.reference.collection("businesses").stream()
            for business in businesses:
                business.reference.delete()
            version.reference.delete()

        # Delete query
        self.db.collection("queries").document(query_id).delete()
        return True

    def update_query_status(
        self, query_id: str, status: str, last_run_date: Optional[str] = None
    ) -> None:
        """Update query status and optionally last run date."""
        if not self.db:
            return

        update_data = {
            "status": status,
            "updatedAt": datetime.utcnow().isoformat(),
        }
        if last_run_date:
            update_data["lastRunDate"] = last_run_date

        self.db.collection("queries").document(query_id).update(update_data)

    # ==================== VERSIONS ====================

    def get_versions(self, query_id: str) -> List[Dict[str, Any]]:
        """Get all versions for a query."""
        if not self.db:
            return []

        versions = (
            self.db.collection("queries")
            .document(query_id)
            .collection("versions")
            .order_by("versionNumber", direction=firestore.Query.DESCENDING)
            .stream()
        )
        return [{"id": doc.id, **doc.to_dict()} for doc in versions]

    def create_version(
        self, query_id: str, businesses: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Create a new version with business data."""
        if not self.db:
            raise Exception("Firebase not initialized")

        # Get current version count
        query_doc = self.db.collection("queries").document(query_id).get()
        if not query_doc.exists:
            raise ValueError("Query not found")

        versions_count = query_doc.to_dict().get("versionsCount", 0)
        new_version_number = versions_count + 1

        now = datetime.utcnow().isoformat()

        version_data = {
            "queryId": query_id,
            "versionNumber": new_version_number,
            "createdAt": now,
            "businessCount": len(businesses),
            "savedToFirebase": False,
            "savedAt": None,
        }

        # Create version document
        version_ref = (
            self.db.collection("queries")
            .document(query_id)
            .collection("versions")
            .add(version_data)
        )
        version_id = version_ref[1].id

        # Add businesses to version
        batch = self.db.batch()
        for business in businesses:
            business_ref = (
                self.db.collection("queries")
                .document(query_id)
                .collection("versions")
                .document(version_id)
                .collection("businesses")
                .document(business.get("place_id", ""))
            )
            batch.set(business_ref, business)
        batch.commit()

        # Update query versions count and status
        self.db.collection("queries").document(query_id).update(
            {
                "versionsCount": new_version_number,
                "status": "completed",
                "lastRunDate": now,
                "updatedAt": now,
            }
        )

        return {"id": version_id, **version_data}

    def get_version_businesses(
        self, query_id: str, version_id: str
    ) -> List[Dict[str, Any]]:
        """Get all businesses for a specific version."""
        if not self.db:
            return []

        businesses = (
            self.db.collection("queries")
            .document(query_id)
            .collection("versions")
            .document(version_id)
            .collection("businesses")
            .stream()
        )
        return [doc.to_dict() for doc in businesses]

    def save_version_to_main(self, query_id: str, version_id: str) -> Dict[str, int]:
        """Save version businesses to main businesses collection."""
        if not self.db:
            return {"saved": 0, "errors": 0}

        businesses = self.get_version_businesses(query_id, version_id)
        saved = 0
        errors = 0

        batch = self.db.batch()
        for business in businesses:
            try:
                place_id = business.get("place_id", "")
                if place_id:
                    ref = self.db.collection("businesses").document(place_id)
                    batch.set(ref, business, merge=True)
                    saved += 1
            except Exception:
                errors += 1

        batch.commit()

        # Mark version as saved
        now = datetime.utcnow().isoformat()
        (
            self.db.collection("queries")
            .document(query_id)
            .collection("versions")
            .document(version_id)
            .update({"savedToFirebase": True, "savedAt": now})
        )

        return {"saved": saved, "errors": errors}

    # ==================== METADATA ====================

    def get_distinct_business_types(self, user_id: str) -> List[str]:
        """Get distinct business types from user's queries."""
        if not self.db:
            return []

        queries = (
            self.db.collection("queries").where("createdBy", "==", user_id).stream()
        )
        types = set()
        for doc in queries:
            data = doc.to_dict()
            if data.get("businessType"):
                types.add(data["businessType"])
        return sorted(list(types))

    def get_distinct_cities(self, user_id: str) -> List[str]:
        """Get distinct cities from user's queries."""
        if not self.db:
            return []

        queries = (
            self.db.collection("queries").where("createdBy", "==", user_id).stream()
        )
        cities = set()
        for doc in queries:
            data = doc.to_dict()
            if data.get("city"):
                cities.add(data["city"])
        return sorted(list(cities))
