import datetime as dt
import re
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class RegistrationRequest(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    email: EmailStr
    mobile_number: str = Field(min_length=7, max_length=32)
    password: str = Field(min_length=12, max_length=128)

    @field_validator("name", "mobile_number")
    @classmethod
    def strip_required_text(cls, value: str):
        value = value.strip()
        if not value:
            raise ValueError("This field is required")
        return value

    @field_validator("mobile_number")
    @classmethod
    def validate_mobile_number(cls, value: str):
        if not re.fullmatch(r"[+()\d][\d\s().-]{5,30}", value):
            raise ValueError("Enter a valid mobile number")
        return value


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str
    id: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    email: str
    mobile_number: str | None = None
    role: str
    district: str | None = None
    last_login: dt.datetime | None = None
    created_at: dt.datetime


class StaffCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    email: EmailStr
    mobile_number: str = Field(min_length=7, max_length=32)
    role: Literal["Officer", "Admin", "Auditor"]

    @field_validator("name", "mobile_number")
    @classmethod
    def strip_required_text(cls, value: str):
        value = value.strip()
        if not value:
            raise ValueError("This field is required")
        return value

    @field_validator("mobile_number")
    @classmethod
    def validate_mobile_number(cls, value: str):
        if not re.fullmatch(r"[+()\d][\d\s().-]{5,30}", value):
            raise ValueError("Enter a valid mobile number")
        return value


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=32, max_length=256)
    password: str = Field(min_length=12, max_length=128)


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    filename: str
    content_type: str
    size_bytes: int
    status: str
    uploaded_at: dt.datetime
    uploaded_by: str | None


class RecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    survey_no: str | None
    khasra_no: str | None
    khata_no: str | None
    owner_name: str | None
    district: str | None
    village: str | None
    area_acres: float | None
    status: str
    confidence_score: float


class DocumentDetail(DocumentOut):
    ocr_fields: dict[str, Any] | None = None
    field_confidence: dict[str, float] | None = None
    ocr_confidence: float | None = None
    score: int | None = None
    score_components: dict[str, Any] | None = None
    reasons: list[str] = Field(default_factory=list)
    official_status: str = "Official verification service unavailable"


class VerificationCaseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    document_id: str | None
    record_id: str | None
    risk_score: int
    assigned_to: str | None
    status: str
    notes: str | None
    created_at: dt.datetime
    resolved_at: dt.datetime | None = None
    document: DocumentOut | None = None
    score: int | None = None
    reasons: list[str] = Field(default_factory=list)


class CaseActionRequest(BaseModel):
    action: Literal["Approve", "Reject"]
    notes: str = Field(min_length=1, max_length=4000)


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    record_id: str | None
    user_id: str | None
    document_id: str | None
    case_id: str | None
    action: str
    performed_by: str | None
    prev_value: str | None
    new_value: str | None
    timestamp: dt.datetime
