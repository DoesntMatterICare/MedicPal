import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { Medicine, PendingScan } from "@/src/types";

const WEB_MEDICINES = "medicpal:web:medicines";
const PENDING_SCAN = "medicpal:pending-scan";
const dbPromise = Platform.OS === "web" ? null : import("expo-sqlite").then(({ openDatabaseAsync }) => openDatabaseAsync("medicpal.db"));

async function db() {
  if (!dbPromise) throw new Error("SQLite is unavailable on web");
  const database = await dbPromise;
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS medicines (id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS calendar_queue (id INTEGER PRIMARY KEY AUTOINCREMENT, operation TEXT NOT NULL, payload TEXT NOT NULL);
  `);
  return database;
}

export async function listMedicines(): Promise<Medicine[]> {
  if (Platform.OS === "web") return JSON.parse((await AsyncStorage.getItem(WEB_MEDICINES)) || "[]");
  const rows = await (await db()).getAllAsync<{ data: string }>("SELECT data FROM medicines ORDER BY id DESC");
  return rows.map((row) => JSON.parse(row.data));
}

export async function getMedicine(id: string): Promise<Medicine | null> {
  return (await listMedicines()).find((medicine) => medicine.id === id) || null;
}

export async function saveMedicine(medicine: Medicine) {
  if (Platform.OS === "web") {
    const current = await listMedicines();
    const next = [medicine, ...current.filter((item) => item.id !== medicine.id)];
    return AsyncStorage.setItem(WEB_MEDICINES, JSON.stringify(next));
  }
  await (await db()).runAsync("INSERT OR REPLACE INTO medicines (id, data) VALUES (?, ?)", medicine.id, JSON.stringify(medicine));
}

export async function deleteMedicine(id: string) {
  if (Platform.OS === "web") {
    return AsyncStorage.setItem(WEB_MEDICINES, JSON.stringify((await listMedicines()).filter((item) => item.id !== id)));
  }
  await (await db()).runAsync("DELETE FROM medicines WHERE id = ?", id);
}

export async function clearMedicines() {
  if (Platform.OS === "web") return AsyncStorage.removeItem(WEB_MEDICINES);
  await (await db()).runAsync("DELETE FROM medicines");
}

export async function queueCalendarOperation(operation: "create" | "delete", payload: object) {
  if (Platform.OS === "web") {
    const key = "medicpal:web:calendar-queue";
    const queue = JSON.parse((await AsyncStorage.getItem(key)) || "[]");
    return AsyncStorage.setItem(key, JSON.stringify([...queue, { id: Date.now(), operation, payload }]));
  }
  await (await db()).runAsync("INSERT INTO calendar_queue (operation, payload) VALUES (?, ?)", operation, JSON.stringify(payload));
}

export async function getCalendarQueue(): Promise<{ id: number; operation: string; payload: string }[]> {
  if (Platform.OS === "web") {
    const queue = JSON.parse((await AsyncStorage.getItem("medicpal:web:calendar-queue")) || "[]");
    return queue.map((item: { id: number; operation: string; payload: object }) => ({ ...item, payload: JSON.stringify(item.payload) }));
  }
  return (await db()).getAllAsync("SELECT id, operation, payload FROM calendar_queue ORDER BY id");
}

export async function removeCalendarQueueItem(id: number) {
  if (Platform.OS === "web") {
    const key = "medicpal:web:calendar-queue";
    const queue = JSON.parse((await AsyncStorage.getItem(key)) || "[]");
    return AsyncStorage.setItem(key, JSON.stringify(queue.filter((item: { id: number }) => item.id !== id)));
  }
  await (await db()).runAsync("DELETE FROM calendar_queue WHERE id = ?", id);
}

export const savePendingScan = (scan: PendingScan) => AsyncStorage.setItem(PENDING_SCAN, JSON.stringify(scan));
export async function getPendingScan(): Promise<PendingScan | null> {
  const data = await AsyncStorage.getItem(PENDING_SCAN);
  return data ? JSON.parse(data) : null;
}
export const clearPendingScan = () => AsyncStorage.removeItem(PENDING_SCAN);