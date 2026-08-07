export type ChatIntent =
  | "pause" | "resume" | "stop" | "change_time" | "dismiss"
  | "faq_scan" | "faq_vault" | "faq_symptoms" | "faq_timeline" | "faq_ai" | "faq_privacy" | "faq_caregiver"
  | "tts_on" | "tts_off" | "text_larger" | "text_smaller" | "contrast_on" | "contrast_off" | "help" | "unknown";

const has = (text: string, pattern: RegExp) => pattern.test(text.toLowerCase().trim());

export function matchChatIntent(text: string): ChatIntent {
  if (has(text, /spoken help off|voice off|read aloud off|stop speaking/)) return "tts_off";
  if (has(text, /pause|hold|temporarily stop|mute.*reminder/)) return "pause";
  if (has(text, /stop.*future|stop.*reminder|end.*reminder|cancel future|quit.*course|don'?t want.*course|do not want.*course|finished.*course/)) return "stop";
  if (has(text, /resume|restart|continue.*reminder|turn.*reminder.*on/)) return "resume";
  if (has(text, /change|move|update|edit/) && has(text, /time|reminder|alarm/)) return "change_time";
  if (has(text, /dismiss|clear|hide|remove/) && has(text, /notification|alert|reminder/)) return "dismiss";
  if (has(text, /spoken help on|voice on|read aloud on/)) return "tts_on";
  if (has(text, /bigger|larger|increase.*text|increase.*font/)) return "text_larger";
  if (has(text, /smaller|decrease.*text|decrease.*font/)) return "text_smaller";
  if (has(text, /contrast on|enable.*contrast/)) return "contrast_on";
  if (has(text, /contrast off|disable.*contrast/)) return "contrast_off";
  if (has(text, /scan|camera|medicine label/)) return "faq_scan";
  if (has(text, /vault|document|prescription photo|lab result/)) return "faq_vault";
  if (has(text, /symptom/)) return "faq_symptoms";
  if (has(text, /timeline|history/)) return "faq_timeline";
  if (has(text, /what.*ai|ai do|insight/)) return "faq_ai";
  if (has(text, /private|privacy|data|stored/)) return "faq_privacy";
  if (has(text, /caregiver|phone number|emergency contact/)) return "faq_caregiver";
  if (has(text, /help|what can|faq|options/)) return "help";
  return "unknown";
}

export function parseReminderTime(text: string): string | null {
  const cleaned = text.toLowerCase().replace(/\./g, "").trim();
  const match = cleaned.match(/(?:^|\s)(\d{1,2})(?::(\d{2}))?\s*(am|pm)?(?:\s|$)/);
  if (!match) return null;
  let hour = Number(match[1]); const minute = Number(match[2] || "0"); const period = match[3];
  if (minute > 59 || hour > (period ? 12 : 23) || hour < 0 || (period && hour < 1)) return null;
  if (period === "pm" && hour !== 12) hour += 12;
  if (period === "am" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export const FAQ_ANSWERS: Partial<Record<ChatIntent, string>> = {
  faq_scan: "Open Scan, photograph a clear medicine label or packaging, then confirm the visible details before saving.",
  faq_vault: "Open Document vault from Home to save a prescription or report photo. Vault images stay in this app's local device storage.",
  faq_symptoms: "Open Log a symptom from Home. Add what you feel, severity, duration, and optional notes. AI visit prep is not a diagnosis.",
  faq_timeline: "Open Health timeline from Home to see medicines, symptoms, appointments, and documents together by date.",
  faq_ai: "MedicPal uses AI only for label reading and non-diagnostic visit prep. This chat itself is deterministic and does not contact AI.",
  faq_privacy: "Chat text is processed on this device and is not saved. Medicine actions use only the selected local medicine record.",
  faq_caregiver: "Open Settings, then enter the caregiver phone number. MedicPal uses it only when you tap the Call button.",
};