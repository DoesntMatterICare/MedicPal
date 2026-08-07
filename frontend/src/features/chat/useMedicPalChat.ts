import { useCallback, useRef, useState } from "react";
import { listMedicines } from "@/services/db";
import { FAQ_ANSWERS, matchChatIntent, parseReminderTime, type ChatIntent } from "@/services/chatbot";
import { changeMedicineTime, dismissMedicineAlert, pauseMedicine, reminderStatus, resumeMedicine, stopMedicineReminders } from "@/services/reminderActions";
import { useApp } from "@/src/context/AppContext";
import type { Medicine } from "@/src/types";
import { displayTime } from "@/utils/scheduleParser";
import type { ChatMessage } from "@/components/chat/MessageBubble";
import type { QuickReply } from "@/components/chat/QuickReplies";

type Action = "pause" | "resume" | "stop" | "change_time" | "dismiss";
type Phase = "idle" | "faq" | "settings" | "select_medicine" | "select_schedule" | "await_time";
export type ChatConfirmation = { title: string; text: string; label: string; danger: boolean };

const mainReplies: QuickReply[] = [
  { id: "pause", label: "Pause reminders" }, { id: "resume", label: "Resume reminders" },
  { id: "change_time", label: "Change time" }, { id: "dismiss", label: "Dismiss alert" },
  { id: "stop", label: "Stop future reminders" }, { id: "faq-menu", label: "App FAQs" },
  { id: "settings-menu", label: "App settings" },
];
const faqReplies: QuickReply[] = [
  { id: "faq_scan", label: "How do I scan?" }, { id: "faq_vault", label: "Document vault" },
  { id: "faq_symptoms", label: "Symptom logging" }, { id: "faq_timeline", label: "Health timeline" },
  { id: "faq_ai", label: "What uses AI?" }, { id: "faq_privacy", label: "Privacy" }, { id: "cancel", label: "Back" },
];
const settingReplies: QuickReply[] = [
  { id: "tts_on", label: "Spoken help on" }, { id: "tts_off", label: "Spoken help off" },
  { id: "text_larger", label: "Make text larger" }, { id: "text_smaller", label: "Make text smaller" },
  { id: "contrast_on", label: "High contrast on" }, { id: "contrast_off", label: "High contrast off" }, { id: "cancel", label: "Back" },
];

