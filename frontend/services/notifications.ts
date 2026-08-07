import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { Medicine } from "@/src/types";
import { getMedicine } from "@/services/db";

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data;
    if (data?.missedDose && typeof data.medicineId === "string") {
      const medicine = await getMedicine(data.medicineId);
      if (medicine?.schedule.some((item) => item.taken)) {
        return { shouldShowBanner: false, shouldShowList: false, shouldPlaySound: false, shouldSetBadge: false };
      }
    }
    return { shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false };
  },
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
    const escalationMinutes = hour * 60 + minute + 30;
    const escalationHour = Math.floor((escalationMinutes % 1440) / 60);
    const escalationMinute = escalationMinutes % 60;
    const missedId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${medicine.name} is still unconfirmed`,
        body: "Tap to mark it taken or contact your caregiver.",
        data: { medicineId: medicine.id, missedDose: true },
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: escalationHour, minute: escalationMinute },
    });
    ids.push(missedId);
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