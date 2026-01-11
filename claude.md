# Google Maps Query Dashboard

## Overview

A modern full-stack application for managing Google Maps business extraction queries. Features Google OAuth login, query management, data extraction from Google Maps API, version history, and Firebase storage.

## Current Status (Updated: January 10, 2026)

### Deployment Status

| Component | Status | URL |
|-----------|--------|-----|
| Frontend (GitHub Pages) | **Live** | https://elmandalorian-thx.github.io/maps-maps-maps-repo/ |
| Backend API (Cloud Run) | **Live** | https://maps-query-api-6bh2oqaesa-uc.a.run.app |
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

3. **Save as Version Not Working** (NEW)
   - Issue: Button click had no effect, no feedback
   - Cause: FastAPI endpoint had `businesses: List[dict]` without `Body()` - treated as query param
   - Fix: Added `Body(..., embed=True)` to `backend/app/routers/queries.py`

4. **Save to Firebase Not Working** (NEW)
   - Issue: Button click had no effect, no feedback
   - Cause: Required `selectedVersionId` but none was set after extraction
   - Fix: Auto-select version after save, added `hasSelectedVersion` prop to ActionBar

5. **Export CSV Not Working** (NEW)
   - Issue: Same as Save as Version
   - Cause: Same FastAPI `Body()` issue in export router
   - Fix: Added `Body(..., embed=True)` to `backend/app/routers/export.py`

6. **No User Feedback** (NEW)
   - Issue: No success/error notifications for any actions
   - Cause: No toast library installed
   - Fix: Installed `sonner`, added `<Toaster>` to App.tsx, toast calls to all mutations

### Current Development Phase

**All Core Phases COMPLETE**
- Phase 1: Project Setup
- Phase 2: Authentication (Google OAuth)
- Phase 3: Core Functionality (queries, extraction, versions)
- Phase 4: UI/UX Redesign (dark theme, glassmorphism)
- Phase 5: Export & Polish (toasts, error handling)
- Phase 6: Deployment (GitHub Pages + Cloud Run)

**Phase 7 COMPLETE: Enterprise Scale - Quarry System** - ALL PHASES (7a-7h) IMPLEMENTED

## Development Phases

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Project Setup (frontend/backend scaffolding) | Complete |
| Phase 2 | Authentication (Google OAuth via Firebase) | Complete |
| Phase 3 | Core Functionality (queries, extraction, versions) | Complete |
| Phase 4 | UI/UX Redesign (dark theme, glassmorphism) | Complete |
| Phase 5 | Export & Polish (toasts, error handling) | Complete |
| Phase 6 | Deployment (GitHub Pages + Cloud Run) | Complete |
| **Phase 7** | **Enterprise Scale - Quarry System** | **Complete** |
| Phase 7a | Database Schema Update (base_terms, local_queries, positions) | **Complete** |
| Phase 7b | Quarry Dashboard Frontend (base terms, bulk generation UI) | **Complete** |
| Phase 7c | Quarry Dashboard Backend (CRUD, bulk generation API) | **Complete** |
| Phase 7d | Local Queries Dashboard Update (compact UI, filters, bulk actions) | **Complete** |
| Phase 7e | Position Ranking & Sorting (googlePosition, customPosition, drag-drop) | **Complete** |
| Phase 7f | Latest Version & Directory Publishing (isLatest flag, publish action) | **Complete** |
| Phase 7g | Async Queue System (in-memory queue, pause/resume, retry failed) | **Complete** |
| Phase 7h | Data Quality & Cleanup (normalization, deduplication, validation) | **Complete** |
| Phase 8 | Testing & Documentation | Pending |

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
- **Notifications**: Sonner (toast library)
- **Hosting**: Google Cloud Run

### Infrastructure
- **Auth Provider**: Firebase Authentication
- **Database**: Firebase Firestore
- **Frontend Hosting**: GitHub Pages
- **Backend Hosting**: Google Cloud Run
- **CI/CD**: GitHub Actions (auto-deploy on push to main)

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

## Deployment Complete

