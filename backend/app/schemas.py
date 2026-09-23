import datetime as dt
from typing import Optional
from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    district: Optional[str] = None
    last_login: Optional[dt.datetime] = None

    class Config:
        from_attributes = True


class DocumentOut(BaseModel):
    id: str
    filename: str
    batch_name: Optional[str] = None
    status: str
    uploaded_at: dt.datetime

    class Config:
        from_attributes = True


class RecordOut(BaseModel):
    id: str
    survey_no: Optional[str]
    khasra_no: Optional[str]
    khata_no: Optional[str]
    owner_name: Optional[str]
    district: Optional[str]
    village: Optional[str]
    area_acres: Optional[float]
    status: str
    confidence_score: float

    class Config:
        from_attributes = True


class VerificationCaseOut(BaseModel):
    id: str
    record_id: str
    risk_score: int
    assigned_to: Optional[str]
    status: str
    notes: Optional[str]
    created_at: dt.datetime

    class Config:
        from_attributes = True


class CaseActionRequest(BaseModel):
    action: str  # Approve, Reject, Escalate
    notes: Optional[str] = None


class AuditLogOut(BaseModel):
    id: str
    record_id: Optional[str]
    action: str
    performed_by: Optional[str]
    prev_value: Optional[str]
    new_value: Optional[str]
    timestamp: dt.datetime

    class Config:
        from_attributes = True
