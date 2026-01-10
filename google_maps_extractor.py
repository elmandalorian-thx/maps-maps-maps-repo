"""
Google Maps Business Data Extractor
Extracts NAP (Name, Address, Phone) and additional business data from Google Maps
"""

import os
import time
import csv
from datetime import datetime
import requests
from typing import List, Dict, Optional

class GoogleMapsExtractor:
    """Extract business data from Google Maps using Places API"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://places.googleapis.com/v1/places"
        self.headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": "*"  # Request all fields
        }
    
    def search_places(self, query: str, location_bias: Optional[Dict] = None) -> List[str]:
        """
        Search for places using text query
        Returns list of place_ids
        """
        url = f"{self.base_url}:searchText"
        
        payload = {
            "textQuery": query,
            "maxResultCount": 20  # Max 20 per request
        }
        
        if location_bias:
            payload["locationBias"] = location_bias
        
        try:
            response = requests.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            
            place_ids = []
            if "places" in data:
                for place in data["places"]:
                    if "id" in place:
                        place_ids.append(place["id"])
            
            print(f"✓ Found {len(place_ids)} places for query: {query}")
            return place_ids
            
        except requests.exceptions.RequestException as e:
            print(f"✗ Error searching places: {e}")
            return []
    
    def get_place_details(self, place_id: str) -> Optional[Dict]:
        """
        Get detailed information for a specific place
        Returns structured business data
        """
        url = f"{self.base_url}/{place_id}"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            
            # Extract and structure the data
            business_data = self._parse_place_data(data)
            return business_data
            
        except requests.exceptions.RequestException as e:
            print(f"✗ Error getting details for {place_id}: {e}")
            return None
    
    def _parse_place_data(self, data: Dict) -> Dict:
        """Parse the API response into structured business data"""
        
        # Extract address components
        address_components = data.get("addressComponents", [])
        street_number = ""
        route = ""
        city = ""
        province = ""
        postal_code = ""
        country = ""
        
        for component in address_components:
            types = component.get("types", [])
            if "street_number" in types:
                street_number = component.get("longText", "")
            elif "route" in types:
                route = component.get("longText", "")
            elif "locality" in types:
                city = component.get("longText", "")
            elif "administrative_area_level_1" in types:
                province = component.get("shortText", "")
            elif "postal_code" in types:
                postal_code = component.get("longText", "")
            elif "country" in types:
                country = component.get("shortText", "")
        
        street_address = f"{street_number} {route}".strip()
        
        # Extract hours
        hours = self._format_hours(data.get("regularOpeningHours", {}))
        
        # Extract categories
        categories = ", ".join(data.get("types", []))
        
        # Extract photos
        photos = data.get("photos", [])
        photo_url = ""
        if photos:
            photo_name = photos[0].get("name", "")
            if photo_name:
                photo_url = f"https://places.googleapis.com/v1/{photo_name}/media?key={self.api_key}&maxHeightPx=400&maxWidthPx=400"
        
        return {
            "business_name": data.get("displayName", {}).get("text", ""),
            "street_address": street_address,
            "city": city,
            "province_state": province,
            "postal_code": postal_code,
            "country": country,
            "full_address": data.get("formattedAddress", ""),
            "phone": data.get("nationalPhoneNumber", ""),
            "international_phone": data.get("internationalPhoneNumber", ""),
            "website": data.get("websiteUri", ""),
            "google_maps_url": data.get("googleMapsUri", ""),
            "rating": data.get("rating", ""),
            "user_rating_count": data.get("userRatingCount", ""),
            "price_level": data.get("priceLevel", ""),
            "hours": hours,
            "categories": categories,
            "business_status": data.get("businessStatus", ""),
            "place_id": data.get("id", ""),
            "latitude": data.get("location", {}).get("latitude", ""),
            "longitude": data.get("location", {}).get("longitude", ""),
            "photo_url": photo_url,
            "delivery": data.get("delivery", ""),
            "dine_in": data.get("dineIn", ""),
            "takeout": data.get("takeout", ""),
            "reservable": data.get("reservable", ""),
            "serves_breakfast": data.get("servesBreakfast", ""),
            "serves_lunch": data.get("servesLunch", ""),
            "serves_dinner": data.get("servesDinner", ""),
            "serves_beer": data.get("servesBeer", ""),
            "serves_wine": data.get("servesWine", ""),
            "wheelchair_accessible": data.get("accessibilityOptions", {}).get("wheelchairAccessibleEntrance", ""),
        }
    
    def _format_hours(self, opening_hours: Dict) -> str:
        """Format opening hours into readable string"""
        if not opening_hours or "weekdayDescriptions" not in opening_hours:
            return ""
        
        return " | ".join(opening_hours["weekdayDescriptions"])
    
    def batch_extract(self, query: str, delay: float = 0.5) -> List[Dict]:
        """
        Complete workflow: search and extract details for all results
        """
        print(f"\n🔍 Searching for: {query}")
        print("=" * 60)
        
        # Step 1: Search for places
        place_ids = self.search_places(query)
        
        if not place_ids:
            print("No results found.")
            return []
        
        # Step 2: Get details for each place
        print(f"\n📊 Fetching details for {len(place_ids)} businesses...")
        businesses = []
        
        for i, place_id in enumerate(place_ids, 1):
            print(f"  [{i}/{len(place_ids)}] Fetching {place_id}...")
            details = self.get_place_details(place_id)
            
            if details:
                businesses.append(details)
            
            # Rate limiting - be nice to the API
            if i < len(place_ids):
                time.sleep(delay)
        
        print(f"\n✓ Successfully extracted {len(businesses)} businesses")
        return businesses
    
    def export_to_csv(self, businesses: List[Dict], filename: Optional[str] = None):
        """Export business data to CSV file"""
        if not businesses:
            print("No data to export.")
            return
        
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"google_maps_export_{timestamp}.csv"
        
        # Get all possible fields
        fieldnames = list(businesses[0].keys())
        
        try:
            with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(businesses)
            
            print(f"\n✓ Data exported to: {filename}")
            print(f"  Total records: {len(businesses)}")
            
        except Exception as e:
            print(f"✗ Error exporting to CSV: {e}")


def main():
    """Main execution function"""
    
    # STEP 1: Get API Key
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    
    if not api_key:
        print("=" * 60)
        print("⚠️  SETUP REQUIRED")
        print("=" * 60)
        print("\nYou need a Google Maps API key to use this tool.")
        print("\nHow to get your API key:")
        print("1. Go to: https://console.cloud.google.com/")
        print("2. Create a new project (or select existing)")
        print("3. Enable 'Places API (New)'")
        print("4. Go to 'Credentials' and create an API key")
        print("5. Set the environment variable:")
        print("   export GOOGLE_MAPS_API_KEY='your-api-key-here'")
        print("\nOr enter it directly below:")
        api_key = input("\nEnter your API key: ").strip()
        
        if not api_key:
            print("No API key provided. Exiting.")
            return
    
    # STEP 2: Initialize extractor
    extractor = GoogleMapsExtractor(api_key)
    
    # STEP 3: Get search query from user
    print("\n" + "=" * 60)
    print("🗺️  GOOGLE MAPS BUSINESS EXTRACTOR")
    print("=" * 60)
    
    default_query = "naturopathic clinics in Toronto"
    query = input(f"\nEnter search query [{default_query}]: ").strip()
    
    if not query:
        query = default_query
    
    # STEP 4: Extract data
    businesses = extractor.batch_extract(query)
    
    # STEP 5: Export to CSV
    if businesses:
        custom_filename = input("\nEnter filename (press Enter for auto-generated): ").strip()
        filename = custom_filename if custom_filename else None
        extractor.export_to_csv(businesses, filename)
        
        # Show sample data
        print("\n" + "=" * 60)
        print("📋 SAMPLE DATA (First Result)")
        print("=" * 60)
        sample = businesses[0]
        print(f"Business: {sample['business_name']}")
        print(f"Address: {sample['full_address']}")
        print(f"Phone: {sample['phone']}")
        print(f"Website: {sample['website']}")
        print(f"Rating: {sample['rating']} ({sample['user_rating_count']} reviews)")
        print(f"Categories: {sample['categories']}")
    
    print("\n✅ Done!\n")


if __name__ == "__main__":
    main()
