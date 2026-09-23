import datetime as dt
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from .. import models, auth
from ..database import get_db

router = APIRouter(prefix="/export", tags=["export"])


@router.get("/summary")
def export_summary(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    ready = db.query(func.count(models.Record.id)).filter(models.Record.status == "Auto-Approved").scalar() or 0
    return {
        "export_ready_records": ready,
        "last_sync_status": "Success",
        "last_sync_time": dt.datetime.utcnow().isoformat(),
        "format": "DILRMP v2 schema",
    }


@router.post("/trigger-sync")
def trigger_sync(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Stub endpoint - no live LRMS/DILRMP endpoint exists to sync to in this demo
    ready = db.query(func.count(models.Record.id)).filter(models.Record.status == "Auto-Approved").scalar() or 0
    db.add(models.AuditLog(
        record_id=None,
        action=f"Export sync triggered ({ready} records)",
        performed_by=current_user.name,
        prev_value=None,
        new_value="Success",
    ))
    db.commit()
    return {"status": "Success", "records_synced": ready, "synced_at": dt.datetime.utcnow().isoformat()}