export function useMedicPalChat() {
  const { profile, fontSize, updateProfile } = useApp();
  const counter = useRef(1);
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: "welcome", role: "assistant", text: "I can manage MedicPal reminders and answer app questions. I use fixed on-device rules, and this chat is not saved." }]);
  const [phase, setPhase] = useState<Phase>("idle"); const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [action, setAction] = useState<Action | null>(null); const [selected, setSelected] = useState<Medicine | null>(null);
  const [scheduleIndex, setScheduleIndex] = useState(0); const [nextTime, setNextTime] = useState("");
  const [confirmation, setConfirmation] = useState<ChatConfirmation | null>(null); const [working, setWorking] = useState(false);
  const add = useCallback((role: ChatMessage["role"], text: string) => setMessages((items) => [...items, { id: `${Date.now()}-${counter.current++}`, role, text }]), []);
  const reset = useCallback(() => { setPhase("idle"); setAction(null); setSelected(null); setNextTime(""); }, []);

  const applySetting = useCallback(async (intent: ChatIntent) => {
    if (intent === "tts_on" || intent === "tts_off") { await updateProfile({ ttsEnabled: intent === "tts_on" }); add("assistant", `Spoken help is now ${intent === "tts_on" ? "on" : "off"}.`); }
    else if (intent === "text_larger" || intent === "text_smaller") { const size = Math.min(24, Math.max(18, fontSize + (intent === "text_larger" ? 1 : -1))); await updateProfile({ fontSize: size }); add("assistant", `Text size is now ${size}.`); }
    else if (intent === "contrast_on" || intent === "contrast_off") { await updateProfile({ highContrast: intent === "contrast_on" }); add("assistant", `High contrast is now ${intent === "contrast_on" ? "on" : "off"}.`); }
    reset();
  }, [add, fontSize, reset, updateProfile]);

  const startAction = useCallback(async (nextAction: Action) => {
    const all = await listMedicines();
    const options = all.filter((medicine) => nextAction === "resume" ? reminderStatus(medicine) === "paused" : nextAction === "pause" ? reminderStatus(medicine) === "active" : nextAction === "stop" ? reminderStatus(medicine) !== "stopped" : reminderStatus(medicine) !== "stopped");
    if (!options.length) { add("assistant", nextAction === "resume" ? "No paused medicine reminders were found." : "No matching saved medicine reminders were found. Scan and save a medicine first."); reset(); return; }
    setMedicines(options); setAction(nextAction); setPhase("select_medicine");
    add("assistant", "Which medicine should I update? I will use only that local medicine record.");
  }, [add, reset]);

  const askForTime = useCallback((medicine: Medicine, index: number) => { setSelected(medicine); setScheduleIndex(index); setPhase("await_time"); add("assistant", `What new time should replace ${displayTime(medicine.schedule[index].time)}? Try “8:30 AM” or “20:30”.`); }, [add]);

  const selectMedicine = useCallback(async (id: string) => {
    const medicine = medicines.find((item) => item.id === id); if (!medicine || !action) return;
    setSelected(medicine);
    if (action === "dismiss") { const count = await dismissMedicineAlert(medicine.id); add("assistant", count ? `Dismissed the visible ${medicine.name} alert. Future reminders stay on.` : `No visible ${medicine.name} alert was found. Future reminders stay on.`); reset(); return; }
    if (action === "change_time") { if (medicine.schedule.length > 1) { setPhase("select_schedule"); add("assistant", "Which reminder time should change?"); } else askForTime(medicine, 0); return; }
    const calendarTarget = profile?.accessToken ? " and connected Calendar events" : "";
    const calendarUnavailable = profile?.accessToken ? "" : " Calendar sync is unavailable in this session.";
    const copy = action === "pause" ? `Pause ${medicine.name} reminders${calendarTarget} until you resume them?${calendarUnavailable}` : action === "resume" ? `Resume ${medicine.name} reminders${calendarTarget}?${calendarUnavailable}` : `Stop all future ${medicine.name} reminders${calendarTarget}? The medicine stays in your history.${calendarUnavailable}`;
    setConfirmation({ title: action === "stop" ? "Stop future reminders?" : `${action === "pause" ? "Pause" : "Resume"} reminders?`, text: `${copy} This changes reminders only—not your prescription or medical care.`, label: action === "stop" ? "Stop future reminders" : action === "pause" ? "Pause reminders" : "Resume reminders", danger: action === "stop" });
  }, [action, add, askForTime, medicines, profile?.accessToken, reset]);

  const acceptTime = useCallback((text: string) => {
    const parsed = parseReminderTime(text); if (!parsed || !selected) { add("assistant", "I could not read that time. Try “8:30 AM”, “1 PM”, or “20:30”."); return; }
    const calendarCopy = profile?.accessToken ? " and connected Calendar events" : ". Calendar sync is unavailable in this session";
    setNextTime(parsed); setConfirmation({ title: "Change reminder time?", text: `Change ${selected.name} from ${displayTime(selected.schedule[scheduleIndex].time)} to ${displayTime(parsed)}? This updates its local alert${calendarCopy}.`, label: "Change reminder time", danger: false });
  }, [add, profile?.accessToken, scheduleIndex, selected]);

  const confirmAction = useCallback(async () => {
    if (!selected || !action) return; setWorking(true); setConfirmation(null);
    try {
      let updated = selected;
      if (action === "pause") updated = await pauseMedicine(selected, profile?.accessToken || "");
      if (action === "resume") updated = await resumeMedicine(selected, profile?.accessToken || "");
      if (action === "stop") updated = await stopMedicineReminders(selected, profile?.accessToken || "");
      if (action === "change_time") updated = await changeMedicineTime(selected, scheduleIndex, nextTime, profile?.accessToken || "");
      setMedicines((items) => items.map((item) => item.id === updated.id ? updated : item));
      const calendarNote = profile?.accessToken ? "" : " Calendar sync was unavailable in this session.";
      const response = action === "pause" ? `${selected.name} reminders are paused.${calendarNote}` : action === "resume" ? `${selected.name} reminders are active again.${calendarNote}` : action === "stop" ? `Future ${selected.name} reminders are stopped.${calendarNote} This does not mean you should stop prescribed medicine.` : `${selected.name} now reminds you at ${displayTime(nextTime)}.${calendarNote}`;
      add("assistant", response);
    } catch { add("assistant", "I could not complete that reminder change. Your saved medicine details were kept."); }
    finally { setWorking(false); reset(); }
  }, [action, add, nextTime, profile?.accessToken, reset, scheduleIndex, selected]);

  const handleIntent = useCallback(async (intent: ChatIntent) => {
    if (["pause", "resume", "stop", "change_time", "dismiss"].includes(intent)) return startAction(intent as Action);
    if (FAQ_ANSWERS[intent]) { add("assistant", FAQ_ANSWERS[intent]!); reset(); return; }
    if (["tts_on", "tts_off", "text_larger", "text_smaller", "contrast_on", "contrast_off"].includes(intent)) return applySetting(intent);
    if (intent === "help") { add("assistant", "Choose a reminder action, App FAQs, or App settings below. I cannot provide medical advice."); reset(); return; }
    add("assistant", "I did not match that to a supported app action. Try “pause reminders”, “change reminder time”, or choose an option below."); reset();
  }, [add, applySetting, reset, startAction]);

  const sendText = useCallback(async (text: string) => { const clean = text.trim(); if (!clean) return; add("user", clean); if (phase === "await_time") acceptTime(clean); else await handleIntent(matchChatIntent(clean)); }, [acceptTime, add, handleIntent, phase]);
  const selectQuickReply = useCallback(async (id: string, label: string) => {
    add("user", label);
    if (id === "cancel") { reset(); add("assistant", "Okay. What would you like to do next?"); return; }
    if (id === "faq-menu") { setPhase("faq"); add("assistant", "What would you like to know about MedicPal?"); return; }
    if (id === "settings-menu") { setPhase("settings"); add("assistant", "Which app setting should I change?"); return; }
    if (id.startsWith("medicine-")) { await selectMedicine(id.slice(9)); return; }
    if (id.startsWith("schedule-")) { if (selected) askForTime(selected, Number(id.slice(9))); return; }
    if (id.startsWith("time-")) { acceptTime(label); return; }
    await handleIntent(id as ChatIntent);
  }, [acceptTime, add, askForTime, handleIntent, reset, selectMedicine, selected]);

  let replies = mainReplies;
  if (phase === "faq") replies = faqReplies;
  if (phase === "settings") replies = settingReplies;
  if (phase === "select_medicine") replies = [...medicines.map((item) => ({ id: `medicine-${item.id}`, label: item.name })), { id: "cancel", label: "Cancel" }];
  if (phase === "select_schedule" && selected) replies = [...selected.schedule.map((item, index) => ({ id: `schedule-${index}`, label: displayTime(item.time) })), { id: "cancel", label: "Cancel" }];
  if (phase === "await_time") replies = [{ id: "time-8", label: "8:00 AM" }, { id: "time-13", label: "1:30 PM" }, { id: "time-21", label: "9:00 PM" }, { id: "cancel", label: "Cancel" }];

  return { messages, replies, sendText, selectQuickReply, confirmation, working, confirmAction, cancelConfirmation: () => { setConfirmation(null); reset(); add("assistant", "No changes were made."); } };
}