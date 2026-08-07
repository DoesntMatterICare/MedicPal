import { router } from "expo-router";
import { AlertTriangle, CheckCircle2, Clock3, Languages, MapPin, Phone, ShieldAlert, Stethoscope, UserRound, X } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BigButton } from "@/components/BigButton";
import { HealthSheet } from "@/components/HealthSheet";
import { ScreenHeader } from "@/components/ScreenHeader";
import { listMedicines } from "@/services/db";
import { cancelTravelCheckIn, getTravelCheckIn, parseArrival, scheduleTravelCheckIn, shareOneTimeSosLocation } from "@/services/sos";
import { useApp } from "@/src/context/AppContext";
import { colors, radii } from "@/src/theme";
import type { Medicine, TravelCheckIn } from "@/src/types";

function Detail({ label, value, testID }: { label: string; value: string; testID: string }) {
  return <View testID={testID} style={styles.detail}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value || "Not provided"}</Text></View>;
}

export default function SosScreen() {
  const { profile } = useApp(); const [medicines, setMedicines] = useState<Medicine[]>([]); const [medicalCard, setMedicalCard] = useState(false);
  const [locationStatus, setLocationStatus] = useState(""); const [sharing, setSharing] = useState(false); const [checkIn, setCheckIn] = useState<TravelCheckIn | null>(null);
  const [checkInSheet, setCheckInSheet] = useState(false); const [destination, setDestination] = useState(""); const [arrivalDate, setArrivalDate] = useState(""); const [arrivalTime, setArrivalTime] = useState(""); const [checkInError, setCheckInError] = useState("");
  const load = useCallback(() => { void Promise.all([listMedicines(), getTravelCheckIn()]).then(([items, saved]) => { setMedicines(items); setCheckIn(saved); }); }, []);
  useEffect(load, [load]);
  const overdue = Boolean(checkIn && new Date(checkIn.expectedAt).getTime() <= Date.now());
  const medicineText = useMemo(() => medicines.length ? medicines.map((item) => `${item.name} — ${item.dosage}`).join("\n") : "No saved medicines", [medicines]);
  const call = (number: string) => { if (number.trim()) void Linking.openURL(`tel:${number.replace(/[^+\d]/g, "")}`); };
  const shareLocation = async () => { setSharing(true); setLocationStatus(""); try { await shareOneTimeSosLocation(`I feel unwell while travelling. Please contact me. Emergency contact: ${profile?.caregiverPhone || "not provided"}.`); setLocationStatus("Location share sheet opened. MedicPal did not save your coordinates."); } catch (reason) { setLocationStatus(reason instanceof Error ? reason.message : "Location could not be shared."); } finally { setSharing(false); } };
  const schedule = async () => { const arrival = parseArrival(arrivalDate, arrivalTime); if (!destination.trim() || !arrival) { setCheckInError("Enter a destination, date as DD-MM-YYYY, and time as HH:MM."); return; } try { const saved = await scheduleTravelCheckIn(destination.trim(), arrival); setCheckIn(saved); setCheckInSheet(false); setCheckInError(""); } catch (reason) { setCheckInError(reason instanceof Error ? reason.message : "Check-in could not be scheduled."); } };
  const safe = async () => { await cancelTravelCheckIn(); setCheckIn(null); };
  return (
    <SafeAreaView testID="travel-sos-screen" style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader title="I feel unwell" subtitle="Offline help while travelling alone" testID="travel-sos-header" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View testID="sos-safety-message" style={styles.warning}><ShieldAlert size={36} color={colors.danger} /><View style={styles.flex}><Text style={styles.warningTitle}>Get help from a person nearby</Text><Text style={styles.warningText}>MedicPal does not diagnose. If this feels serious or life-threatening, call emergency services now.</Text></View></View>
        {overdue && <View testID="travel-check-in-overdue" style={styles.overdue}><AlertTriangle size={29} color={colors.danger} /><View style={styles.flex}><Text style={styles.overdueTitle}>Arrival check-in is overdue</Text><Text style={styles.overdueText}>You have not confirmed arrival at {checkIn?.destination}. Contact your caregiver if you need help.</Text></View></View>}
        <Text style={styles.sectionTitle}>Call for help</Text>
        <BigButton testID="sos-call-caregiver-button" label="Call caregiver" icon={UserRound} disabled={!profile?.caregiverPhone?.trim()} onPress={() => call(profile?.caregiverPhone || "")} />
        <BigButton testID="sos-call-doctor-button" label={`Call ${profile?.doctorName?.trim() || "doctor"}`} icon={Stethoscope} disabled={!profile?.doctorPhone?.trim()} onPress={() => call(profile?.doctorPhone || "")} />
        <BigButton testID="sos-call-emergency-button" label={`Call emergency services (${profile?.emergencyNumber || "112"})`} icon={Phone} variant="danger" onPress={() => call(profile?.emergencyNumber || "112")} />
        <BigButton testID="show-medical-card-button" label="Show this to a helper" icon={ShieldAlert} variant="secondary" onPress={() => setMedicalCard(true)} />
        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Share or check in</Text>
        <BigButton testID="share-sos-location-button" label="Share my current location" icon={MapPin} loading={sharing} onPress={shareLocation} />
        <Text testID="sos-location-privacy-note" style={styles.privacy}>Location permission is requested only after this tap. Coordinates are not saved or tracked.</Text>
        {!!locationStatus && <View testID="sos-location-status" style={styles.status}><Text style={styles.statusText}>{locationStatus}</Text></View>}
        {checkIn ? <View testID="active-travel-check-in" style={[styles.checkIn, overdue && styles.checkInOverdue]}><View style={styles.checkInTop}><Clock3 size={27} color={overdue ? colors.danger : colors.primary} /><View style={styles.flex}><Text style={styles.checkInTitle}>{checkIn.destination}</Text><Text style={styles.checkInText}>Expected {new Date(checkIn.expectedAt).toLocaleString([], { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })}</Text></View></View><BigButton testID="confirm-safe-arrival-button" label="I arrived safely" icon={CheckCircle2} onPress={safe} /><BigButton testID="cancel-travel-check-in-button" label="Cancel check-in" icon={X} variant="secondary" onPress={safe} /></View> : <BigButton testID="schedule-travel-check-in-button" label="Schedule arrival check-in" icon={Clock3} variant="secondary" onPress={() => setCheckInSheet(true)} />}
      </ScrollView>
      <HealthSheet visible={medicalCard} title="Show this to a helper" onClose={() => setMedicalCard(false)} testID="medical-helper-card-sheet">
        <View testID="medical-card-no-diagnosis-note" style={styles.cardNote}><ShieldAlert size={25} color={colors.primary} /><Text style={styles.cardNoteText}>These are only details you entered and medicines you saved. MedicPal has not inferred a diagnosis.</Text></View>
        <View testID="medical-helper-card" style={styles.medicalCard}><Text style={styles.cardName}>{profile?.medicalFullName || profile?.name || "Name not provided"}</Text><Detail testID="medical-card-dob" label="Date of birth" value={profile?.dateOfBirth || ""} /><Detail testID="medical-card-blood-group" label="Blood group" value={profile?.bloodGroup || ""} /><Detail testID="medical-card-allergies" label="Known allergies" value={profile?.allergies || ""} /><Detail testID="medical-card-conditions" label="Known conditions" value={profile?.medicalConditions || ""} /><Detail testID="medical-card-medicines" label="Saved medicines" value={medicineText} /><Detail testID="medical-card-caregiver" label="Caregiver" value={profile?.caregiverPhone || ""} /><Detail testID="medical-card-doctor" label={profile?.doctorName || "Doctor"} value={profile?.doctorPhone || ""} /><View style={styles.language}><Languages size={22} color={colors.primary} /><Text style={styles.languageText}>Preferred language: {profile?.preferredLanguage || "Not provided"}</Text></View></View>
        <BigButton testID="close-medical-card-button" label="Close medical card" icon={X} variant="secondary" onPress={() => setMedicalCard(false)} />
      </HealthSheet>
      <HealthSheet visible={checkInSheet} title="Schedule arrival check-in" onClose={() => setCheckInSheet(false)} testID="travel-check-in-sheet">
        <Text style={styles.formHelp}>MedicPal will remind you locally. It cannot automatically message anyone while the app is closed.</Text>
        {!!checkInError && <View testID="travel-check-in-error" style={styles.error}><Text style={styles.errorText}>{checkInError}</Text></View>}
        <View><Text style={styles.label}>Destination</Text><TextInput testID="travel-destination-input" value={destination} onChangeText={setDestination} placeholder="Example: Pune Station" placeholderTextColor={colors.textSecondary} style={styles.input} /></View>
        <View><Text style={styles.label}>Expected date</Text><TextInput testID="travel-arrival-date-input" value={arrivalDate} onChangeText={setArrivalDate} placeholder="DD-MM-YYYY" placeholderTextColor={colors.textSecondary} keyboardType="numbers-and-punctuation" maxLength={10} style={styles.input} /></View>
        <View><Text style={styles.label}>Expected time</Text><TextInput testID="travel-arrival-time-input" value={arrivalTime} onChangeText={setArrivalTime} placeholder="HH:MM" placeholderTextColor={colors.textSecondary} keyboardType="numbers-and-punctuation" maxLength={5} style={styles.input} /></View>
        <BigButton testID="save-travel-check-in-button" label="Set local check-in reminder" icon={Clock3} onPress={schedule} />
        <BigButton testID="cancel-check-in-form-button" label="Cancel" icon={X} variant="secondary" onPress={() => setCheckInSheet(false)} />
      </HealthSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, content: { padding: 18, paddingBottom: 36, gap: 14 }, flex: { flex: 1 }, warning: { flexDirection: "row", gap: 13, backgroundColor: "#FFF1EF", borderWidth: 2, borderColor: colors.danger, borderRadius: radii.lg, padding: 17 }, warningTitle: { color: colors.danger, fontSize: 20, fontWeight: "900" }, warningText: { color: colors.text, fontSize: 15, lineHeight: 22, marginTop: 4, fontWeight: "700" }, sectionTitle: { color: colors.text, fontSize: 22, fontWeight: "900", marginTop: 5 }, divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 }, privacy: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: "700", paddingHorizontal: 4 }, status: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: 13 }, statusText: { color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: "700" }, overdue: { flexDirection: "row", gap: 11, backgroundColor: "#FFF8EA", borderWidth: 1.5, borderColor: colors.warning, borderRadius: radii.lg, padding: 15 }, overdueTitle: { color: colors.danger, fontSize: 18, fontWeight: "900" }, overdueText: { color: colors.text, fontSize: 14, lineHeight: 20, marginTop: 3 }, checkIn: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.primary, borderRadius: radii.lg, padding: 16, gap: 12 }, checkInOverdue: { borderColor: colors.danger }, checkInTop: { flexDirection: "row", gap: 11, alignItems: "center" }, checkInTitle: { color: colors.text, fontSize: 19, fontWeight: "900" }, checkInText: { color: colors.textSecondary, fontSize: 14, marginTop: 3 },
  cardNote: { flexDirection: "row", gap: 10, backgroundColor: colors.card, borderRadius: radii.md, padding: 14 }, cardNoteText: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: "700" }, medicalCard: { backgroundColor: colors.white, borderWidth: 2, borderColor: colors.primary, borderRadius: radii.lg, padding: 18 }, cardName: { color: colors.text, fontSize: 27, fontWeight: "900", marginBottom: 10 }, detail: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }, detailLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: "800" }, detailValue: { color: colors.text, fontSize: 17, lineHeight: 24, fontWeight: "800", marginTop: 3 }, language: { flexDirection: "row", gap: 8, alignItems: "center", paddingTop: 13 }, languageText: { color: colors.text, fontSize: 16, fontWeight: "800" }, formHelp: { color: colors.text, fontSize: 15, lineHeight: 22, fontWeight: "700", backgroundColor: colors.card, borderRadius: radii.md, padding: 14 }, error: { backgroundColor: "#FFF1EF", borderRadius: radii.md, padding: 13 }, errorText: { color: colors.danger, fontSize: 15, fontWeight: "800" }, label: { color: colors.text, fontSize: 16, fontWeight: "900", marginBottom: 7 }, input: { minHeight: 58, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 14, color: colors.text, fontSize: 17 },
});