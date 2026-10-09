import datetime as dt
import hashlib
import logging
import os
import secrets
import smtplib
import ssl
from email.message import EmailMessage

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from .. import auth, models, schemas
from ..database import get_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


def issue_token(user: models.User):
    token = auth.create_access_token({"sub": user.id, "role": user.role})
    return schemas.Token(access_token=token, role=user.role, name=user.name, id=user.id)


def configured_mail_settings():
    required = ("SMTP_HOST", "SMTP_FROM_EMAIL", "FRONTEND_URL")
    settings = {key: os.getenv(key, "").strip() for key in required}
    if not all(settings.values()):
        raise HTTPException(status_code=503, detail="Password reset email is not configured. Contact support.")
    try:
        settings["SMTP_PORT"] = int(os.getenv("SMTP_PORT", "587"))
    except ValueError as exc:
        raise HTTPException(status_code=503, detail="Password reset email is not configured. Contact support.") from exc
    settings["SMTP_USER"] = os.getenv("SMTP_USER", "").strip()
    settings["SMTP_PASSWORD"] = os.getenv("SMTP_PASSWORD", "")
    return settings


def send_reset_email(email: str, token: str, settings: dict):
    message = EmailMessage()
    message["Subject"] = "Reset your BhuSutra password"
    message["From"] = settings["SMTP_FROM_EMAIL"]
    message["To"] = email
    reset_url = f"{settings['FRONTEND_URL'].rstrip('/')}/login?reset_token={token}"
    message.set_content(
        "A password reset was requested for your BhuSutra account.\n\n"
        f"Use this one-time link within 30 minutes: {reset_url}\n\n"
        "If you did not request this, you can ignore this email."
    )
    context = ssl.create_default_context()
    try:
        with smtplib.SMTP(settings["SMTP_HOST"], settings["SMTP_PORT"], timeout=15) as smtp:
            smtp.ehlo()
            smtp.starttls(context=context)
            smtp.ehlo()
            if settings["SMTP_USER"]:
                smtp.login(settings["SMTP_USER"], settings["SMTP_PASSWORD"])
            smtp.send_message(message)
    except (OSError, smtplib.SMTPException):
        logger.exception("Failed to send password reset email")
        raise HTTPException(status_code=503, detail="Password reset email could not be sent. Please try again later.")


@router.post("/register", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
def register(payload: schemas.RegistrationRequest, db: Session = Depends(get_db)):
    email = str(payload.email).lower()
    try:
        if db.query(models.User.id).filter(models.User.email == email).first():
            raise HTTPException(status_code=409, detail="An account with this email already exists")
        if not db.query(models.Role.name).filter(models.Role.name == "Citizen").first():
            raise HTTPException(status_code=503, detail="Registration is not available until the database is initialized")

        user = models.User(
            name=payload.name,
            email=email,
            mobile_number=payload.mobile_number,
            password_hash=auth.hash_password(payload.password),
            role="Citizen",
        )
        db.add(user)
        db.flush()
        auth.write_audit(db, user, "User registered", current="Citizen")
        token = issue_token(user)
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError as exc:
        db.rollback()
        try:
            duplicate = db.query(models.User.id).filter(models.User.email == email).first()
        except SQLAlchemyError as query_exc:
            logger.exception("Unable to determine why citizen registration failed")
            raise HTTPException(
                status_code=503,
                detail="Registration is temporarily unavailable. Please try again.",
            ) from query_exc
        if duplicate:
            raise HTTPException(status_code=409, detail="An account with this email already exists") from exc
        logger.error("Database constraint rejected citizen registration (%s)", type(exc.orig).__name__)
        raise HTTPException(
            status_code=503,
            detail="Registration is temporarily unavailable. Please try again.",
        ) from exc
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Database operation failed during citizen registration")
        raise HTTPException(
            status_code=503,
            detail="Registration is temporarily unavailable. Please try again.",
        ) from exc
    return token


@router.post("/login", response_model=schemas.Token)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == str(payload.email).lower()).first()
    if not user or not user.is_active or not auth.verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    user.last_login = dt.datetime.now(dt.timezone.utc)
    auth.write_audit(db, user, "User login")
    db.commit()
    return issue_token(user)


@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
def forgot_password(payload: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    settings = configured_mail_settings()
    user = db.query(models.User).filter(models.User.email == str(payload.email).lower(), models.User.is_active.is_(True)).first()
    if user:
        token = secrets.token_urlsafe(32)
        user.password_reset_token_hash = hashlib.sha256(token.encode()).hexdigest()
        user.password_reset_expires_at = dt.datetime.now(dt.timezone.utc) + dt.timedelta(minutes=30)
        db.commit()
        try:
            send_reset_email(user.email, token, settings)
        except HTTPException:
            user.password_reset_token_hash = None
            user.password_reset_expires_at = None
            db.commit()
            raise
    return {"detail": "If an active account exists for that email, a password reset link will be sent."}


@router.post("/reset-password")
def reset_password(payload: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(payload.token.encode()).hexdigest()
    now = dt.datetime.now(dt.timezone.utc)
    user = (
        db.query(models.User)
        .filter(models.User.password_reset_token_hash == token_hash, models.User.is_active.is_(True))
        .first()
    )
    if not user or not user.password_reset_expires_at or user.password_reset_expires_at <= now:
        raise HTTPException(status_code=400, detail="This password reset link is invalid or expired")

    user.password_hash = auth.hash_password(payload.password)
    user.password_reset_token_hash = None
    user.password_reset_expires_at = None
    auth.write_audit(db, user, "Password reset")
    db.commit()
    return {"detail": "Password reset successfully. You can now sign in."}


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user
