import { useFocusEffect } from "expo-router";
import { CalendarPlus, CalendarDays, FileText, Pill, Save, Stethoscope } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BigButton } from "@/components/BigButton";
import { HealthSheet } from "@/components/HealthSheet";
import { ScreenHeader } from "@/components/ScreenHeader";
import { listAppointments, listMedicines, listSymptoms, listVaultDocuments, saveAppointment } from "@/services/db";
import { colors, radii } from "@/src/theme";
import type { HealthAppointment, Medicine, SymptomLog, TimelineEvent, VaultDocument } from "@/src/types";

const iconMap = { symptom: Stethoscope, medicine: Pill, document: FileText, appointment: CalendarDays };

export default function TimelineScreen() {
  const [symptoms, setSymptoms] = useState<SymptomLog[]>([]); const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [documents, setDocuments] = useState<VaultDocument[]>([]); const [appointments, setAppointments] = useState<HealthAppointment[]>([]);
  const [open, setOpen] = useState(false); const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", clinician: "", date: "", time: "", notes: "" });
  const load = useCallback(() => { void Promise.all([listSymptoms(), listMedicines(), listVaultDocuments(), listAppointments()]).then(([s, m, d, a]) => { setSymptoms(s); setMedicines(m); setDocuments(d); setAppointments(a); }); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const events = useMemo<TimelineEvent[]>(() => [
    ...symptoms.map((item) => ({ id: item.id, type: "symptom" as const, title: item.symptom, description: `Severity ${item.severity}/10 · ${item.duration}`, date: item.occurredAt })),
    ...medicines.map((item) => ({ id: item.id, type: "medicine" as const, title: item.name, description: `${item.dosage} · ${item.frequency}`, date: item.createdAt })),
    ...documents.map((item) => ({ id: item.id, type: "document" as const, title: item.title, description: item.category, date: item.documentDate })),
    ...appointments.map((item) => ({ id: item.id, type: "appointment" as const, title: item.title, description: item.clinician || "Appointment", date: item.appointmentAt })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [appointments, documents, medicines, symptoms]);

  const addAppointment = async () => {
    if (!form.title.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(form.date) || !/^\d{2}:\d{2}$/.test(form.time)) { setError("Add a title, date as YYYY-MM-DD, and time as HH:MM."); return; }
    const appointmentAt = new Date(`${form.date}T${form.time}:00`);
    if (Number.isNaN(appointmentAt.getTime())) { setError("Enter a valid appointment date and time."); return; }
    const item: HealthAppointment = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title: form.title.trim(), clinician: form.clinician.trim(), notes: form.notes.trim(), appointmentAt: appointmentAt.toISOString(), createdAt: new Date().toISOString() };
    await saveAppointment(item); setAppointments((current) => [item, ...current]); setForm({ title: "", clinician: "", date: "", time: "", notes: "" }); setError(""); setOpen(false);
  };
  return (
    <SafeAreaView testID="health-timeline-screen" style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader title="Health timeline" subtitle="Medicines, symptoms, visits, and documents" testID="timeline-header" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BigButton testID="add-appointment-button" label="Add appointment" icon={CalendarPlus} variant="secondary" onPress={() => setOpen(true)} />
        {!events.length ? <View testID="timeline-empty-state" style={styles.empty}><CalendarDays size={48} color={colors.primary} /><Text style={styles.emptyTitle}>Your timeline is ready</Text><Text style={styles.emptyText}>Logged symptoms, saved medicines, appointments, and vault documents will appear here in date order.</Text></View> : <View testID="timeline-events-list" style={styles.timeline}>{events.map((event, index) => { const Icon = iconMap[event.type]; return <View testID={`timeline-event-${event.type}-${event.id}`} key={`${event.type}-${event.id}`} style={styles.event}><View style={styles.rail}>{index < events.length - 1 && <View style={styles.line} />}<View style={styles.node}><Icon size={21} color={colors.primary} /></View></View><View style={styles.card}><Text testID={`timeline-event-title-${event.id}`} style={styles.title}>{event.title}</Text><Text testID={`timeline-event-description-${event.id}`} style={styles.description}>{event.description}</Text><Text testID={`timeline-event-date-${event.id}`} style={styles.date}>{new Date(event.date).toLocaleString()}</Text></View></View>; })}</View>}
      </ScrollView>
      <HealthSheet visible={open} title="Add appointment" onClose={() => setOpen(false)} testID="appointment-form-sheet">
        {!!error && <View testID="appointment-form-error" style={styles.error}><Text style={styles.errorText}>{error}</Text></View>}
        <View><Text style={styles.label}>Appointment title</Text><TextInput testID="appointment-title-input" value={form.title} onChangeText={(title) => setForm((value) => ({ ...value, title }))} placeholder="Example: GP follow-up" placeholderTextColor={colors.textSecondary} style={styles.input} /></View>
        <View><Text style={styles.label}>Clinician or clinic (optional)</Text><TextInput testID="appointment-clinician-input" value={form.clinician} onChangeText={(clinician) => setForm((value) => ({ ...value, clinician }))} placeholder="Name or clinic" placeholderTextColor={colors.textSecondary} style={styles.input} /></View>
        <View style={styles.row}><View style={styles.half}><Text style={styles.label}>Date</Text><TextInput testID="appointment-date-input" value={form.date} onChangeText={(date) => setForm((value) => ({ ...value, date }))} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textSecondary} style={styles.input} keyboardType="numbers-and-punctuation" /></View><View style={styles.half}><Text style={styles.label}>Time</Text><TextInput testID="appointment-time-input" value={form.time} onChangeText={(time) => setForm((value) => ({ ...value, time }))} placeholder="HH:MM" placeholderTextColor={colors.textSecondary} style={styles.input} keyboardType="numbers-and-punctuation" /></View></View>
        <View><Text style={styles.label}>Notes (optional)</Text><TextInput testID="appointment-notes-input" value={form.notes} onChangeText={(notes) => setForm((value) => ({ ...value, notes }))} placeholder="What to discuss or bring" placeholderTextColor={colors.textSecondary} style={[styles.input, styles.multiline]} multiline textAlignVertical="top" /></View>
        <BigButton testID="save-appointment-button" label="Save appointment" icon={Save} onPress={addAppointment} />
      </HealthSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, content: { padding: 18, paddingBottom: 38, gap: 18 }, timeline: { paddingTop: 4 }, event: { flexDirection: "row", minHeight: 122 }, rail: { width: 54, alignItems: "center" }, line: { position: "absolute", top: 48, bottom: 0, width: 3, backgroundColor: colors.border }, node: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.primary, alignItems: "center", justifyContent: "center" }, card: { flex: 1, alignSelf: "flex-start", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 16, marginBottom: 16 }, title: { color: colors.text, fontSize: 19, fontWeight: "900" }, description: { color: colors.textSecondary, fontSize: 15, lineHeight: 21, marginTop: 4 }, date: { color: colors.primary, fontSize: 13, fontWeight: "800", marginTop: 9 },
  empty: { alignItems: "center", gap: 10, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 28 }, emptyTitle: { color: colors.text, fontSize: 22, fontWeight: "900" }, emptyText: { color: colors.textSecondary, fontSize: 16, lineHeight: 23, textAlign: "center" }, error: { backgroundColor: "#FFF1EF", borderRadius: radii.md, padding: 13 }, errorText: { color: colors.danger, fontSize: 15, fontWeight: "800" }, label: { color: colors.text, fontSize: 16, fontWeight: "900", marginBottom: 8 }, input: { minHeight: 58, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 14, color: colors.text, fontSize: 16 }, row: { flexDirection: "row", gap: 10 }, half: { flex: 1 }, multiline: { minHeight: 100, paddingTop: 14 },
});