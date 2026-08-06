import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "@/src/theme";

function status(date: string | null) {
  if (!date) return { text: "Expiry not listed", color: colors.primary, Icon: CheckCircle2 };
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return { text: `Expiry ${date}`, color: colors.primary, Icon: CheckCircle2 };
  const days = Math.ceil((parsed.getTime() - Date.now()) / 86400000);
  if (days < 0) return { text: "Expired — do not use", color: colors.danger, Icon: ShieldAlert };
  if (days <= 30) return { text: `Expires in ${days} days`, color: colors.warning, Icon: AlertTriangle };
  return { text: `Expires ${parsed.toLocaleDateString()}`, color: colors.primary, Icon: CheckCircle2 };
}

export function ExpiryBadge({ date }: { date: string | null }) {
  const item = status(date);
  return <View style={[styles.badge, { borderColor: item.color }]}><item.Icon size={18} color={item.color} /><Text style={[styles.text, { color: item.color }]}>{item.text}</Text></View>;
}

const styles = StyleSheet.create({
  badge: { minHeight: 36, borderWidth: 1.5, borderRadius: radii.pill, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 7, alignSelf: "flex-start" },
  text: { fontSize: 14, fontWeight: "800" },
});