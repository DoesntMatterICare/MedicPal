import * as Haptics from "expo-haptics";
import type { LucideIcon } from "lucide-react-native";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { colors, radii } from "@/src/theme";
import { useApp } from "@/src/context/AppContext";

type Props = {
  label: string;
  icon: LucideIcon;
  onPress: () => void | Promise<void>;
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
  disabled?: boolean;
  testID: string;
  style?: ViewStyle;
};

export function BigButton({ label, icon: Icon, onPress, variant = "primary", loading, disabled, testID, style }: Props) {
  const { fontSize, speak } = useApp();
  const background = variant === "danger" ? colors.danger : variant === "primary" ? colors.primary : colors.white;
  const foreground = variant === "secondary" ? colors.primary : colors.white;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      disabled={disabled || loading}
      onPress={async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        speak(label);
        await onPress();
      }}
      style={({ pressed }) => [styles.button, { backgroundColor: background, borderColor: variant === "secondary" ? colors.primary : background, opacity: disabled ? 0.55 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] }, style]}
    >
      {loading ? <ActivityIndicator color={foreground} /> : <Icon color={foreground} size={24} strokeWidth={2.4} />}
      <Text style={[styles.label, { color: foreground, fontSize: Math.max(18, fontSize) }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 64, borderRadius: radii.md, borderWidth: 2, paddingHorizontal: 20, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10 },
  label: { fontWeight: "800", textAlign: "center" },
});