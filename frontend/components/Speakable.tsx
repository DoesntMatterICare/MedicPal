import * as Haptics from "expo-haptics";
import { Volume2 } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useApp } from "@/src/context/AppContext";
import { colors } from "@/src/theme";

export function Speakable({ text, children, testID }: { text: string; children: React.ReactNode; testID: string }) {
  const { speak, ttsEnabled } = useApp();
  return (
    <View style={styles.row}>
      <View style={styles.content}>{children}</View>
      {ttsEnabled && (
        <Pressable
          testID={testID}
          accessibilityRole="button"
          accessibilityLabel={`Hear ${text}`}
          onPress={async () => { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); speak(text); }}
          style={({ pressed }) => [styles.speak, { opacity: pressed ? 0.65 : 1 }]}
        >
          <Volume2 size={22} color={colors.primary} />
          <Text style={styles.hear}>Hear</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  content: { flex: 1 },
  speak: { minHeight: 60, minWidth: 60, justifyContent: "center", alignItems: "center" },
  hear: { color: colors.primary, fontSize: 12, fontWeight: "700", marginTop: 2 },
});