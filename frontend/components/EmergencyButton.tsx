import * as Haptics from "expo-haptics";
import { Phone } from "lucide-react-native";
import React from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useApp } from "@/src/context/AppContext";
import { colors } from "@/src/theme";

export function EmergencyButton() {
  const { profile, speak } = useApp();
  const call = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const phone = profile?.caregiverPhone?.trim();
    if (!phone) { speak("Add a caregiver phone number in Settings first"); return; }
    speak("Calling your caregiver");
    await Linking.openURL(`tel:${phone.replace(/[^+\d]/g, "")}`);
  };
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Pressable testID="emergency-call-button" accessibilityRole="button" accessibilityLabel="Emergency call caregiver" onPress={call} style={({ pressed }) => [styles.button, { transform: [{ scale: pressed ? 0.95 : 1 }] }]}>
        <Phone color={colors.white} size={27} fill={colors.white} />
        <Text style={styles.label}>Call</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", right: 16, bottom: 96 },
  button: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.danger, justifyContent: "center", alignItems: "center", shadowColor: colors.danger, shadowOpacity: 0.3, shadowRadius: 12, elevation: 7 },
  label: { color: colors.white, fontSize: 12, fontWeight: "800" },
});