### Backend Deployment (Cloud Run)
- [x] Created `Dockerfile` in `/backend`
- [x] Created `.github/workflows/deploy-backend.yml`
- [x] Configured Cloud Build API, Artifact Registry
- [x] Set environment variables via base64-encoded secrets
- [x] Updated `VITE_API_URL` in GitHub Secrets
- [x] Added Cloud Run URL to Firebase Auth authorized domains
- [x] Tested full flow end-to-end

### Frontend Deployment (GitHub Pages)
- [x] Created `.github/workflows/deploy.yml`
- [x] Configured Firebase secrets in GitHub
- [x] SPA routing with 404.html fallback
- [x] Auto-deploy on push to main

### Required GitHub Secrets
```
# Frontend (Firebase)
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_API_URL=https://maps-query-api-6bh2oqaesa-uc.a.run.app

# Backend (Cloud Run)
GCP_PROJECT_ID
GCP_SA_KEY (service account JSON)
GOOGLE_MAPS_API_KEY
FIREBASE_CREDENTIALS (Firebase Admin SDK JSON)
```

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

## Phase 7: Enterprise Scale Architecture - "Quarry" System

### Overview
A two-tier system designed for **enterprise scale** - 10,000+ records per month. The "Quarry" is the top-level dashboard for managing base search terms and generating thousands of location-specific queries in bulk.

### System Hierarchy

