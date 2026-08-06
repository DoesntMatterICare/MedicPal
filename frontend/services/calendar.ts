import NetInfo from "@react-native-community/netinfo";
import { getCalendarQueue, getMedicine, queueCalendarOperation, removeCalendarQueueItem, saveMedicine } from "@/services/db";
import type { Medicine } from "@/src/types";

const CALENDAR_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

function eventBody(medicine: Medicine, time: string) {
  const [hour, minute] = time.split(":").map(Number);
  const start = new Date();
  start.setHours(hour, minute, 0, 0);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  return {
    summary: `Medicine: ${medicine.name}`,
    description: `${medicine.dosage}. Expiry: ${medicine.expiryDate || "Not listed"}`,
    start: { dateTime: start.toISOString(), timeZone: "Asia/Kolkata" },
    end: { dateTime: end.toISOString(), timeZone: "Asia/Kolkata" },
    recurrence: ["RRULE:FREQ=DAILY"],
    reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 10 }] },
  };
}

async function createEvent(body: object, token: string) {
  const response = await fetch(CALENDAR_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Calendar sync failed (${response.status})`);
  return response.json() as Promise<{ id: string }>;
}

export async function createCalendarEvents(medicine: Medicine, token: string): Promise<string[]> {
  const online = (await NetInfo.fetch()).isConnected;
  if (!online) {
    await Promise.all(medicine.schedule.map(({ time }) => queueCalendarOperation("create", { medicineId: medicine.id, body: eventBody(medicine, time) })));
    return [];
  }
  const events = await Promise.all(medicine.schedule.map(({ time }) => createEvent(eventBody(medicine, time), token)));
  return events.map((event) => event.id);
}

export async function deleteCalendarEvents(eventIds: string[], token: string) {
  const online = (await NetInfo.fetch()).isConnected;
  for (const eventId of eventIds) {
    if (!online) {
      await queueCalendarOperation("delete", { eventId });
      continue;
    }
    const response = await fetch(`${CALENDAR_URL}/${encodeURIComponent(eventId)}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok && response.status !== 404) await queueCalendarOperation("delete", { eventId });
  }
}

export async function syncCalendarQueue(token?: string) {
  if (!token || !(await NetInfo.fetch()).isConnected) return;
  for (const item of await getCalendarQueue()) {
    const payload = JSON.parse(item.payload);
    try {
      if (item.operation === "create") {
        const event = await createEvent(payload.body, token);
        const medicine = await getMedicine(payload.medicineId);
        if (medicine) await saveMedicine({ ...medicine, googleEventIds: [...medicine.googleEventIds, event.id] });
      } else {
        await fetch(`${CALENDAR_URL}/${encodeURIComponent(payload.eventId)}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      }
      await removeCalendarQueueItem(item.id);
    } catch {
      break;
    }
  }
}