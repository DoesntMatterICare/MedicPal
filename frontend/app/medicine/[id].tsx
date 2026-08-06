import { Image } from "expo-image";
import { ArrowLeft, Bell, BellOff, Pill, Trash2, X } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BigButton } from "@/components/BigButton";
import { ExpiryBadge } from "@/components/ExpiryBadge";
import { Speakable } from "@/components/Speakable";
import { deleteCalendarEvents } from "@/services/calendar";
import { deleteMedicine, getMedicine, saveMedicine } from "@/services/db";
import { cancelMedicineNotifications, scheduleMedicineNotifications } from "@/services/notifications";
import { useApp } from "@/src/context/AppContext";
import { colors, radii } from "@/src/theme";
import type { Medicine } from "@/src/types";
import { displayTime } from "@/utils/scheduleParser";

export default function MedicineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, speak, fontSize } = useApp();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => { void getMedicine(id).then((item) => { setMedicine(item); if (item?.expiryDate && new Date(item.expiryDate).getTime() < Date.now()) speak(`Warning. ${item.name} is expired. Do not use it.`); }); }, [id, speak]);

  const toggleSchedule = async (index: number) => {
    if (!medicine) return;
    await cancelMedicineNotifications(medicine.notificationIds);
    const next = { ...medicine, schedule: medicine.schedule.map((item, itemIndex) => itemIndex === index ? { ...item, enabled: !item.enabled } : item), notificationIds: [] };
    const notificationIds = await scheduleMedicineNotifications(next);
    const saved = { ...next, notificationIds };
    await saveMedicine(saved); setMedicine(saved);
    speak(`${displayTime(saved.schedule[index].time)} reminder ${saved.schedule[index].enabled ? "on" : "off"}`);
  };

  const remove = async () => {
    if (!medicine) return;
    setDeleting(true);
    await cancelMedicineNotifications(medicine.notificationIds);
    await deleteCalendarEvents(medicine.googleEventIds, profile?.accessToken || "");
    await deleteMedicine(medicine.id);
    speak(`${medicine.name} deleted`);
    setConfirmDelete(false); router.replace("/(tabs)");
  };

  if (!medicine) return <SafeAreaView style={styles.loading}><Text style={styles.loadingText}>Loading medicine...</Text></SafeAreaView>;
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}><Pressable testID="detail-back-button" onPress={() => router.back()} style={styles.back}><ArrowLeft size={23} color={colors.text} /><Text style={styles.backText}>Back</Text></Pressable><Text style={styles.headerTitle}>Medicine details</Text><View style={styles.headerSpace} /></View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {medicine.photoUri ? <Image source={{ uri: medicine.photoUri }} style={styles.photo} contentFit="cover" /> : <View style={[styles.photo, styles.photoFallback]}><Pill size={72} color={colors.primary} /></View>}
        <Speakable text={`${medicine.name}. ${medicine.dosage}. ${medicine.frequency}`} testID="detail-speak-button">
          <Text style={[styles.name, { fontSize: Math.max(26, fontSize + 8) }]}>{medicine.name}</Text>
          <ExpiryBadge date={medicine.expiryDate} />
        </Speakable>
        <View style={styles.infoCard}><Text style={styles.label}>Dosage instructions</Text><Text style={styles.info}>{medicine.dosage}</Text><Text style={styles.label}>Frequency from label</Text><Text style={styles.info}>{medicine.frequency}</Text></View>
        <Text style={styles.sectionTitle}>Daily reminders</Text>
        {medicine.schedule.map((item, index) => (
          <View key={`${item.time}-${index}`} style={styles.scheduleRow}>
            <View style={[styles.bell, { backgroundColor: item.enabled ? colors.card : colors.background }]}>{item.enabled ? <Bell size={27} color={colors.primary} /> : <BellOff size={27} color={colors.textSecondary} />}</View>
            <View style={styles.scheduleText}><Text style={styles.time}>{displayTime(item.time)}</Text><Text style={styles.scheduleStatus}>{item.enabled ? "Reminder is on" : "Reminder is off"}</Text></View>
            <Switch testID={`schedule-toggle-${index}`} value={item.enabled} onValueChange={() => toggleSchedule(index)} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.white} style={styles.switch} />
          </View>
        ))}
        <BigButton testID="delete-medicine-button" label="Delete medicine" icon={Trash2} variant="secondary" onPress={() => { speak("Are you sure you want to delete this medicine?"); setConfirmDelete(true); }} />
      </ScrollView>
      <Modal visible={confirmDelete} transparent animationType="slide" onRequestClose={() => setConfirmDelete(false)}><View style={styles.backdrop}><View style={styles.sheet}><View style={styles.handle} /><Trash2 size={52} color={colors.danger} /><Text style={styles.sheetTitle}>Delete {medicine.name}?</Text><Text style={styles.sheetText}>This also removes its alarms and Google Calendar events.</Text><BigButton testID="confirm-delete-medicine-button" label="Yes, delete" icon={Trash2} variant="danger" loading={deleting} onPress={remove} /><BigButton testID="cancel-delete-medicine-button" label="No, keep it" icon={X} variant="secondary" onPress={() => setConfirmDelete(false)} /></View></View></Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, loading: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }, loadingText: { color: colors.text, fontSize: 20, fontWeight: "800" },
  header: { minHeight: 70, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.border }, back: { minHeight: 60, minWidth: 82, flexDirection: "row", alignItems: "center", gap: 5 }, backText: { color: colors.text, fontSize: 17, fontWeight: "800" }, headerTitle: { color: colors.text, fontSize: 20, fontWeight: "900" }, headerSpace: { width: 82 },
  content: { padding: 20, paddingBottom: 32, gap: 18 }, photo: { width: "100%", height: 230, borderRadius: radii.lg, backgroundColor: colors.card }, photoFallback: { alignItems: "center", justifyContent: "center" }, name: { color: colors.text, lineHeight: 36, fontWeight: "900", marginBottom: 12 },
  infoCard: { backgroundColor: colors.white, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: 18, gap: 5 }, label: { color: colors.textSecondary, fontSize: 15, fontWeight: "700", marginTop: 8 }, info: { color: colors.text, fontSize: 20, lineHeight: 28, fontWeight: "800" }, sectionTitle: { color: colors.text, fontSize: 23, fontWeight: "900", marginTop: 4 },
  scheduleRow: { minHeight: 88, backgroundColor: colors.white, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: 14, flexDirection: "row", alignItems: "center", gap: 13 }, bell: { width: 52, height: 52, borderRadius: 17, alignItems: "center", justifyContent: "center" }, scheduleText: { flex: 1 }, time: { color: colors.text, fontSize: 21, fontWeight: "900" }, scheduleStatus: { color: colors.textSecondary, fontSize: 15, marginTop: 3 }, switch: { transform: [{ scaleX: 1.25 }, { scaleY: 1.25 }] },
  backdrop: { flex: 1, backgroundColor: "rgba(14,43,74,0.45)", justifyContent: "flex-end" }, sheet: { minHeight: "52%", backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, alignItems: "center", justifyContent: "center", gap: 15 }, handle: { position: "absolute", top: 12, width: 54, height: 5, borderRadius: 3, backgroundColor: colors.border }, sheetTitle: { color: colors.text, fontSize: 27, fontWeight: "900", textAlign: "center" }, sheetText: { color: colors.textSecondary, fontSize: 18, lineHeight: 26, textAlign: "center", marginBottom: 8 },
});