```
┌─────────────────────────────────────────────────────────────────────┐
│                         QUARRY DASHBOARD                            │
│   Base Terms: "naturopathic doctor", "osteopath", "chiropractor"   │
│   → Generate thousands of Local Queries with one click              │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     LOCAL QUERIES DASHBOARD                         │
│   "naturopathic doctor Oakville", "naturopathic doctor Philadelphia"│
│   → Geo filters, status tracking, batch processing                  │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       QUERY DETAIL PAGE                             │
│   Run extraction, Save versions, Export CSV, Data preview           │
│   → Business data with Google Maps position ranking                 │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BUSINESS DIRECTORY (External)                    │
│   Clean, deduplicated data for public directory                     │
│   → Only latest version, shared Firestore database                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Design Goals
- **Scale**: 10,000+ records/month, thousands of keywords × 1,280 locations
- **Efficiency**: Generate 1,000+ queries with a single form submission
- **Clean Data**: Position ranking, deduplication, latest-version tracking
- **Directory Ready**: Shared database structure for external business directory

---

## Tier 1: Quarry Dashboard (Base Terms Management)

### Purpose
Manage base search terms and bulk-generate location-specific Local Queries.

### Features

#### 1.1 Base Terms List
- Display all base terms: "naturopathic doctor", "osteopath", "chiropractor", etc.
- Show stats per term: total queries generated, pending, complete, error count
- Quick actions: Generate queries, View local queries, Delete term

#### 1.2 Create New Base Term
- Simple text input for the base term
- Optional: category/tags for organization
- Saves to Firestore `base_terms` collection

#### 1.3 Bulk Query Generation Form
When clicking "Generate Queries" on a base term:

| Field | Type | Behavior |
|-------|------|----------|
| **Countries** | Multi-select + "All" checkbox | Select one or more countries, or check "All" |
| **Provinces/States** | Multi-select + "All" checkbox | Shows "Province Name - CC" format (e.g., "Ontario - CA", "Texas - US"). Filtered by selected countries. |
| **Cities** | Multi-select + "All" checkbox | Shows "City, Province - CC" format. Filtered by selected provinces. |

#### 1.4 Generation Preview
Before executing:
- Show estimated query count (e.g., "This will create 1,280 queries")
- Show estimated API cost (e.g., "$41.00 at $32/1000 requests")
- Confirmation modal for >50 queries
- Progress bar during creation
- Ability to cancel mid-operation

#### 1.5 Duplicate Detection
- Check existing Local Queries before creation
- Skip duplicates silently OR show summary: "Created 1,200 queries, skipped 80 duplicates"
- Option to regenerate/overwrite existing queries

---

## Tier 2: Local Queries Dashboard (Geographic Variations)

### Purpose
Manage and process all location-specific queries for a base term.

### Navigation
- Click base term in Quarry → Opens Local Queries filtered to that term
- Direct access shows all Local Queries with filters

### Features

#### 2.1 Compact Query Cards (3-Column Layout)
- **50% current size** - Fit 3 columns on page
- Dense info display: keyword, city, province, country, status badge
- Color-coded status:
  - `pending` - Gray
  - `queued` - Blue outline
  - `running` - Blue pulse animation
  - `complete` - Green
  - `error` - Red

#### 2.2 Geo Filters
| Filter | Type | Notes |
|--------|------|-------|
| Country | Dropdown | Canada, United States, All |
| Province/State | Cascading dropdown | Based on country selection |
| City | Cascading dropdown | Based on province selection |
| Status | Multi-select | Pending, Queued, Running, Complete, Error |
| Keyword Search | Text input | Filter by base term |

#### 2.3 Bulk Actions
- **Run All Pending** - Queue all pending queries for processing
- **Pause All** - Stop queue processing
- **Retry Failed** - Re-queue all error queries
- **Delete Selected** - Bulk delete with confirmation
- **Select All / Deselect All** - Checkbox management

#### 2.4 Click-Through to Query Detail
Clicking a Local Query opens the existing Query Detail page with:
- Run Extraction button
- Data Preview table
- Save as Version
- Export CSV
- Version History

---

## Tier 3: Query Detail Page (Enhanced)

### Existing Features (Keep)
- Run Extraction
- Data Preview Table
- Save as Version
- Export CSV
- Version History

### New Features

#### 3.1 Google Maps Position Ranking
Each business record includes:
```typescript
interface Business {
  id: string;
  name: string;
  address: string;
  phone: string;
  website: string;
  rating: number;
  reviewCount: number;
  // NEW FIELDS
  googlePosition: number;      // Position in Google Maps results (1, 2, 3...)
  customPosition: number;      // User-defined position for sorting
  isLatestVersion: boolean;    // Flag for directory display
}
```

#### 3.2 Position Management
- Default sort by `googlePosition` (as returned by Google)
- Drag-and-drop to reorder (updates `customPosition`)
- Toggle between Google order and Custom order
- Reset to Google order button

#### 3.3 Latest Version Flag
- Mark version as "Latest" for directory display
- Only one version can be "Latest" per query
- Auto-mark new extractions as "Latest" (configurable)

---

## Business Directory Integration

### Shared Database Structure
The business directory (separate project) will read from the same Firestore:

```
businesses/{businessId}
  - name: string
  - address: string
  - city: string
  - province: string
  - country: string
  - phone: string
  - website: string
  - rating: number
  - reviewCount: number
  - googlePosition: number
  - customPosition: number
  - category: string (base term)
  - sourceQueryId: string
  - sourceVersionId: string
  - isLatestVersion: boolean
  - createdAt: timestamp
  - updatedAt: timestamp
  - placeId: string (Google Places ID for deduplication)
```

### Directory Query Pattern
```javascript
// Get latest businesses for a category in a city
db.collection('businesses')
  .where('category', '==', 'naturopathic doctor')
  .where('city', '==', 'Oakville')
  .where('isLatestVersion', '==', true)
  .orderBy('customPosition', 'asc')
```

### Data Cleanliness Rules
- Deduplicate by `placeId` (Google's unique identifier)
- Normalize phone numbers to E.164 format
- Validate website URLs
- Trim and normalize addresses
- Flag incomplete records (missing phone, website, etc.)

---

## Technical Architecture

### Firestore Collections (Complete)

```
base_terms/{termId}
  - term: string ("naturopathic doctor")
  - category: string (optional)
  - createdAt: timestamp
  - userId: string
  - stats: {
      totalQueries: number,
      pendingQueries: number,
      completeQueries: number,
      errorQueries: number
    }

local_queries/{queryId}
  - baseTermId: string (reference to base_terms)
  - keyword: string ("naturopathic doctor oakville")
  - baseTerm: string ("naturopathic doctor")
  - city: string
  - province: string
  - country: string
  - status: 'pending' | 'queued' | 'running' | 'complete' | 'error' | 'paused'
  - createdAt: timestamp
  - startedAt: timestamp | null
  - completedAt: timestamp | null
  - error: string | null
  - resultCount: number
  - latestVersionId: string | null
  - userId: string

