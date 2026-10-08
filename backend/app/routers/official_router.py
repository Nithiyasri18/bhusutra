import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .. import auth, models
from ..integrations.official_land_records import OfficialVerificationUnavailable, verify_with_official_provider

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/official-verification", tags=["official verification"])


class OfficialVerificationRequest(BaseModel):
    fields: dict[str, str] = Field(max_length=20)


@router.post("/{provider}")
def verify_land_record(
    provider: str,
    payload: OfficialVerificationRequest,
    current_user: models.User = Depends(auth.require_roles("Officer", "Admin")),
):
    try:
        return verify_with_official_provider(provider, payload.fields)
    except OfficialVerificationUnavailable as exc:
        logger.info("Official verification requested by %s: %s", current_user.id, provider)
        raise HTTPException(status_code=503, detail=str(exc)) from exc
