from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("", response_model=list[schemas.AuditLogOut])
def list_audit_logs(
    record_id: str | None = None,
    document_id: str | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles("Officer", "Admin", "Auditor")),
):
    q = db.query(models.AuditLog)
    if record_id:
        q = q.filter(models.AuditLog.record_id == record_id)
    if document_id:
        q = q.filter(models.AuditLog.document_id == document_id)
    return q.order_by(models.AuditLog.timestamp.desc()).limit(200).all()