local_queries/{queryId}/versions/{versionId}
  - createdAt: timestamp
  - resultCount: number
  - isLatest: boolean

local_queries/{queryId}/versions/{versionId}/businesses/{businessId}
  - (all business fields)
  - googlePosition: number
  - customPosition: number

businesses/{businessId}  (denormalized for directory)
  - (all business fields)
  - sourceQueryId: string
  - sourceVersionId: string
  - isLatestVersion: boolean
```

### Queue System Design

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Quarry UI     │────▶│   Backend API    │────▶│   Firestore     │
│   (React)       │     │   (FastAPI)      │     │   (Database)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                       │                        │
        │                       ▼                        │
        │               ┌──────────────────┐             │
        │               │  Cloud Tasks     │             │
        │               │  Queue Worker    │◀────────────┘
        │               │  (Background)    │
        │               └──────────────────┘
        │                       │
        └───────────────────────┘
              Real-time updates via
              Firestore onSnapshot listeners
```

### API Endpoints (New/Updated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Base Terms** |||
| GET | `/api/base-terms` | List all base terms with stats |
| POST | `/api/base-terms` | Create new base term |
| DELETE | `/api/base-terms/{id}` | Delete base term and all queries |
| POST | `/api/base-terms/{id}/generate` | Bulk generate Local Queries |
| **Local Queries** |||
| GET | `/api/local-queries` | List with geo filters, pagination |
| GET | `/api/local-queries/{id}` | Get single query with latest version |
| DELETE | `/api/local-queries/{id}` | Delete query and versions |
| POST | `/api/local-queries/bulk-run` | Queue multiple queries for extraction |
| POST | `/api/local-queries/bulk-delete` | Delete multiple queries |
| **Extraction** |||
| POST | `/api/local-queries/{id}/extract` | Run extraction (existing) |
| **Versions** |||
| GET | `/api/local-queries/{id}/versions` | Get version history |
| POST | `/api/local-queries/{id}/versions` | Save as new version |
| PATCH | `/api/local-queries/{id}/versions/{vid}` | Update version (set as latest) |
| **Businesses** |||
| PATCH | `/api/businesses/{id}/position` | Update custom position |
| POST | `/api/local-queries/{id}/versions/{vid}/publish` | Copy to main businesses collection |
| **Queue** |||
| GET | `/api/queue/status` | Get queue stats (pending, running, etc.) |
| POST | `/api/queue/pause` | Pause all processing |
| POST | `/api/queue/resume` | Resume processing |

---

## Implementation Phases

### Phase 7a: Database Schema Update - COMPLETE
- [x] Create `base_terms` collection structure (Pydantic models)
- [x] Add `googlePosition`, `customPosition` to business records
- [x] Add `isLatestVersion` flag to versions and businesses
- [x] Add `baseTermId` reference to local queries
- [ ] Rename `queries` to `local_queries` (migration script) - DEFERRED
- [ ] Create Firestore indexes for new query patterns - DEFERRED

### Phase 7b: Quarry Dashboard (Frontend) - COMPLETE
- [x] Create `/quarry` route and page
- [x] Build BaseTermsList component
- [x] Build CreateBaseTermDialog
- [x] Build BulkGenerateDialog with:
  - [x] Country multi-select with "All" checkbox
  - [x] Province multi-select showing "Name - CC" format
  - [x] City multi-select with cascading filter
  - [x] Query count preview
  - [x] Cost estimation display
  - [x] Progress indicator during generation
- [x] Add navigation between Quarry and Local Queries
- [x] Build QueueStatusBar component

### Phase 7c: Quarry Dashboard (Backend) - COMPLETE
- [x] Create `base_terms` router with CRUD endpoints
- [x] Implement `/generate` endpoint for bulk Local Query creation
- [x] Add duplicate detection logic
- [x] Implement batch writes (500 at a time for Firestore limits)
- [x] Add stats calculation for base terms

