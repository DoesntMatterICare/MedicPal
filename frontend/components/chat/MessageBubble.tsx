import { MessageCircle, UserRound } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "@/src/theme";

export type ChatMessage = { id: string; role: "assistant" | "user"; text: string };

export function MessageBubble({ message }: { message: ChatMessage }) {
  const assistant = message.role === "assistant";
  return (
    <View testID={`chat-message-${message.id}`} style={[styles.row, assistant ? styles.left : styles.right]}>
      {assistant && <View style={styles.avatar}><MessageCircle size={18} color={colors.primary} /></View>}
      <View style={[styles.bubble, assistant ? styles.assistant : styles.user]}><Text style={styles.text}>{message.text}</Text></View>
      {!assistant && <View style={styles.userAvatar}><UserRound size={18} color={colors.white} /></View>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { width: "100%", flexDirection: "row", alignItems: "flex-end", gap: 8 }, left: { justifyContent: "flex-start" }, right: { justifyContent: "flex-end" },
  avatar: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }, userAvatar: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  bubble: { maxWidth: "76%", paddingHorizontal: 15, paddingVertical: 12 }, assistant: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderTopLeftRadius: 6, borderTopRightRadius: radii.md, borderBottomLeftRadius: radii.md, borderBottomRightRadius: radii.md }, user: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.secondary, borderTopLeftRadius: radii.md, borderTopRightRadius: 6, borderBottomLeftRadius: radii.md, borderBottomRightRadius: radii.md },
  text: { color: colors.text, fontSize: 16, lineHeight: 23, fontWeight: "600" },
});