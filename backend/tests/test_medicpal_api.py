import base64
import io
import os
import time

import pytest
import requests


# Backend API smoke and Gemini extraction coverage
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
        pytest.skip("Pillow is unavailable; cannot build label image for Gemini extraction")

    image = Image.new("RGB", (900, 500), color=(255, 255, 255))
    draw = ImageDraw.Draw(image)
    draw.text((40, 60), "PARACETAMOL", fill=(0, 0, 0))
    draw.text((40, 170), "500 mg", fill=(0, 0, 0))
    draw.text((40, 280), "EXP 12/2027", fill=(0, 0, 0))
    draw.text((40, 390), "Take 1 tablet after food", fill=(0, 0, 0))
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=90)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def _post_analyze_with_single_retry(api_client: requests.Session, api_base_url: str, payload: dict) -> requests.Response:
    """Retry once for transient upstream Gemini failures."""
    response = api_client.post(f"{api_base_url}/api/analyze-medicine", json=payload, timeout=45)
    if response.status_code == 502:
        time.sleep(1.2)
        response = api_client.post(f"{api_base_url}/api/analyze-medicine", json=payload, timeout=45)
    return response


def test_health_healthy_and_gemini_configured(api_client: requests.Session, api_base_url: str):
    response = api_client.get(f"{api_base_url}/api/health", timeout=20)
    assert response.status_code == 200
    data = response.json()
    assert data == {"status": "healthy", "gemini_configured": True}


def test_analyze_medicine_returns_nullable_schema_and_no_key_leak(api_client: requests.Session, api_base_url: str):
    payload = {
        "image_base64": _build_test_label_image_base64(),
        "mime_type": "image/jpeg",
    }
    response = _post_analyze_with_single_retry(api_client, api_base_url, payload)
    assert response.status_code == 200

    data = response.json()
    expected_keys = {"medicine_name", "expiry_date", "dosage", "frequency_hint", "evidence"}
    assert set(data.keys()) == expected_keys
    for key in expected_keys - {"evidence"}:
        assert data[key] is None or isinstance(data[key], str)
    assert isinstance(data["evidence"], list)

    response_dump = f"{response.text}\n{response.headers}"
    assert "GEMINI_API_KEY" not in response_dump
    assert "AIza" not in response_dump


def test_analyze_medicine_evidence_items_include_field_snippet_confidence_and_normalized_box(api_client: requests.Session, api_base_url: str):
    """Explainable AI evidence response shape and value constraints."""
    payload = {
        "image_base64": _build_test_label_image_base64(),
        "mime_type": "image/jpeg",
    }
    response = _post_analyze_with_single_retry(api_client, api_base_url, payload)
    assert response.status_code == 200

    data = response.json()
    assert isinstance(data.get("evidence"), list)

    for item in data["evidence"]:
        assert item["field"] in {"medicine_name", "expiry_date", "dosage", "frequency_hint"}
        assert isinstance(item["text"], str) and item["text"].strip() != ""
        assert isinstance(item["confidence"], (float, int))
        assert 0 <= float(item["confidence"]) <= 1

        box = item.get("box")
        if box is not None:
            for key in ("x", "y", "width", "height"):
                assert isinstance(box[key], int)
                assert 0 <= box[key] <= 1000
