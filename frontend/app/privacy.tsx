import { useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import { router, useFocusEffect } from "expo-router";
import { ArrowLeft, Bell, CalendarSync, Camera as CameraIcon, CheckCircle2, Database, HardDrive, Image as ImageIcon, LockKeyhole, RefreshCw, Settings, Trash2, X } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BigButton } from "@/components/BigButton";
import { clearLocalAppData, getCalendarQueue, listMedicines } from "@/services/db";
import { syncCalendarQueue } from "@/services/calendar";
import { useApp } from "@/src/context/AppContext";
import { colors, radii } from "@/src/theme";

type PermissionState = { status: string; canAskAgain: boolean };
const unknown: PermissionState = { status: "checking", canAskAgain: true };

function StatusPill({ label, attention = false }: { label: string; attention?: boolean }) {
  return <View style={[styles.pill, { borderColor: attention ? colors.warning : colors.primary }]}><Text style={[styles.pillText, { color: attention ? colors.warning : colors.primary }]}>{label}</Text></View>;
}

function DataCard({ icon: Icon, title, value, description }: { icon: typeof Database; title: string; value: string; description: string }) {
  return <View style={styles.dataCard}><View style={styles.icon}><Icon size={25} color={colors.primary} /></View><View style={styles.cardText}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.cardDescription}>{description}</Text></View><Text style={styles.value}>{value}</Text></View>;
}