### Phase 7d: Local Queries Dashboard Update - COMPLETE
- [x] Redesign QueryCard to 50% size (compact)
- [x] Implement 4-column responsive grid
- [x] Add geo filter dropdowns (Country, Province, City)
- [x] Add Status filter with all statuses (pending, queued, running, completed, error)
- [x] Add Keyword search with debouncing
- [x] Add bulk selection checkboxes
- [x] Add bulk action buttons (Run All, Delete Selected)
- [x] Add baseTermId filter support via URL params
- [ ] Implement filter persistence (localStorage) - DEFERRED
- [ ] Add pagination/virtualization for 10,000+ queries - DEFERRED

### Phase 7e: Position Ranking & Sorting - COMPLETE
- [x] Capture `googlePosition` during extraction (index in results)
- [x] Add `customPosition` field with default = googlePosition
- [x] Build drag-and-drop reordering in Data Preview table
- [x] Add sort toggle (Google Order / Custom Order)
- [x] Create PATCH endpoint for position updates (`/api/businesses/{id}/position`)

### Phase 7f: Latest Version & Directory Publishing - COMPLETE
- [x] Add "Set as Latest" button to version history
- [x] Implement "Publish to Directory" action
- [x] Create denormalized copy in `businesses` collection
- [x] Add `isLatestVersion` filtering
- [x] Ensure only one "Latest" per query

### Phase 7g: Async Queue System - COMPLETE
- [x] Create in-memory queue service (can upgrade to Cloud Tasks later)
- [x] Create queue endpoints (add, pause, resume, retry-failed)
- [x] Add queue status dashboard widget with controls
- [x] Implement pause/resume functionality
- [x] Add retry failed queries button
- [x] Integrate bulk run with queue system

### Phase 7h: Data Quality & Cleanup - COMPLETE
- [x] Add phone number normalization (E.164 format)
- [x] Add URL validation and normalization
- [x] Implement deduplication detection by `placeId`
- [x] Add data quality scoring (0-100)
- [x] Create DataQualityBadge component
- [x] Create QualityReportCard component
- [x] Add quality report endpoint

---

## Scale Considerations

### Performance Targets
- **Query Generation**: 1,000 queries in <10 seconds
- **Dashboard Load**: <2 seconds for 10,000 queries (paginated)
- **Extraction Queue**: 1-2 queries/second (API rate limits)
- **Monthly Capacity**: 10,000+ new business records

### Firestore Optimization
- **Compound Indexes**:
  - `local_queries`: (userId, baseTerm, country, status)
  - `local_queries`: (userId, country, province, city)
  - `businesses`: (category, city, isLatestVersion)
- **Batch Writes**: Max 500 operations per batch
- **Pagination**: Cursor-based with `startAfter()`
- **Denormalization**: Duplicate data for read performance

### Rate Limiting
- **Google Places API**: 100 QPS limit
- **Queue Throttling**: 1-2 extractions per second
- **Retry Logic**: Exponential backoff (1s, 2s, 4s, 8s, max 60s)
- **Cost Controls**: Daily budget alerts, pause on threshold

### Monitoring
- **Dashboard Stats Widget**:
  - Total base terms
  - Total local queries (by status)
  - Queue depth and ETA
  - API costs this month
  - Errors requiring attention

---

## UI/UX Flow

### User Journey: Creating 1,000 Queries

1. **Quarry Dashboard** → Click "New Base Term"
2. Enter "naturopathic doctor" → Save
3. Click "Generate Queries" on the new term
4. Select Countries: ✓ Canada, ✓ United States
5. Select Provinces: ✓ All (shows 64 provinces/states)
6. Select Cities: ✓ All (shows 1,280 cities)
7. Preview: "This will create 1,280 queries. Estimated cost: $41.00"
8. Click "Generate" → Progress bar shows creation
9. Complete: "Created 1,280 queries. 0 duplicates skipped."
10. Click "View Local Queries" → Filtered dashboard
11. Click "Run All Pending" → Queue starts processing
12. Real-time updates show status changes
13. Click any completed query → View results, save version

