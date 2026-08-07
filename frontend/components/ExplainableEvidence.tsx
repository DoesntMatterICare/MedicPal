import React, { useEffect, useState } from "react";
import { Image, LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import { AlertTriangle, ScanSearch } from "lucide-react-native";
import { colors, radii } from "@/src/theme";
import type { EvidenceItem } from "@/src/types";

const labels: Record<EvidenceItem["field"], string> = {
  medicine_name: "Medicine name",
  expiry_date: "Expiry date",
  dosage: "Dosage",
  frequency_hint: "Frequency",
};

export function ExplainableEvidence({ photoUri, evidence }: { photoUri: string; evidence: EvidenceItem[] }) {
  const [frame, setFrame] = useState({ width: 1, height: 220 });
  const [image, setImage] = useState({ width: 1, height: 1 });
  useEffect(() => {
    Image.getSize(photoUri, (width, height) => setImage({ width, height }), () => setImage({ width: 1, height: 1 }));
  }, [photoUri]);
  const onLayout = (event: LayoutChangeEvent) => setFrame(event.nativeEvent.layout);
  const scale = Math.min(frame.width / image.width, frame.height / image.height);
  const rendered = { width: image.width * scale, height: image.height * scale };
  const offset = { x: (frame.width - rendered.width) / 2, y: (frame.height - rendered.height) / 2 };

  return (
    <View testID="ai-evidence-section" style={styles.section}>
      <View style={styles.titleRow}><ScanSearch size={25} color={colors.primary} /><Text style={styles.title}>What the AI read</Text></View>
      <View testID="ai-highlighted-photo" style={styles.photoFrame} onLayout={onLayout}>
        <Image
          source={{ uri: photoUri }}
          resizeMode="contain"
          style={StyleSheet.absoluteFill}
        />
        {evidence.map((item, index) => item.box && (
          <View
            key={`${item.field}-${index}`}
            testID={`evidence-box-${item.field}`}
            pointerEvents="none"
            style={[
              styles.box,
              {
                left: offset.x + rendered.width * item.box.x / 1000,
                top: offset.y + rendered.height * item.box.y / 1000,
                width: Math.max(28, rendered.width * item.box.width / 1000),
                height: Math.max(22, rendered.height * item.box.height / 1000),
                borderColor: item.confidence >= 0.75 ? colors.primary : colors.warning,
              },
            ]}
          ><Text style={styles.boxNumber}>{index + 1}</Text></View>
        ))}
      </View>
      <View style={styles.evidenceList}>
        {evidence.length ? evidence.map((item, index) => (
          <View key={`${item.field}-text-${index}`} style={styles.evidenceRow}>
            <View style={styles.number}><Text style={styles.numberText}>{index + 1}</Text></View>
            <View style={styles.evidenceText}>
              <Text style={styles.field}>{labels[item.field]}</Text>
              <Text style={styles.snippet}>“{item.text}”</Text>
            </View>
            <Text style={[styles.confidence, { color: item.confidence >= 0.75 ? colors.primary : colors.warning }]}>{Math.round(item.confidence * 100)}%</Text>
          </View>
        )) : <Text style={styles.noEvidence}>No text locations were returned. Verify the label carefully.</Text>}
      </View>
      <View style={styles.warning}><AlertTriangle size={22} color={colors.warning} /><Text style={styles.warningText}>AI can make mistakes. Compare every highlighted detail with the original label.</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  title: { color: colors.text, fontSize: 22, fontWeight: "900" },
  photoFrame: { width: "100%", height: 240, borderRadius: radii.lg, backgroundColor: colors.white, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  box: { position: "absolute", borderWidth: 3, borderRadius: 6, backgroundColor: "rgba(80,129,190,0.12)" },
  boxNumber: { position: "absolute", top: -17, left: -3, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, color: colors.white, fontSize: 12, lineHeight: 20, fontWeight: "900", textAlign: "center" },
  evidenceList: { backgroundColor: colors.white, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  evidenceRow: { minHeight: 76, padding: 13, flexDirection: "row", alignItems: "center", gap: 11, borderBottomWidth: 1, borderBottomColor: colors.border },
  number: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  numberText: { color: colors.white, fontSize: 16, fontWeight: "900" },
  evidenceText: { flex: 1 }, field: { color: colors.textSecondary, fontSize: 14, fontWeight: "800" },
  snippet: { color: colors.text, fontSize: 18, fontWeight: "800", marginTop: 3 },
  confidence: { fontSize: 17, fontWeight: "900" },
  noEvidence: { color: colors.textSecondary, fontSize: 17, lineHeight: 24, padding: 16 },
  warning: { borderRadius: radii.md, borderWidth: 2, borderColor: colors.warning, backgroundColor: colors.white, padding: 14, flexDirection: "row", gap: 10, alignItems: "center" },
  warningText: { flex: 1, color: colors.text, fontSize: 16, lineHeight: 23, fontWeight: "700" },
});