# BhuSutra — SIH 2026 Prototype (PS 26018)

React + FastAPI + PostgreSQL prototype. Auth, dashboard, upload, verification
workflow, and audit trail are fully wired to a real database. OCR results,
identifier resolution, evidence comparison, GIS map, and analytics use seeded
JSON standing in for the ML/GIS pipeline (clearly commented in code).

## 1. Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL running locally (or update DATABASE_URL to any reachable instance)

## 2. Backend setup (in VS Code terminal)

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create the database (one-time)
createdb bhusutra                # or use pgAdmin / psql to create it

cp .env.example .env
# edit .env if your PostgreSQL user/password/port differ from the default

python seed.py                   # creates tables + loads demo data, prints login accounts

uvicorn app.main:app --reload --port 8000
```

Backend now runs at http://localhost:8000 — interactive API docs at
http://localhost:8000/docs

## 3. Frontend setup (new terminal)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:5173

## 4. Deploy the frontend to Vercel

From the repository root, push the project to GitHub, then import the repository in Vercel.
Set the Vercel project root directory to `frontend`. Vercel will use `npm run build` and publish `dist` automatically.

If the FastAPI backend is deployed separately, add this Vercel environment variable:

```text
VITE_API_URL=https://your-backend-domain.example.com
```

Without that variable, the frontend keeps using `http://localhost:8000` for local development.

## 5. Demo login accounts (password: `demo123` for all)

| Role             | Email                      |
|------------------|-----------------------------|
| Verifier         | verifier@bhusutra.gov.in   |
| Admin            | admin@bhusutra.gov.in      |
| District Officer | officer@bhusutra.gov.in    |
| Auditor          | auditor@bhusutra.gov.in    |

## 6. Demo click-through order (matches the 3-min video flow)

1. Login as Verifier
2. Dashboard — live stats from PostgreSQL
3. Upload — drop a PDF/JPG, watch it appear in Processing Queue (real insert)
4. OCR Results — simulated field extraction with confidence scores
5. Validation — identifier graph (Survey/Khasra/Khata) with a seeded conflict
6. Evidence Comparison — field-by-field mismatch across historical docs
7. Verification Queue → open a case → Approve (real DB write)
8. Audit Trail — the approval you just made appears at the top (live query — the payoff moment)
9. GIS Map — Leaflet map with seeded parcel polygons
10. Analytics — district risk + error-type charts
11. Export — trigger sync (stub endpoint, logs to audit trail)

## 7. What's real vs. simulated

**Fully wired to PostgreSQL:** Login/auth, Dashboard stats, Upload + Processing
Queue, Verification Queue + Case actions, Audit Trail, Export summary/trigger,
User Management list.

**Simulated (seeded JSON in `frontend/src/data/dummy.js`):** OCR field
extraction, Identifier Resolution graph, Evidence Comparison, GIS parcels,
Analytics charts. Swap these for real pipeline output by replacing the
imports in the corresponding page components with API calls once the ML/GIS
services exist.

## 8. Project structure

```
bhusutra/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app + router registration
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── auth.py          # JWT + password hashing
│   │   ├── database.py      # DB session config
│   │   └── routers/         # auth, dashboard, documents, records,
│   │                         # verification, audit, export, users
│   ├── seed.py               # demo data generator
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── pages/            # one file per screen (12 pages)
    │   ├── components/       # Sidebar, Layout, Card
    │   ├── data/dummy.js     # seeded JSON for AI-simulated pages
    │   └── api.js            # axios client with JWT interceptor
    └── package.json
```
