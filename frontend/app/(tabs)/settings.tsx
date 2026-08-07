import Slider from "@react-native-community/slider";
import * as AuthSession from "expo-auth-session";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { Languages, LockKeyhole, LogOut, Phone, Shield, Type, Volume2, X } from "lucide-react-native";
import { router } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BigButton } from "@/components/BigButton";
import { EmergencyButton } from "@/components/EmergencyButton";
import { clearMedicines } from "@/services/db";
import { useApp } from "@/src/context/AppContext";
import { colors, radii } from "@/src/theme";

function SettingRow({ icon: Icon, title, description, children }: { icon: typeof Type; title: string; description: string; children: React.ReactNode }) {
  return <View style={styles.row}><View style={styles.rowTop}><View style={styles.rowIcon}><Icon size={24} color={colors.primary} /></View><View style={styles.rowText}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowDescription}>{description}</Text></View>{children}</View></View>;
}

export default function SettingsScreen() {
  const { profile, fontSize, highContrast, ttsEnabled, updateProfile, clearProfile, speak } = useApp();
  const [phone, setPhone] = useState(profile?.caregiverPhone || "");
  const [confirmLogout, setConfirmLogout] = useState(false);
  const logout = async () => {
    if (profile?.accessToken) {
      await AuthSession.revokeAsync({ token: profile.accessToken }, { revocationEndpoint: "https://oauth2.googleapis.com/revoke" }).catch(() => undefined);
    }
    await Notifications.cancelAllScheduledNotificationsAsync().catch(() => undefined);
    await clearMedicines();
    await clearProfile();
    setConfirmLogout(false);
    router.replace("/onboarding/language");
  };
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}><Text style={styles.title}>Settings</Text><Text style={styles.subtitle}>Make MedicPal comfortable for you.</Text></View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <SettingRow icon={Type} title="Text size" description="Slide to make all text easier to read.">
            <Text style={styles.value}>{fontSize}</Text>
          </SettingRow>
          <View style={styles.sliderCard}>
            <Slider testID="font-size-slider" minimumValue={18} maximumValue={24} step={1} value={fontSize} minimumTrackTintColor={colors.primary} maximumTrackTintColor={colors.border} thumbTintColor={colors.primary} onSlidingComplete={(value) => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); void updateProfile({ fontSize: value }); }} />
            <View style={styles.preview}><Text style={[styles.previewText, { fontSize }]}>This is how your medicine will look.</Text></View>
          </View>
          <SettingRow icon={Shield} title="High contrast" description="Strong colors and clearer borders.">
            <Switch testID="high-contrast-toggle" value={highContrast} onValueChange={(value) => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); void updateProfile({ highContrast: value }); }} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.white} style={styles.switch} />
          </SettingRow>
          <SettingRow icon={Volume2} title="Spoken help" description="Read labels and confirmations aloud.">
            <Switch testID="tts-toggle" value={ttsEnabled} onValueChange={(value) => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); void updateProfile({ ttsEnabled: value }); if (value) speak("Spoken help is on"); }} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.white} style={styles.switch} />
          </SettingRow>
          <Pressable testID="change-language-button" onPress={async () => { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/onboarding/language"); }} style={({ pressed }) => [styles.actionRow, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}><Languages size={25} color={colors.primary} /><View style={styles.rowText}><Text style={styles.rowTitle}>Language</Text><Text style={styles.rowDescription}>Choose from 10 Indian languages.</Text></View></Pressable>
          <Pressable testID="open-privacy-dashboard-button" onPress={async () => { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/privacy"); }} style={({ pressed }) => [styles.actionRow, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}><LockKeyhole size={25} color={colors.primary} /><View style={styles.rowText}><Text style={styles.rowTitle}>Privacy dashboard</Text><Text style={styles.rowDescription}>See local records, photo handling, sync, and permissions.</Text></View></Pressable>
          <View style={styles.phoneCard}><View style={styles.rowTop}><View style={styles.rowIcon}><Phone size={24} color={colors.primary} /></View><View style={styles.rowText}><Text style={styles.rowTitle}>Caregiver phone</Text><Text style={styles.rowDescription}>Used only when you tap the Call button.</Text></View></View><TextInput testID="caregiver-phone-input" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Enter phone number" placeholderTextColor={colors.textSecondary} style={styles.input} onBlur={() => updateProfile({ caregiverPhone: phone.trim() })} /></View>
          <BigButton testID="logout-button" label="Sign out and clear data" icon={LogOut} variant="secondary" onPress={() => { speak("Are you sure you want to sign out and clear all medicine data?"); setConfirmLogout(true); }} />
        </ScrollView>
      </KeyboardAvoidingView>
      <EmergencyButton />
      <Modal visible={confirmLogout} transparent animationType="slide" onRequestClose={() => setConfirmLogout(false)}>
        <View style={styles.modalBackdrop}><View style={styles.sheet}>
          <View style={styles.sheetHandle} /><Text style={styles.sheetTitle}>Clear MedicPal data?</Text><Text style={styles.sheetText}>This removes your medicines, reminders, and settings from this phone.</Text>
          <BigButton testID="confirm-logout-button" label="Yes, clear everything" icon={LogOut} variant="danger" onPress={logout} />
          <BigButton testID="cancel-logout-button" label="No, keep my data" icon={X} variant="secondary" onPress={() => setConfirmLogout(false)} />
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { color: colors.text, fontSize: 28, fontWeight: "900" }, subtitle: { color: colors.textSecondary, fontSize: 18, marginTop: 5 },
  content: { padding: 20, paddingBottom: 140, gap: 14 },
  row: { minHeight: 92, backgroundColor: colors.white, borderRadius: radii.lg, padding: 16, borderWidth: 1, borderColor: colors.border, justifyContent: "center" },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 12 }, rowIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" }, rowText: { flex: 1 },
  rowTitle: { color: colors.text, fontSize: 19, fontWeight: "900" }, rowDescription: { color: colors.textSecondary, fontSize: 15, lineHeight: 21, marginTop: 3 }, value: { color: colors.primary, fontSize: 22, fontWeight: "900" },
  sliderCard: { backgroundColor: colors.white, borderRadius: radii.lg, padding: 16, borderWidth: 1, borderColor: colors.border }, preview: { backgroundColor: colors.card, padding: 16, borderRadius: radii.md, marginTop: 8 }, previewText: { color: colors.text, fontWeight: "800" },
  switch: { transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }, actionRow: { minHeight: 92, backgroundColor: colors.white, borderRadius: radii.lg, padding: 16, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 14 },
  phoneCard: { backgroundColor: colors.white, borderRadius: radii.lg, padding: 16, borderWidth: 1, borderColor: colors.border }, input: { minHeight: 60, backgroundColor: colors.background, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 16, color: colors.text, fontSize: 18, marginTop: 14 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(14,43,74,0.45)", justifyContent: "flex-end" }, sheet: { minHeight: "52%", backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 14, justifyContent: "center" }, sheetHandle: { width: 54, height: 5, borderRadius: 3, backgroundColor: colors.border, alignSelf: "center", position: "absolute", top: 12 }, sheetTitle: { color: colors.text, fontSize: 27, fontWeight: "900", textAlign: "center" }, sheetText: { color: colors.textSecondary, fontSize: 18, lineHeight: 26, textAlign: "center", marginBottom: 10 },
});