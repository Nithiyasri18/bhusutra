from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/records", tags=["records"])


@router.get("", response_model=list[schemas.RecordOut])
def list_records(
    status: str | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    q = db.query(models.Record)
    if status:
        q = q.filter(models.Record.status == status)
    return q.order_by(models.Record.created_at.desc()).all()


@router.get("/{record_id}", response_model=schemas.RecordOut)
def get_record(record_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    rec = db.query(models.Record).filter(models.Record.id == record_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Record not found")
    return rec
