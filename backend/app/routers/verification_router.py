import datetime as dt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/verification", tags=["verification"])


@router.get("/cases", response_model=list[schemas.VerificationCaseOut])
def list_cases(
    status: str | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    q = db.query(models.VerificationCase)
    if status:
        q = q.filter(models.VerificationCase.status == status)
    return q.order_by(models.VerificationCase.created_at.desc()).all()


@router.get("/cases/{case_id}", response_model=schemas.VerificationCaseOut)
def get_case(case_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    case = db.query(models.VerificationCase).filter(models.VerificationCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.post("/cases/{case_id}/assign", response_model=schemas.VerificationCaseOut)
def assign_case(case_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    case = db.query(models.VerificationCase).filter(models.VerificationCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    case.assigned_to = current_user.id
    db.commit()
    db.refresh(case)
    return case


@router.post("/cases/{case_id}/action", response_model=schemas.VerificationCaseOut)
def act_on_case(
    case_id: str,
    payload: schemas.CaseActionRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    case = db.query(models.VerificationCase).filter(models.VerificationCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    prev_status = case.status
    if payload.action == "Approve":
        case.status = "Approved"
    elif payload.action == "Reject":
        case.status = "Rejected"
    elif payload.action == "Escalate":
        case.status = "Escalated"
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    case.notes = payload.notes
    case.resolved_at = dt.datetime.utcnow()
    db.commit()
    db.refresh(case)

    record = db.query(models.Record).filter(models.Record.id == case.record_id).first()
    if record:
        prev_record_status = record.status
        record.status = "Auto-Approved" if payload.action == "Approve" else (
            "Rejected" if payload.action == "Reject" else "Needs Review"
        )
        db.commit()

        db.add(models.AuditLog(
            record_id=record.id,
            action=f"Verification case {payload.action.lower()}d by {current_user.name}",
            performed_by=current_user.name,
            prev_value=prev_record_status,
            new_value=record.status,
        ))
        db.commit()

    return case
