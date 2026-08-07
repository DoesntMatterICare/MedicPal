import * as Haptics from "expo-haptics";
import { Phone, ShieldAlert, Stethoscope, UserRound, X } from "lucide-react-native";
import React, { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { BigButton } from "@/components/BigButton";
import { HealthSheet } from "@/components/HealthSheet";
import { router } from "expo-router";
import { useApp } from "@/src/context/AppContext";
import { colors } from "@/src/theme";

export function EmergencyButton({ testID }: { testID: string }) {
  const { profile, speak } = useApp();
  const [open, setOpen] = useState(false);
  const caregiverPhone = profile?.caregiverPhone?.trim() || "";
  const doctorPhone = profile?.doctorPhone?.trim() || "";
  const call = async (phone: string, label: string) => {
    if (!phone) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    speak(`Calling ${label}`);
    setOpen(false);
    await Linking.openURL(`tel:${phone.replace(/[^+\d]/g, "")}`);
  };
  return (
    <>
      <View style={styles.wrap} pointerEvents="box-none">
        <Pressable testID={testID} accessibilityRole="button" accessibilityLabel="Call caregiver or doctor" onPress={() => setOpen(true)} style={({ pressed }) => [styles.button, { transform: [{ scale: pressed ? 0.95 : 1 }] }]}>
          <Phone color={colors.white} size={27} fill={colors.white} />
          <Text style={styles.label}>Call</Text>
        </Pressable>
      </View>
      <HealthSheet visible={open} title="Who would you like to call?" onClose={() => setOpen(false)} testID="contact-call-sheet">
        <View testID="call-contact-privacy-note" style={styles.note}><Phone size={24} color={colors.primary} /><Text style={styles.noteText}>MedicPal opens your phone dialler only after you choose a saved contact.</Text></View>
        <BigButton testID="open-travel-sos-button" label="I feel unwell while travelling" icon={ShieldAlert} variant="danger" onPress={() => { setOpen(false); router.push("/sos"); }} />
        <View testID="caregiver-call-option" style={styles.contact}><View style={styles.contactIcon}><UserRound size={26} color={colors.primary} /></View><View style={styles.contactCopy}><Text style={styles.contactTitle}>Caregiver</Text><Text style={styles.contactValue}>{caregiverPhone || "No caregiver number saved"}</Text></View></View>
        <BigButton testID="call-caregiver-button" label="Call caregiver" icon={Phone} disabled={!caregiverPhone} onPress={() => call(caregiverPhone, "your caregiver")} />
        <View testID="doctor-call-option" style={styles.contact}><View style={styles.contactIcon}><Stethoscope size={26} color={colors.primary} /></View><View style={styles.contactCopy}><Text style={styles.contactTitle}>{profile?.doctorName?.trim() || "Family or personal doctor"}</Text><Text style={styles.contactValue}>{doctorPhone || "No doctor number saved"}</Text></View></View>
        <BigButton testID="call-doctor-button" label="Call doctor" icon={Phone} disabled={!doctorPhone} onPress={() => call(doctorPhone, profile?.doctorName?.trim() || "your doctor")} />
        {(!caregiverPhone || !doctorPhone) && <BigButton testID="open-contact-settings-button" label="Add missing contact" icon={Stethoscope} variant="secondary" onPress={() => { setOpen(false); router.push("/(tabs)/settings"); }} />}
        <BigButton testID="cancel-contact-call-button" label="Cancel" icon={X} variant="secondary" onPress={() => setOpen(false)} />
      </HealthSheet>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", right: 16, bottom: 96 },
  button: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.danger, justifyContent: "center", alignItems: "center", shadowColor: colors.danger, shadowOpacity: 0.3, shadowRadius: 12, elevation: 7 },
  label: { color: colors.white, fontSize: 12, fontWeight: "800" },
  note: { flexDirection: "row", gap: 12, backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 16 }, noteText: { flex: 1, color: colors.text, fontSize: 15, lineHeight: 22, fontWeight: "700" },
  contact: { minHeight: 78, flexDirection: "row", alignItems: "center", gap: 13, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 14 }, contactIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" }, contactCopy: { flex: 1 }, contactTitle: { color: colors.text, fontSize: 18, fontWeight: "900" }, contactValue: { color: colors.textSecondary, fontSize: 15, marginTop: 3 },
});