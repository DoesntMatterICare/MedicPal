import base64
import json
import logging
import os
import re
from uuid import uuid4
from pathlib import Path
from typing import Optional

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from dotenv import load_dotenv
from emergentintegrations.llm.chat import ImageContent, LlmChat, StreamDone, TextDelta, UserMessage
from fastapi import APIRouter, FastAPI, HTTPException
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logger = logging.getLogger("medicpal")
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="MedicPal API", version="1.0.0")
api_router = APIRouter(prefix="/api")


class MedicineScanRequest(BaseModel):
    image_base64: str = Field(min_length=100, max_length=12_000_000)
    mime_type: str = Field(default="image/jpeg", pattern=r"^image/(jpeg|png)$")


class MedicineScanResult(BaseModel):
    medicine_name: Optional[str] = None
    expiry_date: Optional[str] = None
    dosage: Optional[str] = None
    frequency_hint: Optional[str] = None


class SymptomInsightRequest(BaseModel):
    symptom: str = Field(min_length=2, max_length=120)
    severity: int = Field(ge=1, le=10)
    duration: str = Field(min_length=1, max_length=80)
    notes: str = Field(default="", max_length=600)


class SymptomInsightResult(BaseModel):
    summary: str
    questions: list[str] = Field(min_length=2, max_length=4)
    safety_notice: str
    urgent_warning: Optional[str] = None


SCAN_PROMPT = """
You are reading visible printed text from medicine packaging. The image may show
a box, bottle, blister strip, prescription, or label. Return only JSON matching
the schema.
Extract exactly what is visible; never infer, autocomplete, or guess.
- medicine_name: brand or generic name, or null when unclear
- expiry_date: DD/MM/YYYY, MM/YYYY, or YYYY, or null when absent/unclear
- dosage: visible amount such as '1 tablet' or '5 ml syrup', or null
- frequency_hint: visible directions about when/how often to take it, or null
If any field is uncertain, return null for that field. Patient safety is more
important than completeness. Never identify loose pills or tablets from shape,
color, markings, or appearance alone. If no medicine name is clearly readable
as printed text, medicine_name must be null. Do not provide medical advice.
""".strip()

SYMPTOM_SYSTEM_PROMPT = """
You help a patient prepare concise notes for a licensed clinician. You never
diagnose, name likely conditions, estimate probabilities, recommend treatment,
or tell the patient to change medication. Return only valid JSON with keys
"summary" and "questions". The summary must neutrally restate the patient's
own report in 1-2 short sentences. Questions must contain 2-4 practical,
non-leading questions the patient can ask a clinician. Do not add facts.
""".strip()

URGENT_PATTERNS = re.compile(
    r"chest pain|cannot breathe|can't breathe|severe bleeding|unconscious|"
    r"one-sided weakness|face droop|suicid|seizure|anaphylaxis",
    re.IGNORECASE,
)


