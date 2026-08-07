import { useFocusEffect, router } from "expo-router";
import { CalendarDays, Camera, FolderLock, HeartPulse, History, ShieldAlert, ShieldCheck } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BigButton } from "@/components/BigButton";
import { EmergencyButton } from "@/components/EmergencyButton";
import { HealthActionCard } from "@/components/HealthActionCard";
import { MedicineCard } from "@/components/MedicineCard";
import { Speakable } from "@/components/Speakable";
import { listMedicines, saveMedicine } from "@/services/db";
import { useApp } from "@/src/context/AppContext";
import { colors, radii } from "@/src/theme";
import type { Medicine } from "@/src/types";

export default function HomeScreen() {
  const { profile, fontSize, speak } = useApp();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const load = useCallback(() => { void listMedicines().then(setMedicines); }, []);
  useFocusEffect(load);

  const toggleTaken = async (medicine: Medicine) => {
    const next = { ...medicine, schedule: medicine.schedule.map((item, index) => index === 0 ? { ...item, taken: !item.taken } : item) };
    await saveMedicine(next);
    setMedicines((items) => items.map((item) => item.id === next.id ? next : item));
    speak(next.schedule[0]?.taken ? `${next.name} marked as taken` : `${next.name} marked as not taken`);
  };
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const date = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.brandRow}><View style={styles.logo}><ShieldCheck color={colors.white} size={25} /></View><Text style={styles.brand}>MedicPal</Text></View>
        <Speakable text={`${greeting}, ${profile?.name || "Friend"}. ${date}`} testID="home-greeting-speak-button">
          <Text style={[styles.greeting, { fontSize: Math.max(26, fontSize + 8) }]}>{greeting},{"\n"}{profile?.name || "Friend"}</Text>
          <View style={styles.dateRow}><CalendarDays size={20} color={colors.textSecondary} /><Text style={styles.date}>{date}</Text></View>
        </Speakable>
      </View>
      <FlatList
        testID="today-medicines-list"
        data={medicines}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<View testID="health-tools-section" style={styles.tools}><BigButton testID="home-travel-sos-button" label="I feel unwell while travelling" icon={ShieldAlert} variant="danger" onPress={() => router.push("/sos")} /><View><Text testID="health-tools-heading" style={[styles.sectionTitle, { fontSize: Math.max(22, fontSize + 4) }]}>Your health organizer</Text><Text style={styles.sectionSubtitle}>Keep useful details together for your next visit.</Text></View><HealthActionCard testID="open-symptom-logger-button" title="Log a symptom" description="Record changes and prepare questions for your doctor." icon={HeartPulse} accent="orange" onPress={() => router.push("/symptoms")} /><HealthActionCard testID="open-health-timeline-button" title="Health timeline" description="See medicines, symptoms, visits, and records by date." icon={History} onPress={() => router.push("/timeline")} /><HealthActionCard testID="open-document-vault-button" title="Document vault" description="Keep prescriptions and health documents on this device." icon={FolderLock} onPress={() => router.push("/vault")} /><Text testID="today-medicines-heading" style={[styles.sectionTitle, styles.medicineHeading, { fontSize: Math.max(22, fontSize + 4) }]}>Today&apos;s medicines</Text></View>}
        renderItem={({ item }) => <MedicineCard medicine={item} onOpen={() => router.push(`/medicine/${item.id}`)} onToggle={() => toggleTaken(item)} />}
        ListEmptyComponent={
          <View testID="empty-medicines-state" style={styles.empty}>
            <View style={styles.cameraCircle}><Camera size={52} color={colors.primary} /></View>
            <Text style={styles.emptyTitle}>Your medicine list is ready</Text>
            <Text style={styles.emptyText}>Photograph a medicine label. MedicPal will read it and prepare reminders for you.</Text>
            <BigButton testID="empty-scan-medicine-button" label="Scan your first medicine" icon={Camera} onPress={() => router.push("/scan/camera")} style={styles.scanButton} />
          </View>
        }
      />
      <EmergencyButton testID="home-contact-call-button" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.background },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 16 },
  logo: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  brand: { color: colors.primary, fontSize: 21, fontWeight: "900" },
  greeting: { color: colors.text, lineHeight: 34, fontWeight: "900" },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  date: { color: colors.textSecondary, fontSize: 17, fontWeight: "700" },
  list: { padding: 20, paddingBottom: 130, gap: 14 }, tools: { gap: 13, marginBottom: 5 },
  sectionTitle: { color: colors.text, fontWeight: "900", marginBottom: 4 },
  sectionSubtitle: { color: colors.textSecondary, fontSize: 16, lineHeight: 22 }, medicineHeading: { marginTop: 11 },
  empty: { backgroundColor: colors.white, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: 24, alignItems: "center", marginTop: 8 },
  cameraCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.card, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  emptyTitle: { color: colors.text, fontSize: 23, fontWeight: "900", textAlign: "center" },
  emptyText: { color: colors.textSecondary, fontSize: 18, lineHeight: 26, textAlign: "center", marginTop: 10 },
  scanButton: { marginTop: 22, width: "100%" },
});