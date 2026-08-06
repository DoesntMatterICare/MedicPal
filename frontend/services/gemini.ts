import Constants from "expo-constants";
import type { ScanResult } from "@/src/types";

export async function analyzeMedicine(imageBase64: string): Promise<ScanResult> {
  const backendUrl = Constants.expoConfig?.extra?.backendUrl;
  if (!backendUrl) throw new Error("MedicPal service is not configured");
  const response = await fetch(`${backendUrl}/api/analyze-medicine`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_base64: imageBase64, mime_type: "image/jpeg" }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Could not read this label. Please try again.");
  }
  return response.json();
}