export default function PrivacyScreen() {
  const { profile, clearProfile, speak } = useApp();
  const [medicineCount, setMedicineCount] = useState(0);
  const [photoCount, setPhotoCount] = useState(0);
  const [queueCount, setQueueCount] = useState(0);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [photos, setPhotos] = useState<PermissionState>(unknown);
  const [notifications, setNotifications] = useState<PermissionState>(unknown);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    const [medicines, queue, photoPermission, notificationPermission] = await Promise.all([
      listMedicines(), getCalendarQueue(), ImagePicker.getMediaLibraryPermissionsAsync(), Notifications.getPermissionsAsync(),
    ]);
    setMedicineCount(medicines.length);
    setPhotoCount(medicines.filter((item) => Boolean(item.photoUri)).length);
    setQueueCount(queue.length);
    setPhotos({ status: photoPermission.status, canAskAgain: photoPermission.canAskAgain });
    setNotifications({ status: notificationPermission.status, canAskAgain: notificationPermission.canAskAgain });
  }, []);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const managePermission = async (kind: "camera" | "photos" | "notifications", state: PermissionState) => {
    if (!state.canAskAgain && state.status !== "granted") return Linking.openSettings();
    if (kind === "camera") await requestCameraPermission();
    if (kind === "photos") await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (kind === "notifications") await Notifications.requestPermissionsAsync();
    await refresh();
  };

  const syncNow = async () => {
    setSyncing(true);
    await syncCalendarQueue(profile?.accessToken);
    await refresh();
    setSyncing(false);
    speak(queueCount ? "Calendar sync checked" : "Calendar is up to date");
  };

  const deleteAll = async () => {
    setDeleting(true);
    await Notifications.cancelAllScheduledNotificationsAsync().catch(() => undefined);
    await clearLocalAppData();
    await clearProfile();
    speak("All local MedicPal information has been deleted");
    setConfirmDelete(false);
    router.replace("/onboarding/language");
  };

  const cameraState: PermissionState = cameraPermission ? { status: cameraPermission.status, canAskAgain: cameraPermission.canAskAgain } : unknown;
  const permissionRows = [
    { key: "camera" as const, Icon: CameraIcon, title: "Camera", state: cameraState },
    { key: "photos" as const, Icon: ImageIcon, title: "Photo library", state: photos },
    { key: "notifications" as const, Icon: Bell, title: "Medicine reminders", state: notifications },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}><Pressable testID="privacy-back-button" onPress={() => router.back()} style={styles.back}><ArrowLeft size={23} color={colors.text} /><Text style={styles.backText}>Back</Text></Pressable><Text style={styles.headerTitle}>Privacy</Text><View style={styles.headerSpace} /></View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}><View style={styles.heroIcon}><LockKeyhole size={38} color={colors.white} /></View><Text style={styles.heroTitle}>Your information, clearly explained</Text><Text style={styles.heroText}>MedicPal stores medicine records on this device. Photos are sent for AI analysis and are not saved by the MedicPal server.</Text></View>

        <Text style={styles.sectionTitle}>Stored on this device</Text>
        <DataCard icon={Database} title="Medicine records" value={`${medicineCount}`} description="Saved locally for offline access" />
        <DataCard icon={ImageIcon} title="Medicine photos" value={`${photoCount}`} description="Local visual references" />
        <DataCard icon={HardDrive} title="Pending operations" value={`${queueCount}`} description="Calendar changes waiting to sync" />

        <Text style={styles.sectionTitle}>Google Calendar</Text>
        <View style={styles.syncCard}><View style={styles.syncTop}><CalendarSync size={28} color={colors.primary} /><View style={styles.cardText}><Text style={styles.cardTitle}>Calendar sync</Text><Text style={styles.cardDescription}>{profile?.accessToken ? "Connected with your Google permission" : "Not connected in this login session"}</Text></View><StatusPill label={profile?.accessToken ? (queueCount ? `${queueCount} pending` : "Up to date") : "Offline only"} attention={Boolean(queueCount) || !profile?.accessToken} /></View>{Boolean(profile?.accessToken) && <BigButton testID="privacy-sync-now-button" label="Sync now" icon={RefreshCw} variant="secondary" loading={syncing} onPress={syncNow} />}</View>

        <Text style={styles.sectionTitle}>Permission controls</Text>
        {permissionRows.map(({ key, Icon, title, state }) => (
          <View key={key} style={styles.permissionRow}><View style={styles.icon}><Icon size={25} color={colors.primary} /></View><View style={styles.cardText}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.cardDescription}>{state.status === "granted" ? "Allowed" : state.canAskAgain ? "Not allowed" : "Blocked in device settings"}</Text></View><Pressable testID={`privacy-${key}-permission-button`} onPress={() => managePermission(key, state)} style={styles.manage}><Settings size={19} color={colors.primary} /><Text style={styles.manageText}>{state.status === "granted" ? "Manage" : state.canAskAgain ? "Allow" : "Settings"}</Text></Pressable></View>
        ))}

        <View style={styles.photoPolicy}><CheckCircle2 size={25} color={colors.primary} /><View style={styles.cardText}><Text style={styles.cardTitle}>Photos are analysis-only</Text><Text style={styles.cardDescription}>The server sends the photo to Gemini to read visible text, returns structured evidence, and does not write the photo to its database.</Text></View></View>

        <Text style={styles.sectionTitle}>Delete local information</Text>
        <Text style={styles.deleteNote}>This removes medicine records, local photos, queued Calendar operations, reminders, language, and settings from this device. Existing Google Calendar events are not removed.</Text>
        <BigButton testID="privacy-delete-all-button" label="Delete all local information" icon={Trash2} variant="danger" onPress={() => { speak("Are you sure you want to delete all local information?"); setConfirmDelete(true); }} />
      </ScrollView>

      <Modal visible={confirmDelete} transparent animationType="slide" onRequestClose={() => setConfirmDelete(false)}><View style={styles.backdrop}><View style={styles.sheet}><View style={styles.handle} /><Trash2 size={52} color={colors.danger} /><Text style={styles.sheetTitle}>Delete all local information?</Text><Text style={styles.sheetText}>This cannot be undone. Existing events in Google Calendar will remain.</Text><BigButton testID="privacy-confirm-delete-all-button" label="Yes, delete everything" icon={Trash2} variant="danger" loading={deleting} onPress={deleteAll} /><BigButton testID="privacy-cancel-delete-all-button" label="No, keep my information" icon={X} variant="secondary" onPress={() => setConfirmDelete(false)} /></View></View></Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { minHeight: 70, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { minHeight: 60, minWidth: 82, flexDirection: "row", alignItems: "center", gap: 5 }, backText: { color: colors.text, fontSize: 17, fontWeight: "800" }, headerTitle: { color: colors.text, fontSize: 21, fontWeight: "900" }, headerSpace: { width: 82 },
  content: { padding: 20, paddingBottom: 36, gap: 13 },
  hero: { backgroundColor: colors.primary, borderRadius: radii.lg, padding: 22, alignItems: "center" }, heroIcon: { width: 66, height: 66, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" }, heroTitle: { color: colors.white, fontSize: 24, fontWeight: "900", textAlign: "center", marginTop: 13 }, heroText: { color: colors.white, fontSize: 17, lineHeight: 25, textAlign: "center", marginTop: 8 },
  sectionTitle: { color: colors.text, fontSize: 22, fontWeight: "900", marginTop: 10 },
  dataCard: { minHeight: 88, backgroundColor: colors.white, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }, icon: { width: 50, height: 50, borderRadius: 16, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" }, cardText: { flex: 1 }, cardTitle: { color: colors.text, fontSize: 18, fontWeight: "900" }, cardDescription: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 3 }, value: { color: colors.primary, fontSize: 26, fontWeight: "900" },
  syncCard: { backgroundColor: colors.white, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: 15, gap: 14 }, syncTop: { flexDirection: "row", alignItems: "center", gap: 11 }, pill: { minHeight: 36, borderRadius: 18, borderWidth: 1.5, paddingHorizontal: 10, alignItems: "center", justifyContent: "center" }, pillText: { fontSize: 13, fontWeight: "900" },
  permissionRow: { minHeight: 88, backgroundColor: colors.white, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: 13, flexDirection: "row", alignItems: "center", gap: 10 }, manage: { minHeight: 60, minWidth: 76, alignItems: "center", justifyContent: "center" }, manageText: { color: colors.primary, fontSize: 13, fontWeight: "900", marginTop: 3 },
  photoPolicy: { backgroundColor: colors.card, borderRadius: radii.lg, padding: 16, flexDirection: "row", gap: 12, alignItems: "flex-start" }, deleteNote: { color: colors.textSecondary, fontSize: 16, lineHeight: 23 },
  backdrop: { flex: 1, backgroundColor: "rgba(26,58,92,0.45)", justifyContent: "flex-end" }, sheet: { minHeight: "52%", backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, alignItems: "center", justifyContent: "center", gap: 15 }, handle: { position: "absolute", top: 12, width: 54, height: 5, borderRadius: 3, backgroundColor: colors.border }, sheetTitle: { color: colors.text, fontSize: 27, fontWeight: "900", textAlign: "center" }, sheetText: { color: colors.textSecondary, fontSize: 18, lineHeight: 26, textAlign: "center", marginBottom: 8 },
});