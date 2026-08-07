import { useFocusEffect } from "expo-router";
import { Activity, Plus, Save, Trash2 } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BigButton } from "@/components/BigButton";
import { HealthSheet } from "@/components/HealthSheet";
import { InsightCard } from "@/components/InsightCard";
import { ScreenHeader } from "@/components/ScreenHeader";
import { deleteSymptom, listSymptoms, saveSymptom } from "@/services/db";
import { requestSymptomInsight } from "@/services/health";
import { colors, radii } from "@/src/theme";
import type { SymptomLog } from "@/src/types";

const emptyForm = { symptom: "", severity: 5, duration: "", notes: "" };

export default function SymptomsScreen() {
  const [items, setItems] = useState<SymptomLog[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const load = useCallback(() => { void listSymptoms().then(setItems); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const submit = async () => {
    if (!form.symptom.trim() || !form.duration.trim()) { setMessage("Add the symptom and how long it has been happening."); return; }
    setSaving(true); setMessage("");
    let insight = null;
    try { insight = await requestSymptomInsight({ ...form, symptom: form.symptom.trim(), duration: form.duration.trim(), notes: form.notes.trim() }); }
    catch (reason) { setMessage(reason instanceof Error ? `Saved locally. ${reason.message}` : "Saved locally without an AI insight."); }
    const now = new Date().toISOString();
    const item: SymptomLog = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...form, symptom: form.symptom.trim(), duration: form.duration.trim(), notes: form.notes.trim(), occurredAt: now, createdAt: now, insight };
    await saveSymptom(item); setItems((current) => [item, ...current]); setForm(emptyForm); setOpen(false); setSaving(false);
  };

  return (
    <SafeAreaView testID="symptoms-screen" style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader title="Symptoms" subtitle="Private notes and non-diagnostic visit prep" testID="symptoms-header" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View testID="symptoms-privacy-note" style={styles.privacy}><Activity size={24} color={colors.primary} /><Text style={styles.privacyText}>Your symptom history stays on this device. AI receives only the entry you submit for an insight.</Text></View>
        {!!message && <View testID="symptoms-status-message" style={styles.message}><Text style={styles.messageText}>{message}</Text></View>}
        <BigButton testID="log-symptom-button" label="Log a symptom" icon={Plus} onPress={() => { setMessage(""); setOpen(true); }} />
        <Text testID="symptoms-history-heading" style={styles.sectionTitle}>Recent symptom logs</Text>
        {!items.length ? <View testID="symptoms-empty-state" style={styles.empty}><Activity size={46} color={colors.primary} /><Text style={styles.emptyTitle}>No symptoms logged</Text><Text style={styles.emptyText}>Add a symptom when you want a clear record for your next appointment.</Text></View> : items.map((item) => (
          <View testID={`symptom-card-${item.id}`} key={item.id} style={styles.item}>
            <View style={styles.itemTop}><View style={styles.copy}><Text testID={`symptom-name-${item.id}`} style={styles.itemTitle}>{item.symptom}</Text><Text testID={`symptom-meta-${item.id}`} style={styles.meta}>Severity {item.severity}/10 · {item.duration}</Text></View><Pressable testID={`delete-symptom-${item.id}`} accessibilityLabel={`Delete ${item.symptom}`} onPress={async () => { await deleteSymptom(item.id); setItems((current) => current.filter((value) => value.id !== item.id)); }} style={styles.delete}><Trash2 size={21} color={colors.danger} /></Pressable></View>
            {!!item.notes && <Text testID={`symptom-notes-${item.id}`} style={styles.notes}>{item.notes}</Text>}
            <Text style={styles.date}>{new Date(item.occurredAt).toLocaleString()}</Text>
            {item.insight && <InsightCard insight={item.insight} testID={`symptom-insight-${item.id}`} />}
          </View>
        ))}
      </ScrollView>
      <HealthSheet visible={open} title="Log a symptom" onClose={() => setOpen(false)} testID="symptom-form-sheet">
        <View><Text style={styles.label}>What are you feeling?</Text><TextInput testID="symptom-name-input" value={form.symptom} onChangeText={(symptom) => setForm((value) => ({ ...value, symptom }))} placeholder="Example: headache" placeholderTextColor={colors.textSecondary} style={styles.input} maxLength={120} /></View>
        <View><Text style={styles.label}>Severity: {form.severity}/10</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.severityRow}>{[1,2,3,4,5,6,7,8,9,10].map((level) => <Pressable testID={`symptom-severity-${level}-button`} key={level} onPress={() => setForm((value) => ({ ...value, severity: level }))} style={[styles.severity, form.severity === level && styles.severityActive]}><Text style={[styles.severityText, form.severity === level && styles.severityTextActive]}>{level}</Text></Pressable>)}</ScrollView></View>
        <View><Text style={styles.label}>How long?</Text><TextInput testID="symptom-duration-input" value={form.duration} onChangeText={(duration) => setForm((value) => ({ ...value, duration }))} placeholder="Example: 2 days" placeholderTextColor={colors.textSecondary} style={styles.input} maxLength={80} /></View>
        <View><Text style={styles.label}>Extra notes (optional)</Text><TextInput testID="symptom-notes-input" value={form.notes} onChangeText={(notes) => setForm((value) => ({ ...value, notes }))} placeholder="Triggers, timing, or anything you noticed" placeholderTextColor={colors.textSecondary} style={[styles.input, styles.multiline]} multiline maxLength={600} textAlignVertical="top" /></View>
        <Text testID="symptom-ai-disclaimer" style={styles.disclaimer}>AI creates visit-prep notes only. It does not diagnose or replace medical care.</Text>
        <BigButton testID="save-symptom-button" label="Save and prepare insight" icon={Save} onPress={submit} loading={saving} disabled={!form.symptom.trim() || !form.duration.trim()} />
      </HealthSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, content: { padding: 18, paddingBottom: 38, gap: 16 },
  privacy: { flexDirection: "row", gap: 12, backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: 16 }, privacyText: { flex: 1, color: colors.text, fontSize: 15, lineHeight: 22, fontWeight: "700" },
  message: { backgroundColor: "#FFF8EA", borderWidth: 1, borderColor: "#EBCB86", borderRadius: radii.md, padding: 14 }, messageText: { color: colors.text, fontSize: 15, lineHeight: 21, fontWeight: "700" },
  sectionTitle: { color: colors.text, fontSize: 22, fontWeight: "900", marginTop: 6 }, empty: { alignItems: "center", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 26, gap: 9 }, emptyTitle: { color: colors.text, fontSize: 21, fontWeight: "900" }, emptyText: { color: colors.textSecondary, fontSize: 16, lineHeight: 23, textAlign: "center" },
  item: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 17, gap: 11 }, itemTop: { flexDirection: "row", gap: 10 }, copy: { flex: 1 }, itemTitle: { color: colors.text, fontSize: 21, fontWeight: "900" }, meta: { color: colors.primary, fontSize: 15, fontWeight: "800", marginTop: 3 }, notes: { color: colors.text, fontSize: 16, lineHeight: 23 }, date: { color: colors.textSecondary, fontSize: 13, fontWeight: "700" }, delete: { width: 48, height: 48, borderRadius: 16, backgroundColor: "#FFF1EF", alignItems: "center", justifyContent: "center" },
  label: { color: colors.text, fontSize: 16, fontWeight: "900", marginBottom: 8 }, input: { minHeight: 58, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 15, color: colors.text, fontSize: 17 }, multiline: { minHeight: 112, paddingTop: 14 }, severityRow: { gap: 8 }, severity: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, alignItems: "center", justifyContent: "center" }, severityActive: { backgroundColor: colors.primary, borderColor: colors.primary }, severityText: { color: colors.text, fontSize: 17, fontWeight: "900" }, severityTextActive: { color: colors.white }, disclaimer: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: "700" },
});