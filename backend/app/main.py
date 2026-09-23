from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from . import models  # noqa: F401 (ensures models are registered before create_all)
from .routers import (
    auth_router,
    dashboard_router,
    documents_router,
    records_router,
    verification_router,
    audit_router,
    export_router,
    users_router,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="BhuSutra API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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


@app.get("/")
def root():
    return {"status": "BhuSutra API running"}
