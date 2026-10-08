import json
import logging
import os
from typing import Literal
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator, model_validator
from sqlalchemy.orm import Session

from .. import auth, models
from ..database import get_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["copilot"])

SYSTEM_INSTRUCTION = (
    "You are BhuSutra's land-record information assistant. Answer questions about "
    "survey, khata and khasra numbers, mutation, common supporting documents, "
    "document review scores, what supporting material an applicant may want to "
    "prepare, and general verification steps clearly and concisely. Explain that "
    "document requirements vary by state and transaction and should be confirmed "
    "with the relevant land-records office. If a citizen provides score reason "
    "codes, explain those codes without claiming to inspect their database record. "
    "You do not have access to the user's personal land records or government "
    "databases. Never claim to verify ownership, legal title, or the validity of "
    "a specific record. Never approve or reject documents or direct the system to "
    "change a review decision. Do not invent facts, procedures, or citations. "
    "When a question needs a parcel-specific or legal determination, explain the "
    "limitation and direct the user to the relevant land-records office or a "
    "qualified professional. This is informational guidance, not legal advice."
)


class CopilotTurn(BaseModel):
    role: Literal["user", "model"]
    content: str = Field(min_length=1, max_length=4000)

    @field_validator("content", mode="before")
    @classmethod
    def strip_content(cls, value):
        if isinstance(value, str):
            value = value.strip()
            if not value:
                raise ValueError("Conversation messages cannot be empty")
        return value


class CopilotRequest(BaseModel):
    turns: list[CopilotTurn] = Field(min_length=1, max_length=12)

    @model_validator(mode="after")
    def validate_turn_order(self):
        if self.turns[0].role != "user" or self.turns[-1].role != "user":
            raise ValueError("Conversation must begin and end with a user message")
        if any(left.role == right.role for left, right in zip(self.turns, self.turns[1:])):
            raise ValueError("Conversation turns must alternate between user and model")
        return self


class CopilotResponse(BaseModel):
    answer: str


@router.post("/copilot", response_model=CopilotResponse)
def ask_copilot(
    request: CopilotRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles("Citizen")),
):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="Gemini Copilot is not configured. Contact your administrator.",
        )

    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{quote(model_name, safe='')}:generateContent"
    )
    payload = {
        "systemInstruction": {"parts": [{"text": SYSTEM_INSTRUCTION}]},
        "contents": [
            {"role": turn.role, "parts": [{"text": turn.content}]}
            for turn in request.turns
        ],
        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 700},
    }
    gemini_request = Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
        method="POST",
    )

    try:
        with urlopen(gemini_request, timeout=30) as response:
            result = json.loads(response.read())
    except HTTPError as exc:
        response_body = exc.read().decode("utf-8", errors="replace")
        if exc.code in (401, 403) and ("API_KEY_INVALID" in response_body or "invalid api key" in response_body.lower()):
            logger.error("Gemini rejected the configured API key")
            raise HTTPException(
                status_code=502,
                detail="Gemini API key is invalid. Contact your administrator.",
            ) from exc
        if exc.code == 429:
            logger.warning("Gemini rate limit or quota reached")
            raise HTTPException(
                status_code=503,
                detail="Gemini is temporarily unavailable due to request limits. Try again later.",
            ) from exc
        logger.error("Gemini API returned HTTP %s", exc.code)
        raise HTTPException(
            status_code=502,
            detail="Gemini could not answer this question. Please try again later.",
        ) from exc
    except URLError as exc:
        if isinstance(exc.reason, TimeoutError):
            logger.error("Gemini request timed out")
            raise HTTPException(
                status_code=504,
                detail="Gemini took too long to answer. Please try again.",
            ) from exc
        logger.error("Gemini request failed: %s", type(exc.reason).__name__)
        raise HTTPException(
            status_code=502,
            detail="Gemini is currently unreachable. Please try again later.",
        ) from exc
    except TimeoutError as exc:
        logger.error("Gemini request timed out")
        raise HTTPException(
            status_code=504,
            detail="Gemini took too long to answer. Please try again.",
        ) from exc
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        logger.exception("Gemini returned an invalid response")
        raise HTTPException(
            status_code=502,
            detail="Gemini returned an invalid response. Please try again later.",
        ) from exc

    try:
        answer = "\n".join(
            part["text"]
            for part in result["candidates"][0]["content"]["parts"]
            if isinstance(part.get("text"), str)
        ).strip()
    except (KeyError, IndexError, TypeError) as exc:
        logger.error("Gemini response did not contain a usable answer")
        raise HTTPException(
            status_code=502,
            detail="Gemini could not produce an answer. Please try rephrasing.",
        ) from exc

    if not answer:
        logger.error("Gemini response contained no answer text")
        raise HTTPException(
            status_code=502,
            detail="Gemini could not produce an answer. Please try rephrasing.",
        )

    auth.write_audit(db, current_user, "Citizen Copilot question")
    db.commit()
    return CopilotResponse(answer=answer)
