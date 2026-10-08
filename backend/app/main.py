import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import (
    auth_router,
    dashboard_router,
    documents_router,
    records_router,
    verification_router,
    audit_router,
    export_router,
    users_router,
    copilot_router,
    official_router,
)

app = FastAPI(title="BhuSutra API", version="2.0.0")
allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(dashboard_router.router)
app.include_router(documents_router.router)
app.include_router(records_router.router)
app.include_router(verification_router.router)
app.include_router(audit_router.router)
app.include_router(export_router.router)
app.include_router(users_router.router)
app.include_router(copilot_router.router)
app.include_router(official_router.router)


@app.get("/")
def root():
    return {"status": "BhuSutra API running"}