def _clean_json_text(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", cleaned)
    return cleaned


async def _create_symptom_insight(payload: SymptomInsightRequest) -> SymptomInsightResult:
    api_key = os.getenv("EMERGENT_LLM_KEY", "").strip()
    if not api_key:
        raise HTTPException(status_code=503, detail="AI insights are not configured")
    urgent_warning = None
    combined = f"{payload.symptom} {payload.notes}"
    if URGENT_PATTERNS.search(combined):
        urgent_warning = (
            "This report may describe an emergency. Contact local emergency services "
            "now or seek urgent in-person help. Do not wait for an AI summary."
        )
    user_text = (
        f"Symptom: {payload.symptom}\nSeverity: {payload.severity}/10\n"
        f"Duration: {payload.duration}\nAdditional notes: {payload.notes or 'None provided'}"
    )
    chat = LlmChat(
        api_key=api_key,
        session_id=f"symptom-{uuid4()}",
        system_message=SYMPTOM_SYSTEM_PROMPT,
    ).with_model("openai", "gpt-5.4")
    chunks: list[str] = []
    try:
        async for event in chat.stream_message(UserMessage(text=user_text)):
            if isinstance(event, TextDelta):
                chunks.append(event.content)
            elif isinstance(event, StreamDone):
                break
        data = json.loads(_clean_json_text("".join(chunks)))
        return SymptomInsightResult(
            summary=data["summary"],
            questions=data["questions"],
            safety_notice="This AI note is not a diagnosis or medical advice.",
            urgent_warning=urgent_warning,
        )
    except (KeyError, TypeError, json.JSONDecodeError, ValueError) as exc:
        logger.warning("Symptom insight parsing failed: %s", type(exc).__name__)
        raise HTTPException(status_code=502, detail="AI insight could not be prepared. Please try again.") from exc
    except Exception as exc:
        logger.warning("Symptom insight request failed: %s", type(exc).__name__)
        raise HTTPException(status_code=502, detail="AI insight is temporarily unavailable. Your symptom can still be saved locally.") from exc


def _analyze_with_gemini(payload: MedicineScanRequest) -> MedicineScanResult:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(status_code=503, detail="Medicine scanning is not configured")

    try:
        base64.b64decode(payload.image_base64, validate=True)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid image data") from exc

    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    body = {
        "contents": [{
            "parts": [
                {"text": SCAN_PROMPT},
                {"inline_data": {"mime_type": payload.mime_type, "data": payload.image_base64}},
            ]
        }],
        "generationConfig": {
            "temperature": 0.1,
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "medicine_name": {"type": "STRING", "nullable": True},
                    "expiry_date": {"type": "STRING", "nullable": True},
                    "dosage": {"type": "STRING", "nullable": True},
                    "frequency_hint": {"type": "STRING", "nullable": True},
                },
                "required": ["medicine_name", "expiry_date", "dosage", "frequency_hint"],
            },
        },
    }
    try:
        retry_policy = Retry(
            total=2,
            connect=2,
            read=2,
            status=2,
            backoff_factor=0.8,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["POST"],
            raise_on_status=False,
        )
        session = requests.Session()
        session.mount("https://", HTTPAdapter(max_retries=retry_policy))
        response = session.post(url, params={"key": api_key}, json=body, timeout=35)
        if not response.ok:
            logger.warning("Gemini returned HTTP %s", response.status_code)
        response.raise_for_status()
        result = response.json()
        text = result["candidates"][0]["content"]["parts"][0]["text"]
        return MedicineScanResult(**json.loads(text))
    except (requests.RequestException, KeyError, IndexError, json.JSONDecodeError) as exc:
        logger.warning("Gemini scan failed: %s", type(exc).__name__)
        raise HTTPException(
            status_code=502,
            detail="We could not read this label. Check your connection and try again.",
        ) from exc


async def _analyze_with_universal_key(payload: MedicineScanRequest) -> MedicineScanResult:
    api_key = os.getenv("EMERGENT_LLM_KEY", "").strip()
    if not api_key:
        raise HTTPException(status_code=503, detail="Medicine scanning is not configured")
    try:
        base64.b64decode(payload.image_base64, validate=True)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid image data") from exc
    chat = LlmChat(
        api_key=api_key,
        session_id=f"medicine-scan-{uuid4()}",
        system_message="Return only valid JSON. Follow the user's extraction and safety rules exactly.",
    ).with_model("openai", "gpt-5.4")
    chunks: list[str] = []
    try:
        message = UserMessage(text=SCAN_PROMPT, file_contents=[ImageContent(payload.image_base64)])
        async for event in chat.stream_message(message):
            if isinstance(event, TextDelta):
                chunks.append(event.content)
            elif isinstance(event, StreamDone):
                break
        return MedicineScanResult(**json.loads(_clean_json_text("".join(chunks))))
    except Exception as exc:
        logger.warning("Universal medicine scan failed: %s", type(exc).__name__)
        raise HTTPException(status_code=502, detail="We could not read this label. Check your connection and try again.") from exc


@api_router.get("/")
async def root():
    return {"service": "MedicPal", "status": "ready"}


@api_router.get("/health")
async def health():
    return {"status": "healthy", "scan_configured": bool(os.getenv("GEMINI_API_KEY") or os.getenv("EMERGENT_LLM_KEY")), "insights_configured": bool(os.getenv("EMERGENT_LLM_KEY"))}


@api_router.post("/analyze-medicine", response_model=MedicineScanResult)
async def analyze_medicine(payload: MedicineScanRequest):
    if os.getenv("GEMINI_API_KEY"):
        return await run_in_threadpool(_analyze_with_gemini, payload)
    return await _analyze_with_universal_key(payload)


@api_router.post("/symptom-insights", response_model=SymptomInsightResult)
async def symptom_insights(payload: SymptomInsightRequest):
    return await _create_symptom_insight(payload)


app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[origin for origin in os.getenv("CORS_ORIGINS", "*").split(",") if origin],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)