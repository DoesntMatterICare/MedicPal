import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { FilePlus2, FileText, LockKeyhole, Save, Trash2, Upload } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BigButton } from "@/components/BigButton";
import { HealthSheet } from "@/components/HealthSheet";
import { ScreenHeader } from "@/components/ScreenHeader";
import { deleteVaultDocument, listVaultDocuments, saveVaultDocument } from "@/services/db";
import { chooseMedicineImage } from "@/services/images";
import { colors, radii } from "@/src/theme";
import type { DocumentCategory, VaultDocument } from "@/src/types";

const categories: DocumentCategory[] = ["Prescription", "Lab result", "Scan report", "Other"];

export default function VaultScreen() {
  const { width } = useWindowDimensions(); const cardWidth = Math.max(150, (width - 54) / 2);
  const [items, setItems] = useState<VaultDocument[]>([]); const [open, setOpen] = useState(false); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  const [form, setForm] = useState<{ title: string; category: DocumentCategory; imageBase64: string }>({ title: "", category: "Prescription", imageBase64: "" });
  const load = useCallback(() => { void listVaultDocuments().then(setItems); }, []); useFocusEffect(useCallback(() => { load(); }, [load]));
  const chooseImage = async () => { try { const image = await chooseMedicineImage(); if (image) setForm((value) => ({ ...value, imageBase64: image.base64 })); } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not prepare this document photo."); } };
  const submit = async () => {
    if (!form.title.trim() || !form.imageBase64) { setError("Add a title and choose a document photo."); return; }
    setSaving(true); const now = new Date().toISOString();
    const item: VaultDocument = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title: form.title.trim(), category: form.category, imageBase64: form.imageBase64, mimeType: "image/jpeg", documentDate: now, createdAt: now };
    await saveVaultDocument(item); setItems((current) => [item, ...current]); setForm({ title: "", category: "Prescription", imageBase64: "" }); setError(""); setSaving(false); setOpen(false);
  };
  return (
    <SafeAreaView testID="document-vault-screen" style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader title="Document vault" subtitle="Prescriptions and health records, kept local" testID="vault-header" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View testID="vault-local-security-note" style={styles.security}><View style={styles.lock}><LockKeyhole size={26} color={colors.primary} /></View><View style={styles.securityCopy}><Text style={styles.securityTitle}>Private on this device</Text><Text style={styles.securityText}>Photos are compressed and stored locally. MedicPal does not upload vault documents.</Text></View></View>
        <BigButton testID="add-vault-document-button" label="Add a document" icon={FilePlus2} onPress={() => setOpen(true)} />
        <Text testID="vault-documents-heading" style={styles.heading}>Saved documents</Text>
        {!items.length ? <View testID="vault-empty-state" style={styles.empty}><FileText size={50} color={colors.primary} /><Text style={styles.emptyTitle}>Your vault is empty</Text><Text style={styles.emptyText}>Save a clear photo of a prescription, report, or other health record.</Text></View> : <View testID="vault-document-grid" style={styles.grid}>{items.map((item) => <View testID={`vault-document-${item.id}`} key={item.id} style={[styles.card, { width: cardWidth }]}><Image testID={`vault-document-image-${item.id}`} source={{ uri: `data:${item.mimeType};base64,${item.imageBase64}` }} style={styles.image} contentFit="cover" /><View style={styles.cardCopy}><Text testID={`vault-document-title-${item.id}`} numberOfLines={2} style={styles.cardTitle}>{item.title}</Text><Text testID={`vault-document-category-${item.id}`} style={styles.category}>{item.category}</Text><Text style={styles.date}>{new Date(item.documentDate).toLocaleDateString()}</Text></View><Pressable testID={`delete-vault-document-${item.id}`} accessibilityLabel={`Delete ${item.title}`} onPress={async () => { await deleteVaultDocument(item.id); setItems((current) => current.filter((value) => value.id !== item.id)); }} style={styles.delete}><Trash2 size={20} color={colors.danger} /></Pressable></View>)}</View>}
      </ScrollView>
      <HealthSheet visible={open} title="Add to your vault" onClose={() => setOpen(false)} testID="vault-document-form-sheet">
        {!!error && <View testID="vault-document-form-error" style={styles.error}><Text style={styles.errorText}>{error}</Text></View>}
        <Pressable testID="choose-vault-document-photo-button" onPress={chooseImage} style={({ pressed }) => [styles.picker, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>{form.imageBase64 ? <Image testID="vault-document-preview" source={{ uri: `data:image/jpeg;base64,${form.imageBase64}` }} style={styles.preview} contentFit="cover" /> : <><Upload size={34} color={colors.primary} /><Text style={styles.pickerTitle}>Choose document photo</Text><Text style={styles.pickerText}>Prescription, lab result, scan report, or record</Text></>}</Pressable>
        <View><Text style={styles.label}>Document title</Text><TextInput testID="vault-document-title-input" value={form.title} onChangeText={(title) => setForm((value) => ({ ...value, title }))} placeholder="Example: Blood test — March" placeholderTextColor={colors.textSecondary} style={styles.input} /></View>
        <View><Text style={styles.label}>Category</Text><View style={styles.categories}>{categories.map((category) => <Pressable testID={`vault-category-${category.toLowerCase().replace(/ /g, "-")}-button`} key={category} onPress={() => setForm((value) => ({ ...value, category }))} style={[styles.categoryButton, form.category === category && styles.categoryActive]}><Text style={[styles.categoryText, form.category === category && styles.categoryTextActive]}>{category}</Text></Pressable>)}</View></View>
        <BigButton testID="save-vault-document-button" label="Save privately" icon={Save} onPress={submit} loading={saving} disabled={!form.title.trim() || !form.imageBase64} />
      </HealthSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, content: { padding: 18, paddingBottom: 38, gap: 17 }, security: { flexDirection: "row", gap: 12, backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: 16 }, lock: { width: 50, height: 50, borderRadius: 17, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" }, securityCopy: { flex: 1 }, securityTitle: { color: colors.text, fontSize: 18, fontWeight: "900" }, securityText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 3 }, heading: { color: colors.text, fontSize: 22, fontWeight: "900", marginTop: 4 }, grid: { flexDirection: "row", flexWrap: "wrap", gap: 14 }, card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, overflow: "hidden" }, image: { width: "100%", height: 150, backgroundColor: colors.card }, cardCopy: { padding: 13, paddingBottom: 58 }, cardTitle: { color: colors.text, fontSize: 17, lineHeight: 21, fontWeight: "900" }, category: { color: colors.primary, fontSize: 13, fontWeight: "800", marginTop: 6 }, date: { color: colors.textSecondary, fontSize: 12, marginTop: 3 }, delete: { position: "absolute", right: 9, bottom: 9, width: 44, height: 44, borderRadius: 15, backgroundColor: "#FFF1EF", alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", gap: 9, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 28 }, emptyTitle: { color: colors.text, fontSize: 22, fontWeight: "900" }, emptyText: { color: colors.textSecondary, fontSize: 16, lineHeight: 23, textAlign: "center" }, error: { backgroundColor: "#FFF1EF", borderRadius: radii.md, padding: 13 }, errorText: { color: colors.danger, fontSize: 15, fontWeight: "800" }, picker: { minHeight: 180, backgroundColor: colors.white, borderWidth: 2, borderStyle: "dashed", borderColor: colors.primary, borderRadius: radii.lg, alignItems: "center", justifyContent: "center", overflow: "hidden", padding: 16 }, preview: { width: "100%", height: 210, borderRadius: radii.md }, pickerTitle: { color: colors.text, fontSize: 18, fontWeight: "900", marginTop: 10 }, pickerText: { color: colors.textSecondary, fontSize: 14, textAlign: "center", marginTop: 4 }, label: { color: colors.text, fontSize: 16, fontWeight: "900", marginBottom: 8 }, input: { minHeight: 58, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 14, color: colors.text, fontSize: 16 }, categories: { flexDirection: "row", flexWrap: "wrap", gap: 9 }, categoryButton: { minHeight: 48, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 14, alignItems: "center", justifyContent: "center" }, categoryActive: { backgroundColor: colors.primary, borderColor: colors.primary }, categoryText: { color: colors.text, fontSize: 14, fontWeight: "800" }, categoryTextActive: { color: colors.white },
});