# Google Maps Query Dashboard

## Overview

A modern full-stack application for managing Google Maps business extraction queries. Features Google OAuth login, query management, data extraction from Google Maps API, version history, and Firebase storage.

## Current Status (Updated: January 10, 2026)

### Deployment Status

| Component | Status | URL |
|-----------|--------|-----|
| Frontend (GitHub Pages) | **Live** | https://elmandalorian-thx.github.io/maps-maps-maps-repo/ |
| Backend API | **Not Deployed** | Needs Cloud Run or similar |
| Firebase Auth | **Working** | Google OAuth functional |
| Firebase Firestore | **Working** | Database operational |

### Recent Fixes (January 10, 2026)

1. **GitHub Pages Routing Fix**
   - Issue: Blank page on deployed site
   - Cause: `BrowserRouter` missing `basename` prop for subdirectory deployment
   - Fix: Added `basename="/maps-maps-maps-repo"` to `BrowserRouter` in `App.tsx`

2. **Firebase Auth Domain Fix**
   - Issue: Google Sign-in popup opening and immediately closing
   - Cause: `elmandalorian-thx.github.io` not in Firebase authorized domains
   - Fix: Added domain to Firebase Console > Authentication > Settings > Authorized domains

### Current Development Phase

**Phase 4: UI/UX Redesign** - COMPLETE
- Dark theme with glassmorphism effects
- Modern, sleek design language
- Professional dashboard experience
- Login page with Google OAuth
- Responsive layout

**Phase 5: Backend Deployment** - IN PROGRESS
- Frontend deployed to GitHub Pages
- Backend needs deployment to Cloud Run/Railway/Render
- API URL needs to be configured in GitHub Secrets

## Development Phases

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Project Setup (frontend/backend scaffolding) | Complete |
| Phase 2 | Authentication (Google OAuth via Firebase) | Complete |
| Phase 3 | Core Functionality (queries, extraction, versions) | Complete |
| Phase 4 | UI/UX Redesign (dark theme, glassmorphism) | Complete |
| Phase 5 | Backend Deployment | **In Progress** |
| Phase 6 | Cascading Query Feature | **Planned** |
| Phase 7 | Testing, Polish & Documentation | Pending |

## Tech Stack

### Frontend (`/frontend`)
- **Framework**: React 19 + Vite + TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **State**: Zustand (auth) + TanStack Query (server state)
- **Routing**: React Router v6 (with basename for GitHub Pages)
- **Auth**: Firebase Auth (Google OAuth)
- **Hosting**: GitHub Pages

### Backend (`/backend`)
- **Framework**: FastAPI (Python)
- **Database**: Firebase Firestore
- **Auth**: Firebase Admin SDK (token verification)
- **Extraction**: Google Places API (New)
- **Hosting**: Cloud Run (planned)

### Infrastructure
- **Auth Provider**: Firebase Authentication
- **Database**: Firebase Firestore
- **Frontend Hosting**: GitHub Pages
- **Backend Hosting**: Cloud Run (planned)
- **CI/CD**: GitHub Actions

## Project Structure

