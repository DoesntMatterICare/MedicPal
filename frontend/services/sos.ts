import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { Platform, Share } from "react-native";
import type { TravelCheckIn } from "@/src/types";

const CHECK_IN_KEY = "medicpal:travel-check-in";
const CHANNEL_ID = "travel-check-in";

export async function shareOneTimeSosLocation(messagePrefix: string) {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) throw new Error("Location permission was not granted. You can still call a saved contact.");
  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High, mayShowUserSettingsDialog: true });
  const coordinates = `${position.coords.latitude},${position.coords.longitude}`;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinates)}`;
  const message = `${messagePrefix}\nMy current location: ${mapUrl}`;
  if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.share) {
    await navigator.share({ title: "MedicPal SOS location", text: message, url: mapUrl });
  } else {
    await Share.share({ title: "MedicPal SOS location", message, url: mapUrl }, { dialogTitle: "Share SOS location" });
  }
  return mapUrl;
}

async function allowCheckInNotifications() {
  if (Platform.OS === "web") return true;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, { name: "Travel check-ins", importance: Notifications.AndroidImportance.HIGH, vibrationPattern: [0, 250, 250, 250] });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

export function parseArrival(date: string, time: string): Date | null {
  const dateMatch = date.trim().match(/^(\d{2})-(\d{2})-(\d{4})$/);
  const timeMatch = time.trim().match(/^(\d{2}):(\d{2})$/);
  if (!dateMatch || !timeMatch) return null;
  const [, day, month, year] = dateMatch; const [, hour, minute] = timeMatch;
  const arrival = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), 0, 0);
  if (arrival.getFullYear() !== Number(year) || arrival.getMonth() !== Number(month) - 1 || arrival.getDate() !== Number(day) || arrival.getHours() !== Number(hour) || arrival.getMinutes() !== Number(minute)) return null;
  return arrival;
}

export async function scheduleTravelCheckIn(destination: string, expectedAt: Date): Promise<TravelCheckIn> {
  if (expectedAt.getTime() <= Date.now()) throw new Error("Expected arrival must be in the future.");
  if (!(await allowCheckInNotifications())) throw new Error("Notification permission is needed for a travel check-in reminder.");
  await cancelTravelCheckIn();
  let notificationId = "web-travel-check-in";
  if (Platform.OS !== "web") {
    const seconds = Math.max(1, Math.round((expectedAt.getTime() - Date.now()) / 1000));
    notificationId = await Notifications.scheduleNotificationAsync({
      content: { title: "Travel arrival check-in", body: `Have you safely reached ${destination}? Open MedicPal to confirm.`, data: { kind: "travel-check-in" } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, repeats: false },
    });
  }
  const record = { destination, expectedAt: expectedAt.toISOString(), notificationId, createdAt: new Date().toISOString() };
  await AsyncStorage.setItem(CHECK_IN_KEY, JSON.stringify(record));
  return record;
}

export async function getTravelCheckIn(): Promise<TravelCheckIn | null> {
  const raw = await AsyncStorage.getItem(CHECK_IN_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function cancelTravelCheckIn() {
  const current = await getTravelCheckIn();
  if (current && Platform.OS !== "web") await Notifications.cancelScheduledNotificationAsync(current.notificationId).catch(() => undefined);
  await AsyncStorage.removeItem(CHECK_IN_KEY);
}