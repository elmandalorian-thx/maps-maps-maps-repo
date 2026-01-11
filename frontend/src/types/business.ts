export interface Business {
  place_id: string;
  business_name: string;
  street_address: string;
  city: string;
  province_state: string;
  postal_code: string;
  country: string;
  full_address: string;
  phone: string;
  international_phone: string;
  website: string;
  google_maps_url: string;
  rating: number | string;
  user_rating_count: number | string;
  price_level: string;
  hours: string;
  categories: string;
  business_status: string;
  latitude: number | string;
  longitude: number | string;
  photo_url: string;
  delivery: boolean | string;
  dine_in: boolean | string;
  takeout: boolean | string;
  reservable: boolean | string;
  serves_breakfast: boolean | string;
  serves_lunch: boolean | string;
  serves_dinner: boolean | string;
  serves_beer: boolean | string;
  serves_wine: boolean | string;
  wheelchair_accessible: boolean | string;
  search_query?: string;
  created_at?: string;
  updated_at?: string;
  // New fields for position ranking
  google_position?: number;
  custom_position?: number;
  // New fields for directory integration
  base_term?: string;
  source_query_id?: string;
  source_version_id?: string;
  is_latest_version?: boolean;
}
