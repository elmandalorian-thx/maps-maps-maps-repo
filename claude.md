# Google Maps Query Dashboard

## Overview

A modern full-stack application for managing Google Maps business extraction queries. Features Google OAuth login, query management, data extraction from Google Maps API, version history, and Firebase storage.

## Current Development Phase

### Phase 4: UI/UX Redesign (Current)
The core functionality is complete. Now focusing on aesthetic overhaul:
- Dark theme with glassmorphism effects
- Modern, sleek design language
- Professional dashboard experience

### Completed Phases
- **Phase 1**: Project Setup (frontend/backend scaffolding)
- **Phase 2**: Authentication (Google OAuth via Firebase)
- **Phase 3**: Core Functionality (queries, extraction, versions)

## Tech Stack

### Frontend (`/frontend`)
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **State**: Zustand (auth) + TanStack Query (server state)
- **Routing**: React Router v6
- **Auth**: Firebase Auth (Google OAuth)

### Backend (`/backend`)
- **Framework**: FastAPI (Python)
- **Database**: Firebase Firestore
- **Auth**: Firebase Admin SDK (token verification)
- **Extraction**: Google Places API (New)

### Infrastructure
- **Auth Provider**: Firebase Authentication
- **Database**: Firebase Firestore
- **Hosting**: Firebase Hosting (frontend) + Cloud Run (backend) - planned

## Project Structure

```
Maps-maps-map-repo/
├── frontend/                    # React + Vite app
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui components
│   │   │   ├── auth/            # LoginButton, ProtectedRoute, UserMenu
│   │   │   ├── dashboard/       # QueryList, QueryCard, QueryFilters, AddQueryDialog
│   │   │   ├── query-detail/    # DataPreviewTable, VersionHistory, ActionBar
│   │   │   └── layout/          # Header, Layout
│   │   ├── hooks/               # useQueries, useQueryDetail
│   │   ├── services/            # firebase.ts, api.ts, auth.ts
│   │   ├── stores/              # authStore.ts
│   │   ├── types/               # TypeScript interfaces
│   │   └── pages/               # LoginPage, DashboardPage, QueryDetailPage
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
├── google_maps_extractor.py     # Core extraction logic
├── firebase_client.py           # Legacy Firebase client
└── claude.md                    # This file
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

## UI Redesign Plan (Phase 4)

### Design Goals
- **Dark Theme**: Deep charcoal/navy backgrounds
- **Glassmorphism**: Frosted glass cards with backdrop blur
- **Modern Typography**: Clean, readable fonts
- **Accent Colors**: Vibrant gradients for CTAs
- **Smooth Animations**: Subtle transitions and micro-interactions

### Key Components to Redesign
1. **Layout/Header**: Dark navbar with glass effect
2. **Dashboard**: Glass cards for queries, gradient status badges
3. **Query Cards**: Hover effects, subtle shadows
4. **Add Query Dialog**: Modern modal with blur backdrop
5. **Query Detail Page**: Glass panels, modern data table
6. **Buttons/Forms**: Gradient buttons, styled inputs
7. **Empty States**: Engaging illustrations

### Color Palette (Proposed)
- Background: `#0a0a0f` to `#1a1a2e`
- Card Glass: `rgba(255, 255, 255, 0.05)` with backdrop blur
- Primary Accent: `#6366f1` (indigo) to `#8b5cf6` (violet)
- Success: `#10b981` (emerald)
- Warning: `#f59e0b` (amber)
- Text Primary: `#f8fafc`
- Text Secondary: `#94a3b8`

## Next Steps

1. **Phase 4**: Complete UI/UX redesign
2. **Phase 5**: Testing and polish
3. **Phase 6**: Deployment (Firebase Hosting + Cloud Run)

## API Costs

- Google Places Text Search: $32/1,000 requests
- Google Places Details: $17/1,000 requests
- Monthly free credit: $200
- Firebase: Free tier (50K reads, 20K writes/day)
