from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from .. import models, auth
from ..database import get_db

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def summary(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    total = db.query(func.count(models.Record.id)).scalar() or 0
    auto_approved = db.query(func.count(models.Record.id)).filter(models.Record.status == "Auto-Approved").scalar() or 0
    pending = db.query(func.count(models.Record.id)).filter(models.Record.status == "Needs Review").scalar() or 0
    flagged = db.query(func.count(models.VerificationCase.id)).filter(models.VerificationCase.status == "Open").scalar() or 0
    avg_conf = db.query(func.avg(models.Record.confidence_score)).scalar() or 0

    by_district = (
        db.query(models.Record.district, func.count(models.Record.id))
        .group_by(models.Record.district)
        .all()
    )

    recent_logs = (
        db.query(models.AuditLog)
        .order_by(models.AuditLog.timestamp.desc())
        .limit(10)
        .all()
    )

    return {
        "total_records": total,
        "auto_validated_pct": round((auto_approved / total * 100), 1) if total else 0,
        "pending_review": pending,
        "flagged": flagged,
        "avg_confidence": round(avg_conf, 1),
        "district_breakdown": [{"district": d or "Unknown", "count": c} for d, c in by_district],
        "recent_activity": [
            {
                "record_id": log.record_id,
                "action": log.action,
                "performed_by": log.performed_by,
                "timestamp": log.timestamp,
            }
            for log in recent_logs
        ],
    }
