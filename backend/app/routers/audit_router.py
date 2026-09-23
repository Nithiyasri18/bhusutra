from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("", response_model=list[schemas.AuditLogOut])
def list_audit_logs(
    record_id: str | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    q = db.query(models.AuditLog)
    if record_id:
        q = q.filter(models.AuditLog.record_id == record_id)
    return q.order_by(models.AuditLog.timestamp.desc()).limit(200).all()
