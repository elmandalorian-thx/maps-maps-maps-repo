from typing import Optional, List, Union
from pydantic import BaseModel


class Business(BaseModel):
    place_id: str
    business_name: str
    street_address: str = ""
    city: str = ""
    province_state: str = ""
    postal_code: str = ""
    country: str = ""
    full_address: str = ""
    phone: str = ""
    international_phone: str = ""
    website: str = ""
    google_maps_url: str = ""
    rating: Union[float, str] = ""
    user_rating_count: Union[int, str] = ""
    price_level: str = ""
    hours: str = ""
    categories: str = ""
    business_status: str = ""
    latitude: Union[float, str] = ""
    longitude: Union[float, str] = ""
    photo_url: str = ""
    delivery: Union[bool, str] = ""
    dine_in: Union[bool, str] = ""
    takeout: Union[bool, str] = ""
    reservable: Union[bool, str] = ""
    serves_breakfast: Union[bool, str] = ""
    serves_lunch: Union[bool, str] = ""
    serves_dinner: Union[bool, str] = ""
    serves_beer: Union[bool, str] = ""
    serves_wine: Union[bool, str] = ""
    wheelchair_accessible: Union[bool, str] = ""
    search_query: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    # New fields for position ranking
    google_position: Optional[int] = None      # Position in Google Maps results (1, 2, 3...)
    custom_position: Optional[int] = None      # User-defined position for sorting
    # New fields for directory integration
    base_term: Optional[str] = None            # The base search term (e.g., "naturopathic doctor")
    source_query_id: Optional[str] = None      # Reference to the local query
    source_version_id: Optional[str] = None    # Reference to the version
    is_latest_version: bool = False            # Flag for directory display
    # Data quality fields
    data_quality_score: Optional[int] = None   # Completeness score (0-100)
    missing_fields: Optional[List[str]] = None # List of fields that are empty/missing


class BusinessesResponse(BaseModel):
    businesses: List[Business]
    count: int


class ExtractionResponse(BaseModel):
    businesses: List[Business]
    count: int
    executionTime: float


class SaveResponse(BaseModel):
    saved: int
    errors: int
