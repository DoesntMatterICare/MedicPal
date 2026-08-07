import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Check, Pill } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useApp } from "@/src/context/AppContext";
import { colors, radii } from "@/src/theme";
import type { Medicine } from "@/src/types";
import { displayTime } from "@/utils/scheduleParser";
import { ExpiryBadge } from "./ExpiryBadge";

export function MedicineCard({ medicine, onOpen, onToggle }: { medicine: Medicine; onOpen: () => void; onToggle: () => void }) {
  const { fontSize, speak } = useApp();
  const first = medicine.schedule[0];
  const reminderLabel = medicine.reminderState === "stopped" ? "Reminders stopped" : medicine.reminderState === "paused" ? "Paused" : displayTime(first?.time || "09:00");
  return (
    <Pressable testID={`medicine-card-${medicine.id}`} onPress={async () => { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); speak(medicine.name); onOpen(); }} style={({ pressed }) => [styles.card, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      {medicine.photoUri ? <Image source={{ uri: medicine.photoUri }} style={styles.photo} contentFit="cover" /> : <View style={[styles.photo, styles.placeholder]}><Pill size={40} color={colors.primary} /></View>}
      <View style={styles.info}>
        <Text numberOfLines={2} style={[styles.name, { fontSize: Math.max(22, fontSize + 2) }]}>{medicine.name}</Text>
        <View testID={`medicine-reminder-status-${medicine.id}`} style={[styles.time, medicine.reminderState !== "active" && medicine.reminderState && styles.timeInactive]}><Text style={[styles.timeText, medicine.reminderState !== "active" && medicine.reminderState && styles.timeTextInactive]}>{reminderLabel}</Text></View>
        <ExpiryBadge date={medicine.expiryDate} />
      </View>
      <View style={styles.toggleWrap}>
        <Switch
          testID={`medicine-taken-toggle-${medicine.id}`}
          accessibilityLabel={first?.taken ? "Taken" : "Not taken"}
          value={first?.taken || false}
          onValueChange={async () => { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onToggle(); }}
          trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.white}
          style={styles.switch}
        />
        <View style={styles.takenRow}><Check size={14} color={colors.textSecondary} /><Text style={styles.taken}>{first?.taken ? "Taken" : "Not taken"}</Text></View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 144, backgroundColor: colors.white, borderRadius: radii.lg, padding: 14, flexDirection: "row", gap: 14, borderWidth: 1, borderColor: colors.border, shadowColor: colors.text, shadowOpacity: 0.08, shadowRadius: 14, elevation: 3 },
  photo: { width: 108, height: 116, borderRadius: radii.md, overflow: "hidden" },
  placeholder: { backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
  info: { flex: 1, alignItems: "flex-start", gap: 7 },
  name: { color: colors.text, fontWeight: "900", lineHeight: 27 },
  time: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 5 }, timeInactive: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  timeText: { color: colors.white, fontSize: 14, fontWeight: "800" },
  timeTextInactive: { color: colors.textSecondary },
  toggleWrap: { width: 70, alignItems: "center", justifyContent: "center" },
  switch: { transform: [{ scaleX: 1.25 }, { scaleY: 1.25 }] },
  takenRow: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 3 },
  taken: { color: colors.textSecondary, fontSize: 12, fontWeight: "700", textAlign: "center" },
});