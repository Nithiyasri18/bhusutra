import datetime as dt
import uuid

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .database import Base


def gen_uuid():
    return str(uuid.uuid4())


class Role(Base):
    __tablename__ = "roles"
    name = Column(String(32), primary_key=True)
    description = Column(String(120), nullable=False)


class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    name = Column(String(160), nullable=False)
    email = Column(String(320), unique=True, nullable=False, index=True)
    mobile_number = Column(String(32), nullable=True)
    password_hash = Column(String, nullable=False)
    role = Column(String(32), ForeignKey("roles.name"), nullable=False)
    district = Column(String(120), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    password_reset_token_hash = Column(String(64), nullable=True)
    password_reset_expires_at = Column(DateTime(timezone=True), nullable=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: dt.datetime.now(dt.timezone.utc))
    role_info = relationship("Role")


class Document(Base):
    __tablename__ = "documents"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    filename = Column(String(255), nullable=False)
    batch_name = Column(String(120), nullable=True)
    content_type = Column(String(100), nullable=False, default="application/octet-stream")
    size_bytes = Column(Integer, nullable=False, default=0)
    status = Column(String(32), nullable=False, default="Uploaded")
    storage_path = Column(String, nullable=False)
    uploaded_by = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True, index=True)
    uploaded_at = Column(DateTime(timezone=True), default=lambda: dt.datetime.now(dt.timezone.utc))
    uploader = relationship("User")
    ocr_result = relationship("OcrResult", back_populates="document", uselist=False, cascade="all, delete-orphan")
    verification_score = relationship("VerificationScore", back_populates="document", uselist=False, cascade="all, delete-orphan")
    verification_cases = relationship("VerificationCase", back_populates="document", cascade="all, delete-orphan")


class Record(Base):
    __tablename__ = "records"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    survey_no = Column(String, nullable=True)
    khasra_no = Column(String, nullable=True)
    khata_no = Column(String, nullable=True)
    owner_name = Column(String, nullable=True)
    district = Column(String, nullable=True)
    village = Column(String, nullable=True)
    area_acres = Column(Float, nullable=True)
    status = Column(String, default="Pending")
    confidence_score = Column(Float, default=0.0)
    document_id = Column(UUID(as_uuid=False), ForeignKey("documents.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: dt.datetime.now(dt.timezone.utc))


class VerificationCase(Base):
    __tablename__ = "verification_cases"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    record_id = Column(UUID(as_uuid=False), ForeignKey("records.id"), nullable=True)
    document_id = Column(UUID(as_uuid=False), ForeignKey("documents.id"), nullable=True, index=True)
    risk_score = Column(Integer, default=50)
    assigned_to = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True)
    status = Column(String(32), default="Open")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: dt.datetime.now(dt.timezone.utc))
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    document = relationship("Document", back_populates="verification_cases")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    record_id = Column(UUID(as_uuid=False), ForeignKey("records.id"), nullable=True)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True, index=True)
    document_id = Column(UUID(as_uuid=False), ForeignKey("documents.id"), nullable=True, index=True)
    case_id = Column(UUID(as_uuid=False), ForeignKey("verification_cases.id"), nullable=True, index=True)
    action = Column(String, nullable=False)
    performed_by = Column(String, nullable=True)
    prev_value = Column(String, nullable=True)
    new_value = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: dt.datetime.now(dt.timezone.utc))


class OcrResult(Base):
    __tablename__ = "ocr_results"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    document_id = Column(UUID(as_uuid=False), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, unique=True)
    extracted_fields = Column(JSON, nullable=False, default=dict)
    field_confidence = Column(JSON, nullable=False, default=dict)
    average_confidence = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime(timezone=True), default=lambda: dt.datetime.now(dt.timezone.utc))
    document = relationship("Document", back_populates="ocr_result")


class VerificationScore(Base):
    __tablename__ = "verification_scores"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    document_id = Column(UUID(as_uuid=False), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, unique=True)
    score = Column(Integer, nullable=False)
    components = Column(JSON, nullable=False, default=dict)
    reasons = Column(JSON, nullable=False, default=list)
    official_status = Column(String(64), nullable=False, default="Official verification service unavailable")
    created_at = Column(DateTime(timezone=True), default=lambda: dt.datetime.now(dt.timezone.utc))
    document = relationship("Document", back_populates="verification_score")
