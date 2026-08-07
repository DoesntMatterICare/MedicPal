import { AlertTriangle, Sparkles } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import type { SymptomInsight } from "@/src/types";
import { colors, radii } from "@/src/theme";

export function InsightCard({ insight, testID }: { insight: SymptomInsight; testID: string }) {
  return (
    <View testID={testID} style={styles.card}>
      <View style={styles.heading}><Sparkles size={22} color={colors.warning} /><Text style={styles.title}>AI visit prep</Text></View>
      {!!insight.urgent_warning && <View testID={`${testID}-urgent-warning`} style={styles.warning}><AlertTriangle size={22} color={colors.danger} /><Text style={styles.warningText}>{insight.urgent_warning}</Text></View>}
      <Text testID={`${testID}-summary`} style={styles.summary}>{insight.summary}</Text>
      <Text style={styles.label}>Questions for your doctor</Text>
      {insight.questions.map((question, index) => <Text testID={`${testID}-question-${index + 1}`} key={question} style={styles.question}>{index + 1}. {question}</Text>)}
      <Text testID={`${testID}-safety-notice`} style={styles.notice}>{insight.safety_notice}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFF8EA", borderWidth: 1.5, borderColor: "#EBCB86", borderRadius: radii.lg, padding: 18, gap: 10 },
  heading: { flexDirection: "row", alignItems: "center", gap: 8 }, title: { color: colors.text, fontSize: 19, fontWeight: "900" }, summary: { color: colors.text, fontSize: 16, lineHeight: 24 },
  label: { color: colors.text, fontSize: 15, fontWeight: "900", marginTop: 2 }, question: { color: colors.textSecondary, fontSize: 15, lineHeight: 22 }, notice: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, fontWeight: "700", marginTop: 2 },
  warning: { flexDirection: "row", gap: 9, backgroundColor: "#FFF1EF", borderRadius: 16, padding: 12 }, warningText: { flex: 1, color: colors.danger, fontSize: 14, lineHeight: 20, fontWeight: "800" },
});