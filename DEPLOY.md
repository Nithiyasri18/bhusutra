# BhuSutra production deployment

BhuSutra uses React/Vite on Vercel and FastAPI/PostgreSQL on Render. It does not create demo users or sample land records. Citizen accounts are self-registered; the first administrator is provisioned explicitly, and administrators create staff accounts.

## Database migration and first administrator

1. Back up the Render PostgreSQL database before deploying. The first Alembic migration creates the role, OCR-result and verification-score schema and converts existing string foreign keys. It does not delete user, document, record, or audit data. Review the migration and confirm the schema conversion matches the deployed database before applying it.
2. Apply the Render Blueprint from the repository root. Its pre-deploy command runs `alembic upgrade head` before starting the API.
3. In the Render service Shell, bootstrap the first real administrator using the interactive prompts:

   ```powershell
   cd backend
   python bootstrap_admin.py
   ```

   The script refuses to create another first administrator once an Admin exists. It does not ship or print an account or password. Afterward, Admin users can provision Officer, Admin, and Auditor accounts from **Staff accounts**. New staff members set their own password with **Forgot password**.
4. Do not run a database seed script. No seed script is included.

## Render environment

The repository-root `.python-version` pins Render's native Python runtime to **3.12.8**. Keep the Render service root directory at the repository root so Render reads this file and the Blueprint's `backend/...` paths resolve correctly. The FastAPI/Pydantic/SQLAlchemy versions in `backend/requirements.txt` are intentionally pinned and compatible with this runtime; do not override the service's Python version to 3.14 without updating and testing the dependency set.

Configure these service variables in Render:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Render PostgreSQL connection string; provided by the Blueprint |
| `SECRET_KEY` | Random secret of at least 32 characters for signing JWTs |
| `ALLOWED_ORIGINS` | Comma-separated exact frontend origins, including `https://bhusutra-mu.vercel.app` |
| `GEMINI_API_KEY` | Google AI Studio API key; never commit it |
| `GEMINI_MODEL` | Gemini model name; Blueprint defaults to `gemini-2.5-flash` |
| `UPLOAD_DIR` | Blueprint sets `/var/data/uploads`, on the attached persistent disk |
| `FRONTEND_URL` | The frontend origin used in password-reset links |
| `SMTP_HOST`, `SMTP_PORT` | SMTP host and STARTTLS port (Blueprint defaults to `587`) |
| `SMTP_USER`, `SMTP_PASSWORD` | SMTP credentials; use a provider-issued app password where applicable |
| `SMTP_FROM_EMAIL` | Verified sender address for reset messages |

Do not put quotes around values or include trailing slashes in origins. Generate secrets in the hosting dashboard; do not place production credentials in `.env`, Vercel source, or Git.

The Gemini Copilot returns a configuration error until `GEMINI_API_KEY` is set. Forgot-password requests return an email configuration error until SMTP and `FRONTEND_URL` are set. Both features fail explicitly rather than pretending to have succeeded.

The persistent Render disk keeps uploaded files across service restarts. The Blueprint attaches a 1 GB paid disk; confirm the current plan, disk pricing, and size availability in Render before applying it. Back the disk up independently according to your retention policy. Database backup alone does not back up document files.

## Vercel environment

Set `VITE_API_URL` to the actual HTTPS URL displayed on the Render service page, with no trailing slash. Set it for Production (and Preview if that deployment should use the API), then redeploy Vercel: Vite embeds this variable at build time. Confirm the production JavaScript sends requests to the Render origin, never `localhost`.

The backend CORS allow-list must include the exact Vercel origin. For a preview deployment, add its exact origin only if that preview needs API access.

## Local development

Copy `backend/.env.example` to `backend/.env`, use a local PostgreSQL database, and generate a private development `SECRET_KEY` with at least 32 characters. Run:

```powershell
cd backend
python -m pip install -r requirements.txt
alembic upgrade head
python bootstrap_admin.py
uvicorn app.main:app --reload
```

Set `VITE_API_URL` in `frontend/.env.local` to `http://localhost:8000`, then run `npm install` and `npm run dev` in `frontend`. The root `.gitignore` excludes `.env` files.

## Implemented services and limitations

- `POST /auth/register` creates a Citizen only; passwords use PBKDF2-SHA256 hashing. JWT-protected routes enforce role access on the server.
- `POST /api/copilot` accepts authenticated Citizen requests only. It provides general guidance and cannot inspect a citizen's database records or approve documents.
- `POST /documents/upload` accepts PDF, JPG and PNG files up to 15 MB. Tesseract OCR runs on uploaded images and up to five PDF pages. Extraction is preliminary and must be reviewed against the source.
- Camera capture requires browser permission and HTTPS. The client checks image brightness and blur before enabling capture/upload.
- Readiness scores include extraction completeness and OCR confidence. Identifier/ownership checks remain unavailable and earn no points until an official source is connected; as a result the current score cannot auto-verify ownership. Documents are sent to officer review rather than presenting synthetic verification as fact.
- DILRMP, LRMS, Bhulekh, and state-system adapter contracts are present, but no official API credentials or endpoints are configured. Requests report **Official verification service unavailable** and never fabricate a match or successful sync.
- Audit actions, document metadata, OCR output, score components, verification cases, and account records are stored in PostgreSQL.

## Post-deployment checks

1. Open the Render health endpoint `/`; expect `{"status":"BhuSutra API running"}`.
2. Confirm Alembic completed successfully in Render deploy logs.
3. Register a real Citizen account and sign in. No sample account is available.
4. Upload a permitted file and verify OCR output, score reasons, and upload history.
5. Provision staff through the Admin screen and confirm password reset delivery.
6. Confirm unauthorized roles receive `403` from protected endpoints and the Copilot is accessible only to Citizens.
7. Check browser Network requests use the configured Render URL, CORS allows the exact Vercel origin, and Render logs show no Gemini/SMTP configuration errors.
