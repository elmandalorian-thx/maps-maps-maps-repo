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
