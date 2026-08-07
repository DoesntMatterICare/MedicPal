import base64
import io
import os

import pytest
import requests


# Core API health and availability checks
BASE_URL = os.environ.get("EXPO_BACKEND_URL")


@pytest.fixture(scope="session")
def api_base_url() -> str:
    if not BASE_URL:
        pytest.skip("EXPO_BACKEND_URL is not set")
    return BASE_URL.rstrip("/")


@pytest.fixture(scope="session")
def api_client() -> requests.Session:
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


def _build_test_label_image_base64() -> str:
    try:
        from PIL import Image, ImageDraw
    except Exception:
        pytest.skip("Pillow is unavailable; cannot build test label image")

    image = Image.new("RGB", (900, 500), color=(255, 255, 255))
    draw = ImageDraw.Draw(image)
    draw.text((40, 60), "PARACETAMOL", fill=(0, 0, 0))
    draw.text((40, 170), "500 mg", fill=(0, 0, 0))
    draw.text((40, 280), "EXP 12/2027", fill=(0, 0, 0))
    draw.text((40, 390), "Take 1 tablet after food", fill=(0, 0, 0))
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=90)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


# /api/health contract checks
def test_health_status_contract(api_client: requests.Session, api_base_url: str):
    response = api_client.get(f"{api_base_url}/api/health", timeout=20)
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "healthy"
    assert isinstance(data["scan_configured"], bool)
    assert isinstance(data["insights_configured"], bool)


# /api/symptom-insights safety response checks
def test_symptom_insights_returns_safe_strict_json(api_client: requests.Session, api_base_url: str):
    payload = {
        "symptom": "headache",
        "severity": 5,
        "duration": "2 days",
        "notes": "worse after long screen time",
    }
    response = api_client.post(f"{api_base_url}/api/symptom-insights", json=payload, timeout=45)
    assert response.status_code == 200

    data = response.json()
    expected_keys = {"summary", "questions", "safety_notice", "urgent_warning"}
    assert set(data.keys()) == expected_keys
    assert isinstance(data["summary"], str) and len(data["summary"].strip()) > 0
    assert isinstance(data["questions"], list) and 2 <= len(data["questions"]) <= 4
    assert all(isinstance(q, str) and q.strip() for q in data["questions"])
    assert data["safety_notice"] == "This AI note is not a diagnosis or medical advice."

    lowered = f"{data['summary']} {' '.join(data['questions'])}"
    banned_terms = [
        "you have",
        "diagnosis",
        "diagnosed",
        "take ",
        "start ",
        "stop ",
        "treatment",
        "medication",
        "dose",
    ]
    assert not any(term in lowered.lower() for term in banned_terms)


def test_symptom_insights_urgent_keywords_trigger_warning(api_client: requests.Session, api_base_url: str):
    payload = {
        "symptom": "Chest pain",
        "severity": 8,
        "duration": "30 minutes",
        "notes": "cannot breathe well",
    }
    response = api_client.post(f"{api_base_url}/api/symptom-insights", json=payload, timeout=45)
    assert response.status_code == 200

    data = response.json()
    assert isinstance(data["urgent_warning"], str)
    assert "emergency" in data["urgent_warning"].lower()


# /api/analyze-medicine universal key fallback checks
def test_analyze_medicine_returns_schema_with_retry(api_client: requests.Session, api_base_url: str):
    payload = {
        "image_base64": _build_test_label_image_base64(),
        "mime_type": "image/jpeg",
    }

    response = api_client.post(f"{api_base_url}/api/analyze-medicine", json=payload, timeout=60)
    if response.status_code == 502:
        response = api_client.post(f"{api_base_url}/api/analyze-medicine", json=payload, timeout=60)
    assert response.status_code == 200

    data = response.json()
    expected_keys = {"medicine_name", "expiry_date", "dosage", "frequency_hint"}
    assert set(data.keys()) == expected_keys
    assert all((value is None or isinstance(value, str)) for value in data.values())


def test_analyze_medicine_rejects_invalid_base64(api_client: requests.Session, api_base_url: str):
    payload = {
        "image_base64": "bad_base64",
        "mime_type": "image/jpeg",
    }
    response = api_client.post(f"{api_base_url}/api/analyze-medicine", json=payload, timeout=30)
    assert response.status_code == 422
