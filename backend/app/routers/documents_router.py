import logging
import os
import uuid
from pathlib import Path

import pypdfium2
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from .. import auth, models, schemas
from ..database import get_db
from ..services.document_processing import create_verification_score, extract_land_fields

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["documents"])
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads")).resolve()
MAX_FILE_SIZE = 15 * 1024 * 1024
ALLOWED_EXTENSIONS = {
    ".pdf": ("application/pdf", b"%PDF-"),
    ".jpg": ("image/jpeg", b"\xff\xd8\xff"),
    ".jpeg": ("image/jpeg", b"\xff\xd8\xff"),
    ".png": ("image/png", b"\x89PNG\r\n\x1a\n"),
}
STAFF_ROLES = ("Officer", "Admin", "Auditor")


def _can_view_document(document: models.Document, user: models.User):
    return user.role in STAFF_ROLES or document.uploaded_by == user.id


def _document_detail(document: models.Document):
    result = document.ocr_result
    score = document.verification_score
    return {
        "id": document.id,
        "filename": document.filename,
        "content_type": document.content_type,
        "size_bytes": document.size_bytes,
        "status": document.status,
        "uploaded_at": document.uploaded_at,
        "uploaded_by": document.uploaded_by,
        "ocr_fields": result.extracted_fields if result else None,
        "field_confidence": result.field_confidence if result else None,
        "ocr_confidence": result.average_confidence if result else None,
        "score": score.score if score else None,
        "score_components": score.components if score else None,
        "reasons": score.reasons if score else [],
        "official_status": score.official_status if score else "Official verification service unavailable",
    }


@router.get("", response_model=list[schemas.DocumentOut])
def list_documents(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    query = db.query(models.Document)
    if current_user.role == "Citizen":
        query = query.filter(models.Document.uploaded_by == current_user.id)
    elif current_user.role not in STAFF_ROLES:
        raise HTTPException(status_code=403, detail="You do not have permission to view documents")
    return query.order_by(models.Document.uploaded_at.desc()).limit(500).all()


@router.post("/upload", response_model=schemas.DocumentDetail, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles("Citizen")),
):
    original_name = Path(file.filename or "").name
    suffix = Path(original_name).suffix.lower()
    file_type = ALLOWED_EXTENSIONS.get(suffix)
    if not file_type:
        raise HTTPException(status_code=415, detail="Only PDF, JPG, and PNG documents are supported")

    chunks = []
    total_size = 0
    while chunk := await file.read(1024 * 1024):
        total_size += len(chunk)
        if total_size > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="Documents must be 15 MB or smaller")
        chunks.append(chunk)
    content = b"".join(chunks)
    expected_type, signature = file_type
    if not content.startswith(signature):
        raise HTTPException(status_code=415, detail="The file contents do not match the selected document type")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    document_id = str(uuid.uuid4())
    target = UPLOAD_DIR / f"{document_id}{suffix}"
    try:
        target.write_bytes(content)
    except OSError as exc:
        logger.exception("Unable to store uploaded document")
        raise HTTPException(status_code=503, detail="Document storage is unavailable. Please try again later.") from exc

    document = models.Document(
        id=document_id,
        filename=original_name[:255],
        content_type=expected_type,
        size_bytes=total_size,
        status="OCR Processing",
        storage_path=str(target),
        uploaded_by=current_user.id,
    )
    db.add(document)
    auth.write_audit(db, current_user, "Document uploaded", current=original_name[:255], document_id=document_id)

    try:
        extracted, field_confidence, average_confidence = extract_land_fields(content, expected_type)
        score, components, reasons = create_verification_score(extracted, average_confidence)
    except (ValueError, RuntimeError, OSError, pypdfium2.PdfiumError) as exc:
        document.status = "OCR Failed"
        auth.write_audit(db, current_user, "Document OCR failed", current=type(exc).__name__, document_id=document_id)
        db.commit()
        if isinstance(exc, ValueError):
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        logger.exception("OCR processing is unavailable")
        raise HTTPException(status_code=503, detail="Document was stored, but OCR is currently unavailable. Please try again later.") from exc

    result = models.OcrResult(
        document_id=document.id,
        extracted_fields=extracted,
        field_confidence=field_confidence,
        average_confidence=average_confidence,
    )
    score_result = models.VerificationScore(
        document_id=document.id,
        score=score,
        components=components,
        reasons=reasons,
        official_status="Official verification service unavailable",
    )
    document.status = "Auto Verified" if score >= 90 else "Officer Review" if score >= 60 else "High Risk"
    db.add_all([result, score_result])
    if score >= 90:
        auth.write_audit(db, current_user, "Document auto-verified", current=str(score), document_id=document_id)
    else:
        db.add(models.VerificationCase(
            document_id=document.id,
            risk_score=100 - score,
            status="Open",
            notes="; ".join(reasons),
        ))
        auth.write_audit(db, current_user, "Document sent for officer review", current=str(score), document_id=document_id)
    db.commit()
    db.refresh(document)
    return _document_detail(document)


@router.get("/{document_id}", response_model=schemas.DocumentDetail)
def get_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    if not _can_view_document(document, current_user):
        raise HTTPException(status_code=404, detail="Document not found")
    return _document_detail(document)


@router.get("/{document_id}/file")
def get_document_file(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not document or not _can_view_document(document, current_user):
        raise HTTPException(status_code=404, detail="Document not found")
    path = Path(document.storage_path).resolve()
    if UPLOAD_DIR != path.parent and UPLOAD_DIR not in path.parents:
        logger.error("Stored document path is outside the configured upload directory")
        raise HTTPException(status_code=500, detail="Document storage path is invalid")
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Stored document file is unavailable")
    return FileResponse(path, media_type=document.content_type, filename=document.filename)
