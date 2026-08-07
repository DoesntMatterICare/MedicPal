import { createCalendarEvents, deleteCalendarEvents } from "@/services/calendar";
import { queueCalendarOperation, saveMedicine } from "@/services/db";
import { cancelMedicineNotifications, dismissPresentedMedicineNotifications, scheduleMedicineNotifications } from "@/services/notifications";
import type { Medicine } from "@/src/types";

async function clearRemoteAndLocal(medicine: Medicine, token: string) {
  await cancelMedicineNotifications(medicine.notificationIds).catch(() => undefined);
  if (medicine.googleEventIds.length && token) await deleteCalendarEvents(medicine.googleEventIds, token).catch(() => undefined);
  if (medicine.googleEventIds.length && !token) await Promise.all(medicine.googleEventIds.map((eventId) => queueCalendarOperation("delete", { eventId })));
}

async function activate(medicine: Medicine, token: string): Promise<Medicine> {
  const activeSchedule = medicine.schedule.filter((item) => item.enabled);
  const notificationIds = await scheduleMedicineNotifications(medicine).catch(() => []);
  const googleEventIds = token && activeSchedule.length
    ? await createCalendarEvents({ ...medicine, schedule: activeSchedule }, token).catch(() => [])
    : [];
  return { ...medicine, notificationIds, googleEventIds, reminderState: "active", pausedScheduleEnabled: undefined };
}

export async function pauseMedicine(medicine: Medicine, token: string) {
  await clearRemoteAndLocal(medicine, token);
  const paused = { ...medicine, reminderState: "paused" as const, pausedScheduleEnabled: medicine.schedule.map((item) => item.enabled), schedule: medicine.schedule.map((item) => ({ ...item, enabled: false })), notificationIds: [], googleEventIds: [] };
  await saveMedicine(paused); return paused;
}

export async function resumeMedicine(medicine: Medicine, token: string) {
  const enabled = medicine.pausedScheduleEnabled || medicine.schedule.map(() => true);
  const restored = { ...medicine, schedule: medicine.schedule.map((item, index) => ({ ...item, enabled: enabled[index] ?? true })) };
  const active = await activate(restored, token); await saveMedicine(active); return active;
}

export async function stopMedicineReminders(medicine: Medicine, token: string) {
  await clearRemoteAndLocal(medicine, token);
  const stopped = { ...medicine, reminderState: "stopped" as const, pausedScheduleEnabled: undefined, schedule: medicine.schedule.map((item) => ({ ...item, enabled: false })), notificationIds: [], googleEventIds: [] };
  await saveMedicine(stopped); return stopped;
}

export async function changeMedicineTime(medicine: Medicine, index: number, time: string, token: string) {
  const updated = { ...medicine, schedule: medicine.schedule.map((item, itemIndex) => itemIndex === index ? { ...item, time } : item) };
  if (medicine.reminderState === "paused") { await saveMedicine(updated); return updated; }
  await clearRemoteAndLocal(medicine, token);
  const active = await activate(updated, token); await saveMedicine(active); return active;
}

export async function dismissMedicineAlert(medicineId: string) {
  return dismissPresentedMedicineNotifications(medicineId);
}

export function reminderStatus(medicine: Medicine) {
  if (medicine.reminderState) return medicine.reminderState;
  return medicine.schedule.some((item) => item.enabled) ? "active" : "paused";
}