```
Maps-maps-map-repo/
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Pages deployment
├── frontend/                    # React + Vite app
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui components
│   │   │   ├── auth/            # LoginButton, ProtectedRoute, UserMenu
│   │   │   ├── dashboard/       # QueryList, QueryCard, QueryFilters, AddQueryDialog
│   │   │   ├── query-detail/    # DataPreviewTable, VersionHistory, ActionBar
│   │   │   └── layout/          # Header, Layout
│   │   ├── data/                # Static data (locations.ts)
│   │   ├── hooks/               # useQueries, useQueryDetail
│   │   ├── services/            # firebase.ts, api.ts, auth.ts
│   │   ├── stores/              # authStore.ts
│   │   ├── types/               # TypeScript interfaces
│   │   └── pages/               # LoginPage, DashboardPage, QueryDetailPage
│   ├── public/
│   │   └── 404.html             # SPA fallback for GitHub Pages
│   ├── vite.config.ts           # Includes base path for GitHub Pages
│   ├── .env.local               # Firebase config (gitignored)
│   └── package.json
│
├── backend/                     # FastAPI server
│   ├── app/
│   │   ├── main.py              # FastAPI app entry
│   │   ├── config.py            # Settings from env
│   │   ├── routers/             # auth, queries, extraction, export, metadata
│   │   ├── services/            # firebase_service, extractor_service
│   │   ├── middleware/          # auth middleware (token verification)
│   │   └── models/              # Pydantic models
│   ├── .env                     # API keys, Firebase creds (gitignored)
│   └── requirements.txt
│
├── google_maps_extractor.py     # Core extraction logic (standalone)
├── firebase_client.py           # Legacy Firebase client
├── CLAUDE.md                    # This file - project documentation
└── README.md                    # Setup guide for standalone extractor
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/queries` | List user's queries (with filters) |
| POST | `/api/queries` | Create new query |
| DELETE | `/api/queries/{id}` | Delete query |
| POST | `/api/queries/{id}/extract` | Run Google Maps extraction |
| GET | `/api/queries/{id}/versions` | Get version history |
| POST | `/api/queries/{id}/versions` | Save extraction as version |
| GET | `/api/queries/{id}/versions/{vid}` | Get version data |
| POST | `/api/queries/{id}/versions/{vid}/save` | Save to main collection |
| POST | `/api/export/csv` | Export to CSV |
| GET | `/api/metadata/business-types` | Get distinct business types |
| GET | `/api/metadata/cities` | Get distinct cities |

## Firebase Collections

| Collection | Purpose |
|------------|---------|
| `queries` | User's search queries |
| `queries/{id}/versions` | Extraction version history |
| `queries/{id}/versions/{vid}/businesses` | Versioned business data |
| `businesses` | Main business collection |

## Running Locally

### Prerequisites
- Node.js 18+
- Python 3.11+
- Firebase project with Auth + Firestore enabled
- Google Maps API key

### Frontend
```bash
cd frontend
npm install
npm run dev  # Runs on http://localhost:5173+
```

### Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### Environment Variables

**frontend/.env.local**
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_API_URL=http://localhost:8000
```

**backend/.env**
```
GOOGLE_MAPS_API_KEY=...
FIREBASE_CREDENTIALS_PATH=/path/to/service-account.json
FIREBASE_PROJECT_ID=...
CORS_ORIGINS=["http://localhost:5173","http://localhost:5174","http://localhost:5175","http://localhost:5176"]
```

**GitHub Secrets (for deployment)**
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_API_URL              # Set to deployed backend URL
```

## Next Steps - Phase 5: Backend Deployment

### Option A: Google Cloud Run (Recommended)
1. Create a `Dockerfile` in `/backend`
2. Build and push image to Google Container Registry
3. Deploy to Cloud Run
4. Configure environment variables in Cloud Run
5. Update `VITE_API_URL` GitHub Secret with Cloud Run URL
6. Add Cloud Run URL to Firebase Auth authorized domains
7. Redeploy frontend

### Option B: Railway/Render
1. Connect GitHub repo to Railway/Render
2. Configure build settings for FastAPI
3. Set environment variables
4. Get deployment URL
5. Update `VITE_API_URL` GitHub Secret
6. Add URL to Firebase Auth authorized domains
7. Redeploy frontend

### Backend Deployment Checklist
- [ ] Create Dockerfile for backend
- [ ] Set up Cloud Run / Railway / Render
- [ ] Configure CORS for production domain
- [ ] Set environment variables (API keys, Firebase credentials)
- [ ] Update `VITE_API_URL` in GitHub Secrets
- [ ] Add backend domain to Firebase authorized domains
- [ ] Test full flow end-to-end

## UI Design System

### Color Palette
- Background: `#0a0a0f` to `#1a1a2e` (gradient)
- Card Glass: `rgba(255, 255, 255, 0.05)` with backdrop blur
- Primary Accent: `#6366f1` (indigo) to `#8b5cf6` (violet)
- Success: `#10b981` (emerald)
- Warning: `#f59e0b` (amber)
- Text Primary: `#f8fafc`
- Text Secondary: `#94a3b8`

