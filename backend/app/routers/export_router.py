from fastapi import APIRouter, Depends, HTTPException

from .. import auth, models

router = APIRouter(prefix="/export", tags=["export"])


@router.get("/summary")
def export_summary(current_user: models.User = Depends(auth.require_roles("Officer", "Admin"))):
    raise HTTPException(status_code=503, detail="Official verification service unavailable")


@router.post("/trigger-sync")
def trigger_sync(current_user: models.User = Depends(auth.require_roles("Officer", "Admin"))):
    raise HTTPException(status_code=503, detail="Official verification service unavailable")
