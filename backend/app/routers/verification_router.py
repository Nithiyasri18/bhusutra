import datetime as dt

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from .. import auth, models, schemas
from ..database import get_db

router = APIRouter(prefix="/verification", tags=["verification"])
STAFF_ROLES = ("Officer", "Admin", "Auditor")


def _case_out(case: models.VerificationCase):
    score = case.document.verification_score if case.document else None
    return {
        "id": case.id,
        "document_id": case.document_id,
        "record_id": case.record_id,
        "risk_score": case.risk_score,
        "assigned_to": case.assigned_to,
        "status": case.status,
        "notes": case.notes,
        "created_at": case.created_at,
        "resolved_at": case.resolved_at,
        "document": case.document,
        "score": score.score if score else None,
        "reasons": score.reasons if score else [],
    }


@router.get("/cases", response_model=list[schemas.VerificationCaseOut])
def list_cases(
    status: str | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(*STAFF_ROLES)),
):
    query = db.query(models.VerificationCase).options(
        joinedload(models.VerificationCase.document).joinedload(models.Document.verification_score)
    )
    if status:
        query = query.filter(models.VerificationCase.status == status)
    return [_case_out(case) for case in query.order_by(models.VerificationCase.created_at.desc()).limit(500).all()]


@router.post("/cases/{case_id}/assign", response_model=schemas.VerificationCaseOut)
def assign_case(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles("Officer", "Admin")),
):
    case = db.query(models.VerificationCase).options(joinedload(models.VerificationCase.document)).filter(
        models.VerificationCase.id == case_id
    ).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    if case.status != "Open":
        raise HTTPException(status_code=409, detail="Only open cases can be assigned")
    case.assigned_to = current_user.id
    auth.write_audit(db, current_user, "Verification case assigned", current=case.id, case_id=case.id, document_id=case.document_id)
    db.commit()
    db.refresh(case)
    return _case_out(case)


@router.post("/cases/{case_id}/action", response_model=schemas.VerificationCaseOut)
def act_on_case(
    case_id: str,
    payload: schemas.CaseActionRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles("Officer", "Admin")),
):
    case = db.query(models.VerificationCase).options(joinedload(models.VerificationCase.document)).filter(
        models.VerificationCase.id == case_id
    ).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    if case.status != "Open":
        raise HTTPException(status_code=409, detail="This case has already been resolved")
    if case.assigned_to and case.assigned_to != current_user.id and current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="This case is assigned to another officer")

    previous_status = case.status
    case.status = "Approved" if payload.action == "Approve" else "Rejected"
    case.notes = payload.notes
    case.resolved_at = dt.datetime.now(dt.timezone.utc)
    auth.write_audit(
        db,
        current_user,
        f"Verification case {payload.action.lower()}d",
        previous=previous_status,
        current=case.status,
        case_id=case.id,
        document_id=case.document_id,
    )
    if case.document:
        case.document.status = "Officer Approved" if payload.action == "Approve" else "Rejected"
    db.commit()
    db.refresh(case)
    return _case_out(case)