### Key Components
- Glass cards with backdrop blur
- Gradient buttons and badges
- Subtle hover animations
- Dark scrollbars
- Loading spinners with glow effects

## API Costs

- Google Places Text Search: $32/1,000 requests
- Google Places Details: $17/1,000 requests
- Monthly free credit: $200
- Firebase: Free tier (50K reads, 20K writes/day)

## Troubleshooting

### GitHub Pages shows blank page
- Ensure `BrowserRouter` has `basename="/maps-maps-maps-repo"`
- Check browser console for errors
- Verify GitHub Actions deployment succeeded

### Google Sign-in popup closes immediately
- Add your domain to Firebase Console > Authentication > Settings > Authorized domains
- For GitHub Pages: add `elmandalorian-thx.github.io`

### "Failed to load queries" error
- Backend API not deployed or not reachable
- Check `VITE_API_URL` is set correctly
- Verify backend is running and accessible

### CORS errors
- Add frontend domain to backend's `CORS_ORIGINS`
- For Cloud Run: update environment variable

## Phase 6: Cascading Query Feature

### Overview
Add hierarchical location selectors (Country > Province/State > City) with cascading checkbox functionality to bulk-create queries across multiple locations.

### Location Data
Location data is stored in `frontend/src/data/locations.ts`:
- **Canada**: 13 provinces/territories, ~20 cities each (by population)
- **United States**: 50 states + DC, ~30 cities each (by population)
- Total: ~1,800+ cities with comprehensive coverage

### Feature Requirements

#### 1. Add Query Dialog Enhancement
- **Country Selector**: Dropdown with Canada and United States
- **Province/State Selector**: Cascading dropdown based on selected country
- **City Selector**: Cascading dropdown based on selected province/state
- **Cascade Checkbox**: When ticked, expands the query to multiple locations

#### 2. Cascading Logic
| Checkbox State | Selection | Result |
|----------------|-----------|--------|
| Unchecked | Canada > Ontario > Kingston | Creates 1 query for Kingston, ON |
| Checked | Canada > Ontario > Kingston | Creates ~20 queries (all Ontario cities) |
| Checked | Canada > Ontario > (none) | Creates ~20 queries (all Ontario cities) |
| Checked | Canada > (none) > (none) | Creates ~260 queries (all Canadian cities) |
| Checked | (none) > (none) > (none) | Creates ~1,800 queries (all cities) |

#### 3. Dashboard Filter Enhancement
- Add Country filter dropdown
- Add Province/State filter dropdown (cascades based on country)
- Add City filter dropdown (cascades based on province/state)

### Implementation Checklist
- [x] Create location data file (`frontend/src/data/locations.ts`)
- [ ] Update AddQueryDialog with location selectors
- [ ] Implement cascading dropdown logic
- [ ] Add cascade checkbox with confirmation modal
- [ ] Update QueryFilters with location filters
- [ ] Update query creation API to handle bulk creation
- [ ] Add progress indicator for bulk query creation
- [ ] Test with various cascade combinations

### Data Structure
```typescript
interface City {
  name: string;
  province: string;
  country: string;
}

interface Province {
  name: string;
  abbreviation: string;
  cities: City[];
}

interface Country {
  name: string;
  code: string;
  provinces: Province[];
}
```

### Helper Functions Available
- `getCountries()` - Returns list of all countries
- `getProvinces(countryCode)` - Returns provinces for a country
- `getCities(countryCode, provinceAbbr)` - Returns cities for a province
- `getAllCitiesInCountry(countryCode)` - Returns all cities in a country
- `getAllCitiesInProvince(countryCode, provinceAbbr)` - Returns all cities in a province

### UI/UX Considerations
- Show estimated query count before cascade execution
- Confirmation modal for large cascade operations (>50 queries)
- Progress bar during bulk query creation
- Ability to cancel mid-operation
- Clear visual indication of cascade mode
