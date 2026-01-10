# Google Maps NAP Extractor

## Overview

This application extracts NAP (Name, Address, Phone) and business data from Google Maps and stores it in Firebase. It's designed for marketing automation, competitive analysis, and local SEO workflows.

## Vision

Build a complete pipeline that:
1. **Triggers** Google Places API queries (manual or automated)
2. **Extracts** comprehensive business data (NAP, ratings, hours, categories, etc.)
3. **Stores** results in Firebase Firestore for persistence and real-time access
4. **Enables** downstream workflows like lead generation, competitor monitoring, and client reporting

## Current State

### Implemented
- `google_maps_extractor.py` - Core extraction using Google Places API (New)
  - Text search for businesses
  - Detailed place data extraction
  - CSV export functionality
- `advanced_examples.py` - Marketing automation scripts
  - Competitive landscape analysis
  - Lead generation (businesses without websites)
  - NAP consistency audit
  - Market density analysis
  - Monthly monitoring reports

### Not Yet Implemented
- Firebase Firestore integration
- Automated/scheduled queries
- Web interface or API endpoints
- Deduplication logic
- Historical data tracking

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  Search Query   │────▶│  Google Places API   │────▶│  Firebase DB    │
│  (User Input)   │     │  (Text Search +      │     │  (Firestore)    │
└─────────────────┘     │   Place Details)     │     └─────────────────┘
                        └──────────────────────┘
```

## Data Model

### Business Record
```python
{
    # NAP (Core)
    "business_name": str,
    "street_address": str,
    "city": str,
    "province_state": str,
    "postal_code": str,
    "country": str,
    "full_address": str,
    "phone": str,
    "international_phone": str,

    # Digital Presence
    "website": str,
    "google_maps_url": str,
    "photo_url": str,

    # Reputation
    "rating": float,
    "user_rating_count": int,

    # Operations
    "hours": str,
    "business_status": str,
    "price_level": str,

    # Location
    "latitude": float,
    "longitude": float,
    "place_id": str,  # Unique Google identifier

    # Metadata
    "categories": str,
    "extracted_date": str,
    "search_query": str
}
```

## Tech Stack

- **Language**: Python 3.x
- **Google API**: Places API (New) - uses `places.googleapis.com/v1`
- **Database**: Firebase Firestore (planned)
- **Dependencies**: `requests`, `firebase-admin` (planned)

## Environment Variables

```bash
GOOGLE_MAPS_API_KEY=your-google-api-key
FIREBASE_PROJECT_ID=your-firebase-project  # planned
FIREBASE_CREDENTIALS_PATH=path/to/credentials.json  # planned
```

## Key Files

| File | Purpose |
|------|---------|
| `google_maps_extractor.py` | Core extraction class and CLI |
| `advanced_examples.py` | Marketing automation examples |
| `.env` | Environment variables (gitignored) |
| `requirements.txt` | Python dependencies |

## Usage

### Basic Extraction
```bash
python google_maps_extractor.py
# Enter query when prompted: "dental clinics in Toronto"
```

### Programmatic Use
```python
from google_maps_extractor import GoogleMapsExtractor

extractor = GoogleMapsExtractor(api_key)
businesses = extractor.batch_extract("naturopathic clinics in Toronto")
extractor.export_to_csv(businesses, "output.csv")
```

## Next Steps (Priority Order)

1. **Firebase Integration**
   - Set up Firestore database
   - Add `firebase-admin` dependency
   - Create `firebase_client.py` module
   - Implement `save_to_firebase()` method

2. **Deduplication**
   - Use `place_id` as unique key
   - Update existing records vs. create new

3. **Historical Tracking**
   - Store extraction timestamps
   - Track rating/review changes over time

4. **API Layer**
   - FastAPI or Flask endpoints
   - Trigger extractions via HTTP

5. **Scheduling**
   - Cloud Functions or cron jobs
   - Automated monthly monitoring

## API Costs

- Text Search: $32/1,000 requests
- Place Details: $17/1,000 requests
- Monthly free credit: $200 (~540 searches/month)

## Development Notes

- The Places API (New) is different from the legacy Places API
- Max 20 results per search query
- Rate limit: 0.5s delay between detail requests
- `place_id` is the stable unique identifier for businesses
