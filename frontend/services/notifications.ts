import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { Medicine } from "@/src/types";

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

export async function scheduleMedicineNotifications(medicine: Medicine): Promise<string[]> {
  if (Platform.OS === "web") return [];
  const ids: string[] = [];
  for (const item of medicine.schedule.filter((entry) => entry.enabled)) {
    const [hour, minute] = item.time.split(":").map(Number);
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Time for ${medicine.name}`,
        body: medicine.dosage || "Take your scheduled medicine",
        data: { medicineId: medicine.id },
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
    });
    ids.push(id);
  }
  return ids;
}

export async function cancelMedicineNotifications(ids: string[]) {
  if (Platform.OS === "web") return;
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

export async function snoozeMedicine(medicine: Medicine) {
  if (Platform.OS === "web") return;
  await Notifications.scheduleNotificationAsync({
    content: { title: `Time for ${medicine.name}`, body: medicine.dosage, data: { medicineId: medicine.id }, sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 600 },
  });
}