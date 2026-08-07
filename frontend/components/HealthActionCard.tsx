import type { LucideIcon } from "lucide-react-native";
import { ChevronRight } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii } from "@/src/theme";

type Props = { title: string; description: string; icon: LucideIcon; onPress: () => void; testID: string; accent?: "blue" | "orange" };

export function HealthActionCard({ title, description, icon: Icon, onPress, testID, accent = "blue" }: Props) {
  const tone = accent === "orange" ? colors.warning : colors.primary;
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [styles.card, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      <View style={[styles.icon, { borderColor: tone }]}><Icon size={26} color={tone} /></View>
      <View style={styles.copy}><Text style={styles.title}>{title}</Text><Text style={styles.description}>{description}</Text></View>
      <ChevronRight size={24} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 92, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 15 },
  icon: { width: 52, height: 52, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1 }, title: { color: colors.text, fontSize: 18, fontWeight: "900" }, description: { color: colors.textSecondary, fontSize: 14, lineHeight: 19, marginTop: 3 },
});