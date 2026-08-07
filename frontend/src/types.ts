export interface ScheduleItem {
  time: string;
  taken: boolean;
  enabled: boolean;
}

export interface Medicine {
  id: string;
  name: string;
  photoUri: string;
  expiryDate: string | null;
  dosage: string;
  frequency: string;
  schedule: ScheduleItem[];
  googleEventIds: string[];
  notificationIds: string[];
  createdAt: string;
}

export interface UserProfile {
  googleId: string;
  name: string;
  email: string;
  photoUrl: string;
  accessToken: string;
  language: string;
  fontSize: number;
  highContrast: boolean;
  ttsEnabled: boolean;
  caregiverPhone: string;
}

export interface ScanResult {
  medicine_name: string | null;
  expiry_date: string | null;
  dosage: string | null;
  frequency_hint: string | null;
}

export interface PendingScan {
  photoUri: string;
  result: ScanResult;
}

export interface SymptomInsight {
  summary: string;
  questions: string[];
  safety_notice: string;
  urgent_warning: string | null;
}

export interface SymptomLog {
  id: string;
  symptom: string;
  severity: number;
  duration: string;
  notes: string;
  occurredAt: string;
  createdAt: string;
  insight: SymptomInsight | null;
}

export type DocumentCategory = "Prescription" | "Lab result" | "Scan report" | "Other";

export interface VaultDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  imageBase64: string;
  mimeType: "image/jpeg";
  documentDate: string;
  createdAt: string;
}

export interface HealthAppointment {
  id: string;
  title: string;
  clinician: string;
  appointmentAt: string;
  notes: string;
  createdAt: string;
}

export type TimelineEvent = {
  id: string;
  type: "symptom" | "medicine" | "document" | "appointment";
  title: string;
  description: string;
  date: string;
};