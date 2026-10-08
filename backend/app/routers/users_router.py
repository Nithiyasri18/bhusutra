import secrets
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .. import auth, models, schemas
from ..database import get_db

router = APIRouter(prefix="/users", tags=["users"])
logger = logging.getLogger(__name__)


@router.get("", response_model=list[schemas.UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles("Admin")),
):
    return db.query(models.User).order_by(models.User.created_at.desc()).limit(1000).all()


@router.post("", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def create_staff_user(
    payload: schemas.StaffCreateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles("Admin")),
):
    email = str(payload.email).lower()
    if db.query(models.User.id).filter(models.User.email == email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    if not db.query(models.Role.name).filter(models.Role.name == payload.role).first():
        raise HTTPException(status_code=503, detail="The selected role is not available")

    user = models.User(
        name=payload.name,
        email=email,
        mobile_number=payload.mobile_number,
        password_hash=auth.hash_password(secrets.token_urlsafe(48)),
        role=payload.role,
    )
    db.add(user)
    try:
        db.flush()
        auth.write_audit(db, current_user, "Staff account created", current=payload.role)
        db.commit()
        db.refresh(user)
    except IntegrityError as exc:
        db.rollback()
        if db.query(models.User.id).filter(models.User.email == email).first():
            raise HTTPException(status_code=409, detail="An account with this email already exists") from exc
        logger.error("Database constraint rejected staff creation (%s)", type(exc.orig).__name__)
        raise HTTPException(status_code=500, detail="Staff account could not be created.") from exc
    return user
