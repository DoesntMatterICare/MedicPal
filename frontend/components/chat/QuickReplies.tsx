import { useEffect, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { colors, radii } from "@/src/theme";

export type QuickReply = { id: string; label: string };

export function QuickReplies({ options, onSelect }: { options: QuickReply[]; onSelect: (id: string, label: string) => void }) {
  const scrollRef = useRef<ScrollView>(null);
  const signature = options.map((option) => option.id).join("|");
  useEffect(() => { scrollRef.current?.scrollTo({ x: 0, animated: false }); }, [signature]);
  return (
    <ScrollView ref={scrollRef} testID="chat-quick-replies" horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {options.map((option) => <Pressable key={option.id} testID={`chat-quick-reply-${option.id.replace(/_/g, "-")}`} accessibilityRole="button" onPress={() => onSelect(option.id, option.label)} style={({ pressed }) => [styles.chip, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}><Text style={styles.label}>{option.label}</Text></Pressable>)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 9, paddingHorizontal: 16, paddingVertical: 10 }, chip: { minHeight: 48, borderRadius: radii.pill, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.primary, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" }, label: { color: colors.primary, fontSize: 14, fontWeight: "900" },
});