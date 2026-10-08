from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import auth, models
from ..database import get_db

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    documents = db.query(models.Document)
    cases = db.query(models.VerificationCase)
    if current_user.role == "Citizen":
        documents = documents.filter(models.Document.uploaded_by == current_user.id)
        cases = cases.join(models.Document).filter(models.Document.uploaded_by == current_user.id)
    elif current_user.role not in ("Officer", "Admin", "Auditor"):
        return {"total_documents": 0, "verified_documents": 0, "pending_reviews": 0, "rejected_documents": 0, "high_risk_cases": 0}

    total_documents = documents.with_entities(func.count(models.Document.id)).scalar() or 0
    verified = documents.filter(models.Document.status.in_(("Auto Verified", "Officer Approved"))).with_entities(
        func.count(models.Document.id)
    ).scalar() or 0
    pending = documents.filter(models.Document.status.in_(("Uploaded", "OCR Processing", "Officer Review", "High Risk"))).with_entities(
        func.count(models.Document.id)
    ).scalar() or 0
    rejected = documents.filter(models.Document.status == "Rejected").with_entities(
        func.count(models.Document.id)
    ).scalar() or 0
    high_risk = cases.filter(models.VerificationCase.status == "Open", models.VerificationCase.risk_score >= 40).with_entities(
        func.count(models.VerificationCase.id)
    ).scalar() or 0
    return {
        "total_documents": total_documents,
        "verified_documents": verified,
        "pending_reviews": pending,
        "rejected_documents": rejected,
        "high_risk_cases": high_risk,
    }
