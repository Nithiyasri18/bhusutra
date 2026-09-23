import os
import shutil
import random
from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/documents", tags=["documents"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("", response_model=list[schemas.DocumentOut])
def list_documents(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Document).order_by(models.Document.uploaded_at.desc()).all()


@router.post("/upload", response_model=schemas.DocumentOut)
def upload_document(
    file: UploadFile = File(...),
    batch_name: str = Form("Manual Upload"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    dest_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Simulated OCR pipeline status; real OCR integration point (e.g. pytesseract) goes here
    status_choice = random.choices(
        ["Extracted", "OCR Running", "Failed"], weights=[0.7, 0.2, 0.1], k=1
    )[0]

    doc = models.Document(
        filename=file.filename,
        batch_name=batch_name,
        status=status_choice,
        storage_path=dest_path,
        uploaded_by=current_user.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    db.add(models.AuditLog(
        record_id=None,
        action=f"Document uploaded: {file.filename}",
        performed_by=current_user.name,
        prev_value=None,
        new_value=status_choice,
    ))
    db.commit()

    return doc
