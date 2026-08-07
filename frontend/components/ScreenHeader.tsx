import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/src/theme";

export function ScreenHeader({ title, subtitle, testID }: { title: string; subtitle: string; testID: string }) {
  return (
    <View testID={testID} style={styles.header}>
      <Pressable testID={`${testID}-back-button`} accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={({ pressed }) => [styles.back, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}>
        <ArrowLeft size={25} color={colors.primary} />
      </Pressable>
      <View style={styles.copy}><Text style={styles.title}>{title}</Text><Text style={styles.subtitle}>{subtitle}</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { width: 52, height: 52, borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1 }, title: { color: colors.text, fontSize: 27, fontWeight: "900" }, subtitle: { color: colors.textSecondary, fontSize: 15, lineHeight: 20, marginTop: 2 },
});