### User Journey: Updating for Directory

1. **Local Queries Dashboard** → Filter by Status: Complete
2. Click a query → Query Detail page
3. Review Data Preview → Drag to reorder positions
4. Click "Save as Version" → New version created
5. Click "Set as Latest" on the version
6. Click "Publish to Directory" → Copied to businesses collection
7. Business directory now shows updated data

---

## Data Structures

### TypeScript Interfaces

```typescript
interface BaseTerm {
  id: string;
  term: string;
  category?: string;
  createdAt: Date;
  userId: string;
  stats: {
    totalQueries: number;
    pendingQueries: number;
    completeQueries: number;
    errorQueries: number;
  };
}

interface LocalQuery {
  id: string;
  baseTermId: string;
  keyword: string;         // "naturopathic doctor oakville"
  baseTerm: string;        // "naturopathic doctor"
  city: string;
  province: string;
  country: string;
  status: 'pending' | 'queued' | 'running' | 'complete' | 'error' | 'paused';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  resultCount?: number;
  latestVersionId?: string;
  userId: string;
}

interface QueryVersion {
  id: string;
  createdAt: Date;
  resultCount: number;
  isLatest: boolean;
}

interface Business {
  id: string;
  placeId: string;          // Google Places ID (for deduplication)
  name: string;
  address: string;
  city: string;
  province: string;
  country: string;
  phone: string;            // E.164 format
  website: string;
  rating: number;
  reviewCount: number;
  googlePosition: number;   // Position in Google results
  customPosition: number;   // User-defined sort order
  category: string;         // Base term
  sourceQueryId: string;
  sourceVersionId: string;
  isLatestVersion: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface BulkGenerateRequest {
  baseTermId: string;
  countries: string[];      // ['CA', 'US'] or ['ALL']
  provinces: string[];      // ['ON', 'TX'] or ['ALL']
  cities: string[];         // ['Oakville', 'Austin'] or ['ALL']
}

interface QueueStatus {
  pending: number;
  queued: number;
  running: number;
  complete: number;
  error: number;
  estimatedTimeRemaining: number; // seconds
  currentlyProcessing?: string;   // query ID
}
```

### Location Data Helpers
```typescript
// Existing helpers (from frontend/src/data/locations.ts)
getCountries(): Country[]
getProvinces(countryCode: string): Province[]
getCities(countryCode: string, provinceCode: string): City[]
getAllCitiesInCountry(countryCode: string): City[]
getAllCitiesInProvince(countryCode: string, provinceCode: string): City[]

// New helpers needed
formatProvinceOption(province: Province, country: Country): string
  // Returns "Ontario - CA" or "Texas - US"

formatCityOption(city: City, province: Province, country: Country): string
  // Returns "Oakville, Ontario - CA"

getCitiesForSelection(countries: string[], provinces: string[]): City[]
  // Returns filtered list based on selections

estimateQueryCount(countries: string[], provinces: string[], cities: string[]): number
  // Calculates total queries that would be created

estimateApiCost(queryCount: number): number
  // Returns cost in dollars based on $32/1000 rate
```

---

## Cost Estimation

### API Costs (Google Places)
| Operation | Cost per 1,000 | Monthly @ 10K |
|-----------|----------------|---------------|
| Text Search | $32.00 | $320.00 |
| Place Details | $17.00 | $170.00 |
| **Total** | $49.00 | **$490.00** |

### Free Tier Credits
- Google Maps: $200/month free
- Net cost @ 10K records: ~$290/month

### Firebase Costs
- Firestore reads: 50K/day free (sufficient)
- Firestore writes: 20K/day free (may need upgrade)
- At 10K records/month: ~1K writes/day (within free tier)

---

## Migration Notes

### Renaming `queries` → `local_queries`
1. Create new `local_queries` collection
2. Copy all documents with new fields:
   - Add `baseTermId: null` (legacy queries)
   - Add `baseTerm: keyword.split(' ')[0]` (best guess)
   - Add `latestVersionId: null`
3. Update all frontend references
4. Update all backend references
5. Keep `queries` as backup for 30 days
6. Delete old collection after verification
