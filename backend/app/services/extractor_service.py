import time
from typing import List, Dict, Any

# Import from backend root (copied during Docker build)
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from google_maps_extractor import GoogleMapsExtractor

from ..config import settings
from .data_quality import normalize_business


class ExtractorService:
    def __init__(self):
        if not settings.GOOGLE_MAPS_API_KEY:
            raise ValueError("GOOGLE_MAPS_API_KEY not configured")
        self.extractor = GoogleMapsExtractor(settings.GOOGLE_MAPS_API_KEY)

    def extract_businesses(self, query: str) -> Dict[str, Any]:
        """
        Extract businesses from Google Maps for a given query.
        Returns businesses and execution time.

        Each business includes:
        - google_position: The position in search results (1-based index)
        - custom_position: Initially set to same as google_position
        """
        start_time = time.time()

        # Use the existing batch_extract method
        businesses = self.extractor.batch_extract(query)

        # Add position information and normalize each business
        # Position is 1-based (first result = position 1)
        normalized_businesses = []
        for index, business in enumerate(businesses):
            position = index + 1  # 1-based indexing
            business["google_position"] = position
            business["custom_position"] = position  # Default to same as google position

            # Apply data quality normalization (phone, URL, score)
            normalized = normalize_business(business)
            normalized_businesses.append(normalized)

        execution_time = time.time() - start_time

        return {
            "businesses": normalized_businesses,
            "count": len(normalized_businesses),
            "executionTime": execution_time,
        }

    def search_places(self, query: str) -> List[str]:
        """Search for places and return place IDs."""
        return self.extractor.search_places(query)

    def get_place_details(self, place_id: str) -> Dict[str, Any]:
        """Get details for a specific place."""
        return self.extractor.get_place_details(place_id)
