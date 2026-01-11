import os
import json
import base64
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
            cred = None

            # Option 1: Credentials from base64-encoded JSON (Cloud Run)
            firebase_creds_b64 = os.getenv("FIREBASE_CREDENTIALS_B64", "")
            if firebase_creds_b64:
                try:
                    cred_json = base64.b64decode(firebase_creds_b64).decode("utf-8")
                    cred_dict = json.loads(cred_json)
                    cred = credentials.Certificate(cred_dict)
                    print("Using Firebase credentials from base64-encoded env var")
                except Exception as e:
                    print(f"Failed to parse FIREBASE_CREDENTIALS_B64: {e}")

            # Option 2: Credentials from JSON string (Cloud Run / env var)
            if not cred and settings.FIREBASE_CREDENTIALS:
                try:
                    cred_dict = json.loads(settings.FIREBASE_CREDENTIALS)
                    cred = credentials.Certificate(cred_dict)
                    print("Using Firebase credentials from environment variable")
                except json.JSONDecodeError as e:
                    print(f"Failed to parse FIREBASE_CREDENTIALS JSON: {e}")

            # Option 3: Credentials from file path (local development)
            if not cred and settings.FIREBASE_CREDENTIALS_PATH and os.path.exists(
                settings.FIREBASE_CREDENTIALS_PATH
            ):
                cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
                print("Using Firebase credentials from file path")

            # Initialize with credentials or default
            if cred:
                initialize_app(cred)
            else:
                # Use application default credentials (for GCP environments)
                initialize_app()
                print("Using application default credentials")

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

    # ==================== BASE TERMS ====================

    def get_base_terms(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all base terms for a user."""
        if not self.db:
            return []

        docs = (
            self.db.collection("base_terms")
            .where("userId", "==", user_id)
            .stream()
        )
        results = [{"id": doc.id, **doc.to_dict()} for doc in docs]
        results.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
        return results

    def get_base_term(self, term_id: str) -> Optional[Dict[str, Any]]:
        """Get a single base term by ID."""
        if not self.db:
            return None

        doc = self.db.collection("base_terms").document(term_id).get()
        if doc.exists:
            return {"id": doc.id, **doc.to_dict()}
        return None

    def create_base_term(
        self, user_id: str, term: str, category: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new base term."""
        if not self.db:
            raise Exception("Firebase not initialized")

        now = datetime.utcnow().isoformat()

        # Check for duplicates
        existing = (
            self.db.collection("base_terms")
            .where("userId", "==", user_id)
            .where("term", "==", term)
            .limit(1)
            .stream()
        )
        if any(existing):
            raise ValueError("Base term already exists")

        term_data = {
            "term": term,
            "category": category,
            "createdAt": now,
            "userId": user_id,
            "stats": {
                "totalQueries": 0,
                "pendingQueries": 0,
                "completeQueries": 0,
                "errorQueries": 0,
            },
        }

        doc_ref = self.db.collection("base_terms").add(term_data)
        return {"id": doc_ref[1].id, **term_data}

    def delete_base_term(self, term_id: str) -> bool:
        """Delete a base term and all its associated queries."""
        if not self.db:
            return False

        # Delete all queries with this baseTermId
        queries = (
            self.db.collection("queries")
            .where("baseTermId", "==", term_id)
            .stream()
        )
        for query in queries:
            self.delete_query(query.id)

        # Delete the base term
        self.db.collection("base_terms").document(term_id).delete()
        return True

    def update_base_term_stats(self, term_id: str) -> Dict[str, int]:
        """Recalculate and update stats for a base term."""
        if not self.db:
            return {}

        queries = (
            self.db.collection("queries")
            .where("baseTermId", "==", term_id)
            .stream()
        )

        stats = {
            "totalQueries": 0,
            "pendingQueries": 0,
            "completeQueries": 0,
            "errorQueries": 0,
        }

        for doc in queries:
            data = doc.to_dict()
            status = data.get("status", "pending")
            stats["totalQueries"] += 1
            if status in ["pending", "queued"]:
                stats["pendingQueries"] += 1
            elif status in ["completed", "complete"]:
                stats["completeQueries"] += 1
            elif status == "error":
                stats["errorQueries"] += 1

        self.db.collection("base_terms").document(term_id).update({"stats": stats})
        return stats

    def bulk_create_queries(
        self,
        user_id: str,
        base_term_id: str,
        base_term: str,
        locations: List[Dict[str, str]],
    ) -> Dict[str, int]:
        """Bulk create queries for multiple locations.

        Args:
            user_id: The user creating the queries
            base_term_id: Reference to the base term
            base_term: The search term (e.g., "naturopathic doctor")
            locations: List of dicts with city, province, country

        Returns:
            Dict with created, skipped, total counts
        """
        if not self.db:
            raise Exception("Firebase not initialized")

        created = 0
        skipped = 0
        now = datetime.utcnow().isoformat()

        # Process in batches of 500 (Firestore limit)
        batch = self.db.batch()
        batch_count = 0

        for loc in locations:
            city = loc.get("city", "")
            province = loc.get("province", "")
            country = loc.get("country", "")
            full_query = f"{base_term} {city}"

            # Check for duplicates
            existing = (
                self.db.collection("queries")
                .where("createdBy", "==", user_id)
                .where("fullQuery", "==", full_query)
                .limit(1)
                .stream()
            )
            if any(existing):
                skipped += 1
                continue

            # Create query document
            query_data = {
                "businessType": base_term,
                "city": city,
                "province": province,
                "country": country,
                "fullQuery": full_query,
                "status": "pending",
                "lastRunDate": None,
                "versionsCount": 0,
                "createdAt": now,
                "updatedAt": now,
                "createdBy": user_id,
                "baseTermId": base_term_id,
                "latestVersionId": None,
                "startedAt": None,
                "completedAt": None,
                "error": None,
                "resultCount": None,
            }

            doc_ref = self.db.collection("queries").document()
            batch.set(doc_ref, query_data)
            created += 1
            batch_count += 1

            # Commit batch every 500 documents
            if batch_count >= 500:
                batch.commit()
                batch = self.db.batch()
                batch_count = 0

        # Commit remaining documents
        if batch_count > 0:
            batch.commit()

        # Update base term stats
        self.update_base_term_stats(base_term_id)

        return {
            "created": created,
            "skipped": skipped,
            "total": created + skipped,
        }

    # ==================== ENHANCED QUERY METHODS ====================

    def get_queries_by_base_term(
        self,
        user_id: str,
        base_term_id: str,
        country: Optional[str] = None,
        province: Optional[str] = None,
        city: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """Get queries filtered by base term and geo filters."""
        if not self.db:
            return []

        query = (
            self.db.collection("queries")
            .where("createdBy", "==", user_id)
            .where("baseTermId", "==", base_term_id)
        )

        if country:
            query = query.where("country", "==", country)
        if province:
            query = query.where("province", "==", province)
        if city:
            query = query.where("city", "==", city)
        if status:
            query = query.where("status", "==", status)

        docs = query.stream()
        results = [{"id": doc.id, **doc.to_dict()} for doc in docs]
        results.sort(key=lambda x: x.get("createdAt", ""), reverse=True)

        # Apply pagination
        return results[offset : offset + limit]

    def get_queue_status(self, user_id: str) -> Dict[str, int]:
        """Get queue status counts for a user."""
        if not self.db:
            return {}

        queries = (
            self.db.collection("queries")
            .where("createdBy", "==", user_id)
            .stream()
        )

        status_counts = {
            "pending": 0,
            "queued": 0,
            "running": 0,
            "complete": 0,
            "error": 0,
        }

        for doc in queries:
            data = doc.to_dict()
            status = data.get("status", "pending")
            if status == "completed":
                status = "complete"
            if status in status_counts:
                status_counts[status] += 1

        return status_counts

    def bulk_update_query_status(
        self, query_ids: List[str], status: str
    ) -> Dict[str, int]:
        """Bulk update status for multiple queries."""
        if not self.db:
            return {"updated": 0, "failed": 0}

        updated = 0
        failed = 0
        now = datetime.utcnow().isoformat()

        batch = self.db.batch()
        batch_count = 0

        for query_id in query_ids:
            try:
                ref = self.db.collection("queries").document(query_id)
                update_data = {"status": status, "updatedAt": now}
                if status == "queued":
                    update_data["startedAt"] = now
                batch.update(ref, update_data)
                updated += 1
                batch_count += 1

                if batch_count >= 500:
                    batch.commit()
                    batch = self.db.batch()
                    batch_count = 0
            except Exception:
                failed += 1

        if batch_count > 0:
            batch.commit()

        return {"updated": updated, "failed": failed}

    def create_query_with_geo(
        self,
        user_id: str,
        business_type: str,
        city: str,
        province: Optional[str] = None,
        country: Optional[str] = None,
        base_term_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create a new query with full geo data."""
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
            "province": province,
            "country": country,
            "fullQuery": full_query,
            "status": "pending",
            "lastRunDate": None,
            "versionsCount": 0,
            "createdAt": now,
            "updatedAt": now,
            "createdBy": user_id,
            "baseTermId": base_term_id,
            "latestVersionId": None,
            "startedAt": None,
            "completedAt": None,
            "error": None,
            "resultCount": None,
        }

        doc_ref = self.db.collection("queries").add(query_data)

        # Update base term stats if linked
        if base_term_id:
            self.update_base_term_stats(base_term_id)

        return {"id": doc_ref[1].id, **query_data}

    # ==================== LATEST VERSION & DIRECTORY PUBLISHING ====================

    def set_version_as_latest(
        self, query_id: str, version_id: str
    ) -> Dict[str, Any]:
        """Set a version as the 'latest' version for a query.

        Clears the isLatest flag from all other versions of the same query
        and sets it on the specified version.

        Args:
            query_id: The query ID
            version_id: The version ID to set as latest

        Returns:
            The updated version data
        """
        if not self.db:
            raise Exception("Firebase not initialized")

        versions_ref = (
            self.db.collection("queries")
            .document(query_id)
            .collection("versions")
        )

        # First, verify the version exists
        version_doc = versions_ref.document(version_id).get()
        if not version_doc.exists:
            raise ValueError("Version not found")

        # Clear isLatest from all versions of this query
        all_versions = versions_ref.stream()
        batch = self.db.batch()
        for v in all_versions:
            batch.update(v.reference, {"isLatest": False})
        batch.commit()

        # Set isLatest on the specified version
        now = datetime.utcnow().isoformat()
        versions_ref.document(version_id).update({
            "isLatest": True,
            "updatedAt": now,
        })

        # Update the query's latestVersionId
        self.db.collection("queries").document(query_id).update({
            "latestVersionId": version_id,
            "updatedAt": now,
        })

        # Return updated version data
        updated_version = versions_ref.document(version_id).get()
        return {"id": updated_version.id, **updated_version.to_dict()}

    def publish_to_directory(
        self, query_id: str, version_id: str
    ) -> Dict[str, Any]:
        """Publish businesses from a version to the main directory.

        Copies all businesses from the specified version to the main
        'businesses' collection with is_latest_version=True. Also updates
        any previously published businesses from this query to have
        is_latest_version=False.

        Args:
            query_id: The query ID
            version_id: The version ID to publish

        Returns:
            Dict with published count, updated count, and errors
        """
        if not self.db:
            raise Exception("Firebase not initialized")

        # Get the query to include metadata
        query_doc = self.db.collection("queries").document(query_id).get()
        if not query_doc.exists:
            raise ValueError("Query not found")
        query_data = query_doc.to_dict()

        # Get businesses from the version
        businesses = self.get_version_businesses(query_id, version_id)
        if not businesses:
            return {"published": 0, "updated": 0, "errors": 0}

        now = datetime.utcnow().isoformat()
        published = 0
        updated = 0
        errors = 0

        # First, find and update any existing businesses from this query
        # that were previously marked as latest
        existing_businesses = (
            self.db.collection("businesses")
            .where("source_query_id", "==", query_id)
            .where("is_latest_version", "==", True)
            .stream()
        )

        batch = self.db.batch()
        batch_count = 0

        for doc in existing_businesses:
            batch.update(doc.reference, {"is_latest_version": False})
            updated += 1
            batch_count += 1
            if batch_count >= 500:
                batch.commit()
                batch = self.db.batch()
                batch_count = 0

        if batch_count > 0:
            batch.commit()

        # Now publish the new businesses
        batch = self.db.batch()
        batch_count = 0

        for business in businesses:
            try:
                place_id = business.get("place_id", "")
                if not place_id:
                    errors += 1
                    continue

                # Add metadata for directory publishing
                business_data = {
                    **business,
                    "is_latest_version": True,
                    "source_query_id": query_id,
                    "source_version_id": version_id,
                    "published_at": now,
                    "source_business_type": query_data.get("businessType"),
                    "source_city": query_data.get("city"),
                    "source_province": query_data.get("province"),
                    "source_country": query_data.get("country"),
                }

                ref = self.db.collection("businesses").document(place_id)
                batch.set(ref, business_data, merge=True)
                published += 1
                batch_count += 1

                if batch_count >= 500:
                    batch.commit()
                    batch = self.db.batch()
                    batch_count = 0

            except Exception as e:
                print(f"Error publishing business: {e}")
                errors += 1

        if batch_count > 0:
            batch.commit()

        # Set this version as latest
        self.set_version_as_latest(query_id, version_id)

        # Mark version as published
        (
            self.db.collection("queries")
            .document(query_id)
            .collection("versions")
            .document(version_id)
            .update({
                "publishedToDirectory": True,
                "publishedAt": now,
            })
        )

        return {
            "published": published,
            "updated": updated,
            "errors": errors,
        }

    # ==================== BUSINESS POSITIONS ====================

    def update_business_position(
        self,
        query_id: str,
        version_id: str,
        business_id: str,
        custom_position: int,
    ) -> Dict[str, Any]:
        """
        Update the custom_position for a business in a specific version.

        Args:
            query_id: The query ID
            version_id: The version ID
            business_id: The business place_id
            custom_position: New custom position value

        Returns:
            Updated business data
        """
        if not self.db:
            raise Exception("Firebase not initialized")

        business_ref = (
            self.db.collection("queries")
            .document(query_id)
            .collection("versions")
            .document(version_id)
            .collection("businesses")
            .document(business_id)
        )

        # Check if document exists
        doc = business_ref.get()
        if not doc.exists:
            raise ValueError("Business not found in version")

        # Update the custom position
        now = datetime.utcnow().isoformat()
        business_ref.update({
            "custom_position": custom_position,
            "updated_at": now,
        })

        # Return updated document
        updated_doc = business_ref.get()
        return {"id": updated_doc.id, **updated_doc.to_dict()}

    def get_version_businesses_sorted(
        self,
        query_id: str,
        version_id: str,
        sort_by: str = "google_position",
    ) -> List[Dict[str, Any]]:
        """
        Get all businesses for a specific version, sorted by position.

        Args:
            query_id: The query ID
            version_id: The version ID
            sort_by: Sort field - "google_position" or "custom_position"

        Returns:
            List of businesses sorted by the specified position field
        """
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

        results = [{"id": doc.id, **doc.to_dict()} for doc in businesses]

        # Sort by the specified position field
        # Default to a high number if position is not set
        def get_position(business: Dict[str, Any]) -> int:
            pos = business.get(sort_by)
            if pos is None:
                # Fall back to google_position if custom_position is not set
                pos = business.get("google_position")
            if pos is None:
                return 9999  # Default to end if no position
            return pos

        results.sort(key=get_position)
        return results

    def update_main_business_position(
        self,
        business_id: str,
        custom_position: int,
    ) -> Dict[str, Any]:
        """
        Update the custom_position for a business in the main businesses collection.

        Args:
            business_id: The business place_id
            custom_position: New custom position value

        Returns:
            Updated business data
        """
        if not self.db:
            raise Exception("Firebase not initialized")

        business_ref = self.db.collection("businesses").document(business_id)

        # Check if document exists
        doc = business_ref.get()
        if not doc.exists:
            raise ValueError("Business not found")

        # Update the custom position
        now = datetime.utcnow().isoformat()
        business_ref.update({
            "custom_position": custom_position,
            "updated_at": now,
        })

        # Return updated document
        updated_doc = business_ref.get()
        return {"id": updated_doc.id, **updated_doc.to_dict()}

    def get_business(self, business_id: str) -> Optional[Dict[str, Any]]:
        """Get a single business from the main collection by place_id."""
        if not self.db:
            return None

        doc = self.db.collection("businesses").document(business_id).get()
        if doc.exists:
            return {"id": doc.id, **doc.to_dict()}
        return None
