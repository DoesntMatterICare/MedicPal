import { Bot, Send, ShieldCheck, X } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BigButton } from "@/components/BigButton";
import { HealthSheet } from "@/components/HealthSheet";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { QuickReplies } from "@/components/chat/QuickReplies";
import { useMedicPalChat } from "@/src/features/chat/useMedicPalChat";
import { colors, radii } from "@/src/theme";

export default function ChatScreen() {
  const [input, setInput] = useState(""); const scrollRef = useRef<ScrollView>(null);
  const { messages, replies, sendText, selectQuickReply, confirmation, working, confirmAction, cancelConfirmation } = useMedicPalChat();
  useEffect(() => { scrollRef.current?.scrollToEnd({ animated: true }); }, [messages]);
  const submit = async () => { const text = input; setInput(""); await sendText(text); };
  return (
    <SafeAreaView testID="chat-screen" style={styles.safe} edges={["top"]}>
      <View testID="chat-header" style={styles.header}><View style={styles.botIcon}><Bot size={27} color={colors.white} /></View><View style={styles.headerCopy}><Text style={styles.title}>MedicPal helper</Text><Text testID="chat-privacy-status" style={styles.subtitle}>On-device · Not saved · App help only</Text></View><ShieldCheck size={26} color={colors.primary} /></View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={80}>
        <ScrollView ref={scrollRef} testID="chat-message-list" contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled" onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>{messages.map((message) => <MessageBubble key={message.id} message={message} />)}</ScrollView>
        <View style={styles.controls}><QuickReplies options={replies} onSelect={selectQuickReply} /><View style={styles.composer}><TextInput testID="chat-input" value={input} onChangeText={setInput} onSubmitEditing={submit} placeholder="Ask about MedicPal or reminders" placeholderTextColor={colors.textSecondary} style={styles.input} returnKeyType="send" maxLength={180} /><Pressable testID="chat-send-button" accessibilityLabel="Send message" disabled={!input.trim()} onPress={submit} style={({ pressed }) => [styles.send, { opacity: input.trim() ? 1 : 0.45, transform: [{ scale: pressed ? 0.94 : 1 }] }]}><Send size={24} color={colors.white} /></Pressable></View></View>
      </KeyboardAvoidingView>
      <HealthSheet visible={Boolean(confirmation)} title={confirmation?.title || "Confirm change"} onClose={cancelConfirmation} testID="chat-confirmation-sheet">
        <View testID="chat-confirmation-message" style={styles.confirmation}><ShieldCheck size={34} color={confirmation?.danger ? colors.danger : colors.primary} /><Text style={styles.confirmationText}>{confirmation?.text}</Text></View>
        <BigButton testID="chat-confirm-action-button" label={confirmation?.label || "Confirm"} icon={ShieldCheck} variant={confirmation?.danger ? "danger" : "primary"} loading={working} onPress={confirmAction} />
        <BigButton testID="chat-cancel-action-button" label="No changes" icon={X} variant="secondary" onPress={cancelConfirmation} />
      </HealthSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, flex: { flex: 1 }, header: { minHeight: 78, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.background }, botIcon: { width: 48, height: 48, borderRadius: 17, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }, headerCopy: { flex: 1 }, title: { color: colors.text, fontSize: 22, fontWeight: "900" }, subtitle: { color: colors.textSecondary, fontSize: 13, fontWeight: "700", marginTop: 3 },
  messages: { padding: 16, paddingBottom: 24, gap: 14 }, controls: { backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border }, composer: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingBottom: 12 }, input: { flex: 1, minHeight: 58, maxHeight: 110, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 15, color: colors.text, fontSize: 16 }, send: { width: 56, height: 56, borderRadius: 18, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  confirmation: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 20, alignItems: "center", gap: 14 }, confirmationText: { color: colors.text, fontSize: 18, lineHeight: 26, fontWeight: "700", textAlign: "center" },
});