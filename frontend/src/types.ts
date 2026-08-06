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