# Google Maps NAP Extractor

## Overview

This application extracts NAP (Name, Address, Phone) and business data from Google Maps and stores it in Firebase Firestore. It's designed for marketing automation, competitive analysis, and local SEO workflows.

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
  - Firebase Firestore integration
- `firebase_client.py` - Firebase Firestore client
  - Save individual or batch businesses
  - Query by city, search query, or get all
  - Find businesses without websites (leads)
  - Extraction logging and history
  - Deduplication using `place_id` as document ID
- `advanced_examples.py` - Marketing automation scripts
  - Competitive landscape analysis
  - Lead generation (businesses without websites)
  - NAP consistency audit
  - Market density analysis
  - Monthly monitoring reports
  - All examples support `save_to_firebase=True`

### Not Yet Implemented
- Automated/scheduled queries (Cloud Functions)
- Web interface or API endpoints
- Historical rating change tracking
- Email/webhook notifications

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  Search Query   │────▶│  Google Places API   │────▶│  Firebase DB    │
│  (User Input)   │     │  (Text Search +      │     │  (Firestore)    │
└─────────────────┘     │   Place Details)     │     └─────────────────┘
                        └──────────────────────┘
```

## Firebase Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Enable **Firestore Database** in production mode

### 2. Generate Service Account Credentials
1. Go to Project Settings > Service Accounts
2. Click "Generate new private key"
3. Save the JSON file securely (e.g., `firebase-credentials.json`)
4. **Never commit this file to git**

### 3. Configure Environment
Add to your `.env` file:
```bash
GOOGLE_MAPS_API_KEY=your-google-api-key
FIREBASE_CREDENTIALS_PATH=/path/to/firebase-credentials.json
FIREBASE_PROJECT_ID=your-project-id  # optional
```

### 4. Install Dependencies
```bash
pip install -r requirements.txt
```

## Firestore Collections

| Collection | Purpose | Document ID |
|------------|---------|-------------|
| `businesses` | Main business data | `place_id` |
| `leads` | Businesses without websites | `place_id` |
| `competitive_analysis` | Competitor research | `place_id` |
| `nap_audits` | NAP consistency audits | `place_id` |
| `market_analysis` | Market density data | `place_id` |
| `monthly_reports` | Monthly monitoring | `place_id` |
| `extraction_logs` | Query history | auto-generated |

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
    "place_id": str,  # Unique Google identifier (used as doc ID)

    # Metadata
    "categories": str,
    "search_query": str,
    "created_at": str,
    "updated_at": str
}
```

## Tech Stack

- **Language**: Python 3.x
- **Google API**: Places API (New) - uses `places.googleapis.com/v1`
- **Database**: Firebase Firestore
- **Dependencies**: `requests`, `firebase-admin`, `python-dotenv`

## Environment Variables

```bash
GOOGLE_MAPS_API_KEY=your-google-api-key
FIREBASE_CREDENTIALS_PATH=path/to/firebase-credentials.json
FIREBASE_PROJECT_ID=your-firebase-project  # optional if in credentials
```

## Key Files

| File | Purpose |
|------|---------|
| `google_maps_extractor.py` | Core extraction class and CLI |
| `firebase_client.py` | Firebase Firestore client |
| `advanced_examples.py` | Marketing automation examples |
| `.env` | Environment variables (gitignored) |
| `requirements.txt` | Python dependencies |

## Usage

### Basic Extraction with Firebase
```bash
python google_maps_extractor.py
# Enter query when prompted
# Choose export option 2 (Firebase) or 3 (Both)
```

### Programmatic Use
```python
from google_maps_extractor import GoogleMapsExtractor

extractor = GoogleMapsExtractor(api_key)
businesses = extractor.batch_extract("naturopathic clinics in Toronto")

# Save to CSV
extractor.export_to_csv(businesses, "output.csv")

# Save to Firebase
extractor.save_to_firebase(businesses, query="naturopathic clinics in Toronto")
```

### Direct Firebase Client Use
```python
from firebase_client import FirebaseClient

firebase = FirebaseClient()

# Save businesses
firebase.save_businesses(businesses)

# Query businesses
toronto_businesses = firebase.get_businesses_by_city("Toronto")
leads = firebase.get_businesses_without_website()
all_data = firebase.get_all_businesses(limit=100)

# Get extraction history
history = firebase.get_extraction_history()
```

### Advanced Examples with Firebase
```python
from advanced_examples import competitive_landscape_analysis

competitive_landscape_analysis(
    api_key,
    competitors=["Business A", "Business B"],
    locations=["Toronto", "Vancouver"],
    save_to_firebase=True  # Enable Firebase storage
)
```

## Next Steps (Priority Order)

1. **Historical Tracking**
   - Store rating snapshots over time
   - Track review count changes
   - Generate trend reports

2. **API Layer**
   - FastAPI or Flask endpoints
   - Trigger extractions via HTTP
   - Webhook notifications

3. **Scheduling**
   - Cloud Functions for automated queries
   - Scheduled monthly monitoring
   - Alert on significant changes

4. **Web Dashboard**
   - View and search stored businesses
   - Run extractions from browser
   - Visualize market data

## API Costs

- Text Search: $32/1,000 requests
- Place Details: $17/1,000 requests
- Monthly free credit: $200 (~540 searches/month)
- Firebase Firestore: Free tier includes 50K reads, 20K writes/day

## Development Notes

- The Places API (New) is different from the legacy Places API
- Max 20 results per search query
- Rate limit: 0.5s delay between detail requests
- `place_id` is the stable unique identifier for businesses
- Firebase credentials should never be committed to git
- Use batch writes for better performance with multiple records
