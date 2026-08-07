import { Image } from "expo-image";
import { Check, Clock3, MessageCircle, PhoneCall, Pill, TimerReset } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Linking, Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BigButton } from "@/components/BigButton";
import { getMedicine, saveMedicine } from "@/services/db";
import { snoozeMedicine } from "@/services/notifications";
import { useApp } from "@/src/context/AppContext";
import { colors, radii } from "@/src/theme";
import type { Medicine } from "@/src/types";

export default function ReminderScreen() {
  const { id, missed, scheduleTime } = useLocalSearchParams<{ id: string; missed?: string; scheduleTime?: string }>();
  const { speak, profile } = useApp();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })); update();
    const timer = setInterval(update, 30000);
    void getMedicine(id).then((item) => { setMedicine(item); if (item) speak(`It's time to take your medicine: ${item.name}`); });
    return () => clearInterval(timer);
  }, [id, speak]);

  const taken = async () => {
    if (!medicine) return;
    const next = { ...medicine, schedule: medicine.schedule.map((item, index) => ({ ...item, taken: scheduleTime ? item.time === scheduleTime || item.taken : index === 0 ? true : item.taken })) };
    await saveMedicine(next); speak(`${medicine.name} marked as taken. Well done.`); router.replace("/(tabs)");
  };
  const snooze = async () => { if (!medicine) return; await snoozeMedicine(medicine); speak("Reminder snoozed for 10 minutes"); router.replace("/(tabs)"); };
  const caregiverPhone = profile?.caregiverPhone?.trim() || "";
  const callCaregiver = async () => {
    if (!caregiverPhone) { speak("Add a caregiver phone number in Settings first"); return; }
    await Linking.openURL(`tel:${caregiverPhone.replace(/[^+\d]/g, "")}`);
  };
  const messageCaregiver = async () => {
    if (!medicine || !caregiverPhone) { speak("Add a caregiver phone number in Settings first"); return; }
    const body = encodeURIComponent(`MedicPal alert: ${medicine.name} scheduled for ${time} is still unconfirmed. Please check in with me.`);
    const separator = Platform.OS === "ios" ? "&" : "?";
    await Linking.openURL(`sms:${caregiverPhone.replace(/[^+\d]/g, "")}${separator}body=${body}`);
  };
  if (!medicine) return <SafeAreaView style={styles.safe}><Text style={styles.loading}>Loading reminder...</Text></SafeAreaView>;
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.top}><View style={styles.clock}><Clock3 size={23} color={missed === "1" ? colors.warning : colors.primary} /><Text style={[styles.time, missed === "1" && { color: colors.warning }]}>{time}</Text></View><Text style={styles.prompt}>{missed === "1" ? "Dose still unconfirmed after 30 minutes" : "It’s medicine time"}</Text></View>
      {medicine.photoUri ? <Image source={{ uri: medicine.photoUri }} style={styles.photo} contentFit="cover" /> : <View style={[styles.photo, styles.fallback]}><Pill size={84} color={colors.primary} /></View>}
      <View style={styles.details}><Text style={styles.name}>{medicine.name}</Text><Text style={styles.dosage}>{medicine.dosage}</Text></View>
      <View style={styles.actions}>
        <BigButton testID="reminder-taken-button" label="Taken" icon={Check} onPress={taken} />
        {missed === "1" && <View style={styles.caregiverRow}><BigButton testID="missed-call-caregiver-button" label="Call caregiver" icon={PhoneCall} variant="secondary" onPress={callCaregiver} style={styles.caregiverButton} /><BigButton testID="missed-message-caregiver-button" label="Send SMS" icon={MessageCircle} variant="secondary" onPress={messageCaregiver} style={styles.caregiverButton} /></View>}
        <BigButton testID="reminder-snooze-button" label="Snooze 10 minutes" icon={TimerReset} variant="secondary" onPress={snooze} />
        {missed === "1" && !caregiverPhone && <Text style={styles.caregiverHint}>Add a caregiver phone number in Settings to call or send an SMS.</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, padding: 20 }, loading: { margin: "auto", color: colors.text, fontSize: 20, fontWeight: "800" },
  top: { alignItems: "center", paddingTop: 8, paddingBottom: 18 }, clock: { minHeight: 48, borderRadius: 24, paddingHorizontal: 16, backgroundColor: colors.card, flexDirection: "row", alignItems: "center", gap: 8 }, time: { color: colors.primary, fontSize: 19, fontWeight: "900" }, prompt: { color: colors.textSecondary, fontSize: 18, fontWeight: "700", marginTop: 10 },
  photo: { width: "100%", height: "40%", minHeight: 250, borderRadius: radii.lg, backgroundColor: colors.card }, fallback: { alignItems: "center", justifyContent: "center" },
  details: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 18 }, name: { color: colors.text, fontSize: 32, lineHeight: 39, fontWeight: "900", textAlign: "center" }, dosage: { color: colors.textSecondary, fontSize: 21, fontWeight: "700", textAlign: "center", marginTop: 8 }, actions: { gap: 12, paddingBottom: 4 }, caregiverRow: { flexDirection: "row", gap: 10 }, caregiverButton: { flex: 1, paddingHorizontal: 8 }, caregiverHint: { color: colors.warning, fontSize: 15, lineHeight: 21, fontWeight: "800", textAlign: "center" },
});