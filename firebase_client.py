"""
Firebase Client for Google Maps NAP Data
Handles all Firestore operations for storing and retrieving business data
"""

import os
from datetime import datetime
from typing import List, Dict, Optional
import firebase_admin
from firebase_admin import credentials, firestore


class FirebaseClient:
    """Client for storing and retrieving business data from Firestore"""

    def __init__(self, credentials_path: Optional[str] = None, project_id: Optional[str] = None):
        """
        Initialize Firebase connection

        Args:
            credentials_path: Path to Firebase service account JSON file
            project_id: Firebase project ID (optional if in credentials)
        """
        self.db = None
        self._initialize_firebase(credentials_path, project_id)

    def _initialize_firebase(self, credentials_path: Optional[str], project_id: Optional[str]):
        """Initialize Firebase Admin SDK"""

        # Check if already initialized
        if firebase_admin._apps:
            self.db = firestore.client()
            return

        # Get credentials path from env if not provided
        if not credentials_path:
            credentials_path = os.getenv("FIREBASE_CREDENTIALS_PATH")

        if not project_id:
            project_id = os.getenv("FIREBASE_PROJECT_ID")

        if credentials_path and os.path.exists(credentials_path):
            # Initialize with service account credentials
            cred = credentials.Certificate(credentials_path)
            firebase_admin.initialize_app(cred, {
                'projectId': project_id
            } if project_id else None)
        else:
            # Initialize with application default credentials
            # Works in Google Cloud environments or with GOOGLE_APPLICATION_CREDENTIALS env var
            firebase_admin.initialize_app()

        self.db = firestore.client()
        print("✓ Firebase initialized successfully")

    def save_business(self, business: Dict, collection: str = "businesses") -> str:
        """
        Save a single business to Firestore
        Uses place_id as document ID for deduplication

        Args:
            business: Business data dictionary
            collection: Firestore collection name

        Returns:
            Document ID (place_id)
        """
        place_id = business.get("place_id")
        if not place_id:
            raise ValueError("Business must have a place_id")

        # Add metadata
        business["updated_at"] = datetime.now().isoformat()
        business["created_at"] = business.get("created_at", datetime.now().isoformat())

        # Save to Firestore (merge to preserve existing fields)
        doc_ref = self.db.collection(collection).document(place_id)
        doc_ref.set(business, merge=True)

        return place_id

    def save_businesses(self, businesses: List[Dict], collection: str = "businesses") -> Dict:
        """
        Save multiple businesses to Firestore using batch write

        Args:
            businesses: List of business data dictionaries
            collection: Firestore collection name

        Returns:
            Summary dict with counts
        """
        if not businesses:
            return {"saved": 0, "errors": 0}

        batch = self.db.batch()
        saved = 0
        errors = 0

        for business in businesses:
            try:
                place_id = business.get("place_id")
                if not place_id:
                    errors += 1
                    continue

                # Add metadata
                business["updated_at"] = datetime.now().isoformat()
                business["created_at"] = business.get("created_at", datetime.now().isoformat())

                doc_ref = self.db.collection(collection).document(place_id)
                batch.set(doc_ref, business, merge=True)
                saved += 1

            except Exception as e:
                print(f"✗ Error preparing {business.get('business_name', 'unknown')}: {e}")
                errors += 1

        # Commit the batch
        try:
            batch.commit()
            print(f"✓ Saved {saved} businesses to Firebase")
        except Exception as e:
            print(f"✗ Batch commit error: {e}")
            return {"saved": 0, "errors": len(businesses)}

        return {"saved": saved, "errors": errors}

    def get_business(self, place_id: str, collection: str = "businesses") -> Optional[Dict]:
        """
        Retrieve a single business by place_id

        Args:
            place_id: Google Places ID
            collection: Firestore collection name

        Returns:
            Business data dict or None
        """
        doc_ref = self.db.collection(collection).document(place_id)
        doc = doc_ref.get()

        if doc.exists:
            return doc.to_dict()
        return None

    def get_businesses_by_query(self, search_query: str, collection: str = "businesses") -> List[Dict]:
        """
        Get all businesses from a specific search query

        Args:
            search_query: The original search query used
            collection: Firestore collection name

        Returns:
            List of business dicts
        """
        docs = self.db.collection(collection).where("search_query", "==", search_query).stream()
        return [doc.to_dict() for doc in docs]

    def get_businesses_by_city(self, city: str, collection: str = "businesses") -> List[Dict]:
        """
        Get all businesses in a specific city

        Args:
            city: City name
            collection: Firestore collection name

        Returns:
            List of business dicts
        """
        docs = self.db.collection(collection).where("city", "==", city).stream()
        return [doc.to_dict() for doc in docs]

    def get_all_businesses(self, collection: str = "businesses", limit: int = 1000) -> List[Dict]:
        """
        Get all businesses (with optional limit)

        Args:
            collection: Firestore collection name
            limit: Maximum number of results

        Returns:
            List of business dicts
        """
        docs = self.db.collection(collection).limit(limit).stream()
        return [doc.to_dict() for doc in docs]

    def get_businesses_without_website(self, collection: str = "businesses") -> List[Dict]:
        """
        Get businesses that don't have a website (lead opportunities)

        Args:
            collection: Firestore collection name

        Returns:
            List of business dicts
        """
        docs = self.db.collection(collection).where("website", "==", "").stream()
        return [doc.to_dict() for doc in docs]

    def save_extraction_log(self, query: str, results_count: int, collection: str = "extraction_logs"):
        """
        Log an extraction event for tracking

        Args:
            query: Search query used
            results_count: Number of results extracted
            collection: Firestore collection name
        """
        log_entry = {
            "query": query,
            "results_count": results_count,
            "timestamp": datetime.now().isoformat(),
            "date": datetime.now().strftime("%Y-%m-%d")
        }

        self.db.collection(collection).add(log_entry)

    def get_extraction_history(self, limit: int = 50, collection: str = "extraction_logs") -> List[Dict]:
        """
        Get recent extraction history

        Args:
            limit: Maximum number of results
            collection: Firestore collection name

        Returns:
            List of extraction log dicts
        """
        docs = (self.db.collection(collection)
                .order_by("timestamp", direction=firestore.Query.DESCENDING)
                .limit(limit)
                .stream())
        return [doc.to_dict() for doc in docs]

    def delete_business(self, place_id: str, collection: str = "businesses") -> bool:
        """
        Delete a business by place_id

        Args:
            place_id: Google Places ID
            collection: Firestore collection name

        Returns:
            True if deleted, False otherwise
        """
        try:
            self.db.collection(collection).document(place_id).delete()
            return True
        except Exception as e:
            print(f"✗ Error deleting {place_id}: {e}")
            return False


def init_firebase(credentials_path: Optional[str] = None) -> FirebaseClient:
    """
    Convenience function to initialize Firebase client

    Args:
        credentials_path: Path to service account JSON (optional)

    Returns:
        Initialized FirebaseClient instance
    """
    return FirebaseClient(credentials_path)
