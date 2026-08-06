import base64
import json
import logging
import os
from pathlib import Path
from typing import Optional

import requests
from dotenv import load_dotenv
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


SCAN_PROMPT = """
You are reading a medicine package label. Return only JSON matching the schema.
Extract exactly what is visible; never infer, autocomplete, or guess.
- medicine_name: brand or generic name, or null when unclear
- expiry_date: DD/MM/YYYY, MM/YYYY, or YYYY, or null when absent/unclear
- dosage: visible amount such as '1 tablet' or '5 ml syrup', or null
- frequency_hint: visible directions about when/how often to take it, or null
If any field is uncertain, return null for that field. Patient safety is more
important than completeness. Do not provide medical advice.
""".strip()


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
        response = requests.post(url, params={"key": api_key}, json=body, timeout=35)
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


@api_router.get("/")
async def root():
    return {"service": "MedicPal", "status": "ready"}


@api_router.get("/health")
async def health():
    return {"status": "healthy", "gemini_configured": bool(os.getenv("GEMINI_API_KEY"))}


@api_router.post("/analyze-medicine", response_model=MedicineScanResult)
async def analyze_medicine(payload: MedicineScanRequest):
    return await run_in_threadpool(_analyze_with_gemini, payload)


app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[origin for origin in os.getenv("CORS_ORIGINS", "*").split(",") if origin],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)