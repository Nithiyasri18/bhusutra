# BhuSutra Production Deployment

This deploys the existing FastAPI backend to Render and connects the existing Vercel frontend to it. The frontend API client already uses `VITE_API_URL`, with `http://localhost:8000` only as the local-development fallback.

## 1. Push the repository

From the repository root:

```powershell
git add .
git commit -m "Prepare backend deployment"
git push origin main
```

## 2. Create the Render Blueprint

1. Sign in at [Render](https://render.com) and connect the GitHub account that owns this repository.
2. Select **New +** and choose **Blueprint**.
3. Select the BhuSutra GitHub repository and branch `main`.
4. Render detects the root `render.yaml`.
5. Review the `bhusutra-api` web service and `bhusutra-postgres` database, then apply the Blueprint.

The web service uses:

```text
Build: pip install -r backend/requirements.txt
Start: uvicorn app.main:app --host 0.0.0.0 --port $PORT --app-dir backend
Health: /
```

The manifest uses Render's paid `basic-256mb` PostgreSQL plan rather than assuming a free database tier. Render plan names, availability, region support, and pricing can change; if the plan is unavailable in your account, choose the currently offered managed PostgreSQL plan in the Render dashboard and keep the generated `DATABASE_URL` environment variable.

## 3. Set backend environment variables

In the Render web service environment settings, set:

```text
SECRET_KEY=<generate a long random production secret>
ALLOWED_ORIGINS=https://bhusutra-mu.vercel.app,http://localhost:5173
GEMINI_API_KEY=<Google AI Studio API key>
GEMINI_MODEL=gemini-2.5-flash
```

Do not commit `SECRET_KEY` or `GEMINI_API_KEY` to GitHub. Keep `http://localhost:5173` in the comma-separated list only if local frontend development should call the deployed API. The AI Copilot requires a valid Gemini API key; without one, its endpoint returns a configuration error.

`DATABASE_URL` is connected automatically by the Blueprint from the managed `bhusutra-postgres` database. Do not replace it with a SQLite URL.

## 4. Seed the Render PostgreSQL database

The seed script deletes existing users, documents, records, verification cases, and audit logs before inserting demo data. Run it once on a new/empty production database.

After the Render web service and database are available:

1. Open the `bhusutra-api` service in Render.
2. Open **Shell**.
3. Run from the repository root:

```bash
cd backend
python seed.py
```

This working directory is required because `seed.py` imports `app.database`, `app.models`, and `app.auth`. The command uses Render's `DATABASE_URL` environment variable, so it seeds Render PostgreSQL, not a local database.

The existing backend demo account is:

```text
verifier@bhusutra.gov.in
demo123
```

## 5. Connect Vercel

1. Open the Vercel project for the deployed frontend.
2. Go to **Project Settings → Environment Variables**.
3. Add `VITE_API_URL` for Production (and Preview if required):

```text
VITE_API_URL=https://<your-render-service>.onrender.com
```

Do not add a trailing slash. Use the actual public URL shown in the Render service page. Save the variable and trigger **Redeploy** from Vercel. Vite injects `VITE_API_URL` at build time, so changing it requires a new frontend deployment.

## 6. Production tests

### Backend health

Open:

```text
https://<your-render-service>.onrender.com/
```

Expected response:

```json
{"status":"BhuSutra API running"}
```

PowerShell check:

```powershell
Invoke-RestMethod https://<your-render-service>.onrender.com/
```

### Frontend and authentication

Open:

```text
https://bhusutra-mu.vercel.app/login
```

Sign in with:

```text
Email: verifier@bhusutra.gov.in
Password: demo123
```

Confirm in the browser Network and Console panels that:

- `POST <render-url>/auth/login` succeeds
- The dashboard loads from the deployed API
- Records and dashboard requests return successfully
- Verification queue/case APIs work
- GIS-related requests do not fail
- There are no CORS errors
- Requests are not going to `localhost:8000`

If login fails with a CORS error, check that `ALLOWED_ORIGINS` contains the exact Vercel origin with no trailing slash, then redeploy the Render service. If the API returns an authentication error, run the seed command against the Render database and verify the demo credentials.

## Manual actions still required

Render and Vercel account authorization cannot be completed from this repository. You must connect GitHub in Render, apply the Blueprint, enter the real `SECRET_KEY`, run the seed command in the Render Shell, copy the Render URL, add `VITE_API_URL` in Vercel, and redeploy the frontend.