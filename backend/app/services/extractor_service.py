import sys
import os
import time
from typing import List, Dict, Any

# Add parent directory to path to import existing extractor
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from google_maps_extractor import GoogleMapsExtractor
from ..config import settings


class ExtractorService:
    def __init__(self):
        if not settings.GOOGLE_MAPS_API_KEY:
            raise ValueError("GOOGLE_MAPS_API_KEY not configured")
        self.extractor = GoogleMapsExtractor(settings.GOOGLE_MAPS_API_KEY)

    def extract_businesses(self, query: str) -> Dict[str, Any]:
        """
        Extract businesses from Google Maps for a given query.
        Returns businesses and execution time.
        """
        start_time = time.time()

        # Use the existing batch_extract method
        businesses = self.extractor.batch_extract(query)

        execution_time = time.time() - start_time

        return {
            "businesses": businesses,
            "count": len(businesses),
            "executionTime": execution_time,
        }

    def search_places(self, query: str) -> List[str]:
        """Search for places and return place IDs."""
        return self.extractor.search_places(query)

    def get_place_details(self, place_id: str) -> Dict[str, Any]:
        """Get details for a specific place."""
        return self.extractor.get_place_details(place_id)
