import * as Notifications from "expo-notifications";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { ArrowLeft, Bell, CalendarClock, Check, Edit3, RotateCcw, Settings, Upload } from "lucide-react-native";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BigButton } from "@/components/BigButton";
import { Speakable } from "@/components/Speakable";
import { createCalendarEvents } from "@/services/calendar";
import { clearPendingScan, getPendingScan, saveMedicine } from "@/services/db";
import { analyzeMedicine } from "@/services/gemini";
import { chooseMedicineImage } from "@/services/images";
import { savePendingScan } from "@/services/db";
import { scheduleMedicineNotifications } from "@/services/notifications";
import { useApp } from "@/src/context/AppContext";
import { colors, radii } from "@/src/theme";
import type { PendingScan, ScanResult } from "@/src/types";
import { displayTime, parseSchedule } from "@/utils/scheduleParser";

function normalizeExpiry(value: string | null) {
  if (!value) return null;
  if (/^\d{4}$/.test(value)) return `${value}-12-31`;
  const monthYear = value.match(/^(\d{1,2})\/(\d{4})$/);
  if (monthYear) return `${monthYear[2]}-${monthYear[1].padStart(2, "0")}-28`;
  const full = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (full) return `${full[3]}-${full[2].padStart(2, "0")}-${full[1].padStart(2, "0")}`;
  return value;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={styles.detail}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>;
}

