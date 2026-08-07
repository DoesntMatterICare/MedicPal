import Constants from "expo-constants";
import type { SymptomInsight } from "@/src/types";

type InsightInput = { symptom: string; severity: number; duration: string; notes: string };

function backendUrl() {
  return process.env.EXPO_PUBLIC_BACKEND_URL
    || Constants.expoConfig?.extra?.EXPO_BACKEND_URL
    || Constants.expoConfig?.extra?.backendUrl;
}

export async function requestSymptomInsight(input: InsightInput): Promise<SymptomInsight> {
  const url = backendUrl();
  if (!url) throw new Error("MedicPal AI service is not configured");
  const response = await fetch(`${url}/api/symptom-insights`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "AI insight is unavailable. You can still save this symptom.");
  }
  return response.json();
}