import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { Check, Globe2, MoveRight, Volume2 } from "lucide-react-native";
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BigButton } from "@/components/BigButton";
import { languages } from "@/src/i18n";
import { useApp } from "@/src/context/AppContext";
import { colors, radii } from "@/src/theme";

export default function LanguageScreen() {
  const { language, chooseLanguage } = useApp();
  const [selected, setSelected] = useState(language || "en");
  const choose = async (code: string, name: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelected(code);
    Speech.speak(name, { language: code, rate: 0.85 });
  };
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <View style={styles.brand}><View style={styles.logo}><Globe2 color={colors.white} size={29} /></View><Text style={styles.brandText}>MedicPal</Text></View>
        <Text style={styles.title}>Choose your language</Text>
        <Text style={styles.subtitle}>You can change this anytime in Settings.</Text>
      </View>
      <ScrollView testID="language-list" contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {languages.map((item) => {
          const active = selected === item.code;
          return (
            <Pressable
              key={item.code}
              testID={`language-option-${item.code}`}
              accessibilityRole="button"
              onPress={() => choose(item.code, item.native)}
              style={({ pressed }) => [styles.language, active && styles.languageActive, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}
            >
              <View style={[styles.languageIcon, active && styles.languageIconActive]}><Text style={styles.code}>{item.code.toUpperCase()}</Text></View>
              <View style={styles.languageText}><Text style={styles.native}>{item.native}</Text><Text style={styles.english}>{item.english}</Text></View>
              <Volume2 size={22} color={colors.primary} />
              {active && <Check size={24} color={colors.primary} strokeWidth={3} />}
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.footer}>
        <BigButton testID="language-continue-button" label="Continue" icon={MoveRight} onPress={async () => { await chooseLanguage(selected); router.replace("/onboarding/login"); }} />
        <Text style={styles.private}>Your health information stays private.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 14 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 22 },
  logo: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  brandText: { fontSize: 24, fontWeight: "900", color: colors.primary },
  title: { fontSize: 28, lineHeight: 34, fontWeight: "900", color: colors.text },
  subtitle: { fontSize: 18, lineHeight: 25, color: colors.textSecondary, marginTop: 7 },
  list: { paddingHorizontal: 20, gap: 10, paddingBottom: 16 },
  language: { minHeight: 80, borderRadius: radii.md, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.border, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  languageActive: { borderColor: colors.primary, backgroundColor: colors.card },
  languageIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
  languageIconActive: { backgroundColor: colors.white },
  code: { color: colors.primary, fontWeight: "900", fontSize: 14 },
  languageText: { flex: 1 }, native: { color: colors.text, fontSize: 20, fontWeight: "800" }, english: { color: colors.textSecondary, fontSize: 15, marginTop: 2 },
  footer: { padding: 20, paddingTop: 12, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border },
  private: { textAlign: "center", color: colors.textSecondary, marginTop: 12, fontSize: 14, fontWeight: "600" },
});