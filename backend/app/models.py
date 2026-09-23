import uuid
import datetime as dt
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from .database import Base


def gen_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # Admin, Verifier, District Officer, Auditor
    district = Column(String, nullable=True)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=dt.datetime.utcnow)


class Document(Base):
    __tablename__ = "documents"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    filename = Column(String, nullable=False)
    batch_name = Column(String, nullable=True)
    status = Column(String, default="Queued")  # Queued, OCR Running, Extracted, Failed
    storage_path = Column(String, nullable=True)
    uploaded_by = Column(String, ForeignKey("users.id"), nullable=True)
    uploaded_at = Column(DateTime, default=dt.datetime.utcnow)


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
    status = Column(String, default="Pending")  # Pending, Auto-Approved, Needs Review, Rejected, Exported
    confidence_score = Column(Float, default=0.0)
    document_id = Column(String, ForeignKey("documents.id"), nullable=True)
    created_at = Column(DateTime, default=dt.datetime.utcnow)


class VerificationCase(Base):
    __tablename__ = "verification_cases"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    record_id = Column(String, ForeignKey("records.id"), nullable=False)
    risk_score = Column(Integer, default=50)
    assigned_to = Column(String, ForeignKey("users.id"), nullable=True)
    status = Column(String, default="Open")  # Open, Approved, Rejected, Escalated
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=dt.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    record_id = Column(String, ForeignKey("records.id"), nullable=True)
    action = Column(String, nullable=False)
    performed_by = Column(String, nullable=True)
    prev_value = Column(String, nullable=True)
    new_value = Column(String, nullable=True)
    timestamp = Column(DateTime, default=dt.datetime.utcnow)