export default function ConfirmScreen() {
  const { profile, speak } = useApp();
  const [pending, setPending] = useState<PendingScan | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [manual, setManual] = useState(false);
  const [saving, setSaving] = useState(false);
  const [permissionSheet, setPermissionSheet] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [photoPermissionSheet, setPhotoPermissionSheet] = useState(false);
  const [photoBlocked, setPhotoBlocked] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const times = useMemo(() => parseSchedule(result?.frequency_hint), [result?.frequency_hint]);
  useEffect(() => { void getPendingScan().then((scan) => { setPending(scan); setResult(scan?.result || null); if (!scan?.result.medicine_name) speak("Could not read clearly. Please retake in better light."); }); }, [speak]);

  const finishSave = async (allowNotifications: boolean) => {
    if (!pending || !result?.medicine_name) return;
    setSaving(true); setPermissionSheet(false);
    const medicine = {
      id: `${Date.now()}`, name: result.medicine_name, photoUri: pending.photoUri,
      expiryDate: normalizeExpiry(result.expiry_date), dosage: result.dosage || "Dosage not listed",
      frequency: result.frequency_hint || "Once daily",
      schedule: times.map((time) => ({ time, taken: false, enabled: true })),
      googleEventIds: [], notificationIds: [], createdAt: new Date().toISOString(), reminderState: "active" as const,
    };
    try {
      await saveMedicine(medicine);
      const notificationIds = allowNotifications ? await scheduleMedicineNotifications(medicine) : [];
      let googleEventIds: string[] = [];
      try { googleEventIds = await createCalendarEvents(medicine, profile?.accessToken || ""); } catch { /* Local reminders remain primary. */ }
      await saveMedicine({ ...medicine, notificationIds, googleEventIds });
      await clearPendingScan();
      speak(`Reminder set for ${times.map(displayTime).join(" and ")}`);
      router.replace("/(tabs)");
    } finally { setSaving(false); }
  };

  const beginSave = async () => {
    if (Platform.OS === "web") return finishSave(false);
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return finishSave(true);
    setBlocked(!current.canAskAgain);
    setPermissionSheet(true);
  };

  const requestNotifications = async () => {
    const result = await Notifications.requestPermissionsAsync();
    if (result.granted) return finishSave(true);
    setBlocked(!result.canAskAgain);
  };

  const uploadReplacement = async () => {
    setPhotoPermissionSheet(false); setUploading(true); setUploadError("");
    try {
      const selected = await chooseMedicineImage();
      if (!selected) return;
      speak("Reading your medicine packaging");
      const nextResult = await analyzeMedicine(selected.base64);
      const nextPending = { photoUri: selected.uri, result: nextResult };
      await savePendingScan(nextPending);
      setPending(nextPending); setResult(nextResult); setManual(false);
      if (!nextResult.medicine_name) speak("No readable medicine name found. Please use a clear packaging or prescription photo.");
    } catch (reason) {
      setUploadError(reason instanceof Error ? reason.message : "Could not read this photo. Please choose another image.");
    } finally { setUploading(false); }
  };

  const beginPhotoUpload = async () => {
    if (Platform.OS === "web") return uploadReplacement();
    const current = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (current.granted) return uploadReplacement();
    setPhotoBlocked(!current.canAskAgain); setPhotoPermissionSheet(true);
  };

  const requestPhotoPermission = async () => {
    const response = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (response.granted) return uploadReplacement();
    setPhotoBlocked(!response.canAskAgain);
  };

  if (!pending || !result) return <SafeAreaView style={styles.loading}><Text style={styles.loadingText}>Preparing your medicine details...</Text></SafeAreaView>;
  const unreadable = !result.medicine_name && !manual;
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}><Pressable testID="confirm-back-button" onPress={() => router.replace("/scan/camera")} style={styles.back}><ArrowLeft size={23} color={colors.text} /><Text style={styles.backText}>Back</Text></Pressable><Text style={styles.headerTitle}>Check details</Text><View style={styles.headerSpace} /></View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Image source={{ uri: pending.photoUri }} style={styles.photo} contentFit="cover" />
          {unreadable ? (
            <View testID="unreadable-result-card" style={styles.unreadable}>
              <RotateCcw size={46} color={colors.warning} /><Text style={styles.unreadableTitle}>Could not read clearly</Text><Text style={styles.unreadableText}>Use a clear medicine box, bottle, blister strip, prescription, or label with visible printed text. Loose tablets cannot be safely identified by appearance.</Text>
              {!!uploadError && <Text testID="replacement-upload-error" style={styles.uploadError}>{uploadError}</Text>}
              <BigButton testID="unreadable-retake-button" label="Retake photo" icon={RotateCcw} onPress={() => router.replace("/scan/camera")} />
              <BigButton testID="unreadable-upload-button" label="Upload packaging photo" icon={Upload} variant="secondary" loading={uploading} onPress={beginPhotoUpload} />
              <Pressable testID="manual-entry-button" onPress={() => setManual(true)} style={styles.manualLink}><Edit3 size={20} color={colors.primary} /><Text style={styles.manualText}>Enter details manually</Text></Pressable>
            </View>
          ) : manual ? (
            <View style={styles.manualForm}>
              <Text style={styles.sectionTitle}>Enter label details</Text>
              {([['Medicine name', 'medicine_name'], ['Expiry date', 'expiry_date'], ['Dosage', 'dosage'], ['How often', 'frequency_hint']] as const).map(([label, key]) => <View key={key}><Text style={styles.inputLabel}>{label}</Text><TextInput testID={`manual-${key}-input`} value={result[key] || ""} onChangeText={(value) => setResult({ ...result, [key]: value || null })} style={styles.input} placeholder={label} placeholderTextColor={colors.textSecondary} /></View>)}
            </View>
          ) : (
            <View>
              <View style={styles.aiBadge}><Check size={20} color={colors.primary} /><Text style={styles.aiText}>AI extracted — please confirm</Text></View>
              <Speakable text={`${result.medicine_name}. ${result.dosage || "Dosage not listed"}. Reminders ${times.map(displayTime).join(" and ")}`} testID="confirm-details-speak-button">
                <View style={styles.detailsCard}><Detail label="Medicine name" value={result.medicine_name || "Not readable"} /><Detail label="Expiry date" value={result.expiry_date || "Not listed"} /><Detail label="Dosage" value={result.dosage || "Not listed"} /><Detail label="Frequency" value={result.frequency_hint || "Once daily"} /></View>
              </Speakable>
            </View>
          )}
          {!unreadable && <View style={styles.reminders}><CalendarClock size={26} color={colors.primary} /><View><Text style={styles.reminderTitle}>Reminder times</Text><Text style={styles.reminderTimes}>{times.map(displayTime).join("  •  ")}</Text></View></View>}
        </ScrollView>
        {!unreadable && <View style={styles.actions}><BigButton testID="confirm-reminder-button" label="Yes, remind me" icon={Check} loading={saving} disabled={!result.medicine_name} onPress={beginSave} style={styles.actionButton} /><BigButton testID="confirm-retake-button" label="Retake" icon={RotateCcw} variant="secondary" onPress={() => router.replace("/scan/camera")} style={styles.actionButton} /></View>}
      </KeyboardAvoidingView>
      <Modal visible={permissionSheet} transparent animationType="slide" onRequestClose={() => setPermissionSheet(false)}><View style={styles.backdrop}><View style={styles.sheet}><View style={styles.handle} /><Bell size={52} color={colors.primary} /><Text style={styles.sheetTitle}>{blocked ? "Notifications are off" : "Allow medicine reminders?"}</Text><Text style={styles.sheetText}>{blocked ? "Open device settings to turn on the alarms. You can still save without them." : "MedicPal will alert you at each medicine time, even when the app is closed."}</Text>{blocked ? <BigButton testID="open-notification-settings-button" label="Open device settings" icon={Settings} onPress={() => Linking.openSettings()} /> : <BigButton testID="request-notification-permission-button" label="Allow reminders" icon={Bell} onPress={requestNotifications} />}<BigButton testID="save-without-notifications-button" label="Save without alarms" icon={Check} variant="secondary" onPress={() => finishSave(false)} /></View></View></Modal>
      <Modal visible={photoPermissionSheet} transparent animationType="slide" onRequestClose={() => setPhotoPermissionSheet(false)}><View style={styles.backdrop}><View style={styles.sheet}><View style={styles.handle} /><Upload size={52} color={colors.primary} /><Text style={styles.sheetTitle}>{photoBlocked ? "Photo access is off" : "Choose a medicine photo?"}</Text><Text style={styles.sheetText}>{photoBlocked ? "Open device settings to choose a packaging photo." : "Select a box, bottle, blister strip, prescription, or label with readable printed text."}</Text>{photoBlocked ? <BigButton testID="confirm-open-photo-settings-button" label="Open device settings" icon={Settings} onPress={() => { setPhotoPermissionSheet(false); void Linking.openSettings(); }} /> : <BigButton testID="confirm-request-photo-permission-button" label="Allow photo access" icon={Upload} onPress={requestPhotoPermission} />}<BigButton testID="confirm-cancel-photo-upload-button" label="Not now" icon={ArrowLeft} variant="secondary" onPress={() => setPhotoPermissionSheet(false)} /></View></View></Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, safe: { flex: 1, backgroundColor: colors.background }, loading: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: 24 }, loadingText: { color: colors.text, fontSize: 20, fontWeight: "800" },
  header: { minHeight: 70, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.border }, back: { minHeight: 60, minWidth: 82, flexDirection: "row", alignItems: "center", gap: 5 }, backText: { color: colors.text, fontSize: 17, fontWeight: "800" }, headerTitle: { color: colors.text, fontSize: 21, fontWeight: "900" }, headerSpace: { width: 82 },
  content: { padding: 20, paddingBottom: 24, gap: 18 }, photo: { width: "100%", height: 220, borderRadius: radii.lg, backgroundColor: colors.card }, aiBadge: { minHeight: 48, borderRadius: radii.md, backgroundColor: colors.card, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 14, marginBottom: 12 }, aiText: { color: colors.primary, fontSize: 16, fontWeight: "900" },
  detailsCard: { backgroundColor: colors.white, borderRadius: radii.lg, paddingHorizontal: 18, borderWidth: 1, borderColor: colors.border }, detail: { minHeight: 78, justifyContent: "center", borderBottomWidth: 1, borderBottomColor: colors.border }, detailLabel: { color: colors.textSecondary, fontSize: 14, fontWeight: "700" }, detailValue: { color: colors.text, fontSize: 21, fontWeight: "900", marginTop: 4 }, reminders: { minHeight: 82, backgroundColor: colors.card, borderRadius: radii.lg, padding: 16, flexDirection: "row", alignItems: "center", gap: 14 }, reminderTitle: { color: colors.text, fontSize: 18, fontWeight: "900" }, reminderTimes: { color: colors.primary, fontSize: 17, fontWeight: "800", marginTop: 4 },
  actions: { minHeight: 104, padding: 14, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.white, flexDirection: "row", gap: 10 }, actionButton: { flex: 1, paddingHorizontal: 8 },
  unreadable: { backgroundColor: colors.white, borderRadius: radii.lg, padding: 22, alignItems: "center", gap: 14, borderWidth: 2, borderColor: colors.warning }, unreadableTitle: { color: colors.text, fontSize: 25, fontWeight: "900" }, unreadableText: { color: colors.textSecondary, fontSize: 18, lineHeight: 26, textAlign: "center" }, uploadError: { color: colors.danger, fontSize: 16, lineHeight: 22, fontWeight: "800", textAlign: "center" }, manualLink: { minHeight: 60, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16 }, manualText: { color: colors.primary, fontSize: 17, fontWeight: "800" },
  manualForm: { backgroundColor: colors.white, borderRadius: radii.lg, padding: 18, gap: 12 }, sectionTitle: { color: colors.text, fontSize: 23, fontWeight: "900", marginBottom: 4 }, inputLabel: { color: colors.text, fontSize: 16, fontWeight: "800", marginBottom: 6 }, input: { minHeight: 60, backgroundColor: colors.background, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 14, color: colors.text, fontSize: 18 },
  backdrop: { flex: 1, backgroundColor: "rgba(14,43,74,0.45)", justifyContent: "flex-end" }, sheet: { minHeight: "52%", backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, alignItems: "center", justifyContent: "center", gap: 15 }, handle: { position: "absolute", top: 12, width: 54, height: 5, borderRadius: 3, backgroundColor: colors.border }, sheetTitle: { color: colors.text, fontSize: 27, fontWeight: "900", textAlign: "center" }, sheetText: { color: colors.textSecondary, fontSize: 18, lineHeight: 26, textAlign: "center", marginBottom: 8 },
});