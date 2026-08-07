import { X } from "lucide-react-native";
import type { ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/src/theme";

type Props = { visible: boolean; title: string; onClose: () => void; testID: string; children: ReactNode };

export function HealthSheet({ visible, title, onClose, testID, children }: Props) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View testID={testID} style={[styles.sheet, { paddingBottom: Math.max(20, insets.bottom) }]}>
          <View style={styles.handle} />
          <View style={styles.header}><Text testID={`${testID}-title`} style={styles.title}>{title}</Text><Pressable testID={`${testID}-close-button`} accessibilityLabel="Close" onPress={onClose} style={styles.close}><X size={24} color={colors.text} /></Pressable></View>
          <ScrollView testID={`${testID}-visible-content`} style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(14,43,74,0.46)" },
  sheet: { height: "90%", backgroundColor: colors.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingTop: 16 },
  handle: { width: 52, height: 5, borderRadius: 3, backgroundColor: colors.border, alignSelf: "center" },
  header: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20 }, title: { flex: 1, color: colors.text, fontSize: 25, fontWeight: "900" },
  close: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 }, content: { paddingHorizontal: 20, paddingBottom: 24, gap: 16 },
});