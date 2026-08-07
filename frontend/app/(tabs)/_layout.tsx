import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import { Home, MessageCircle, ScanLine, Settings } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { colors } from "@/src/theme";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  return (
    <Tabs
      screenListeners={{ tabPress: () => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 13, fontWeight: "800", marginTop: 2 },
        tabBarStyle: { height: 80 + insets.bottom, paddingTop: 8, paddingBottom: Math.max(8, insets.bottom), backgroundColor: colors.white, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t("home"), tabBarIcon: ({ color }) => <Home size={26} color={color} />, tabBarButtonTestID: "home-tab-button" }} />
      <Tabs.Screen name="scan" options={{ title: t("scan"), tabBarIcon: ({ color }) => <ScanLine size={28} color={color} />, tabBarButtonTestID: "scan-tab-button" }} />
      <Tabs.Screen name="chat" options={{ title: "Chat", tabBarIcon: ({ color }) => <MessageCircle size={27} color={color} />, tabBarButtonTestID: "chat-tab-button" }} />
      <Tabs.Screen name="settings" options={{ title: t("settings"), tabBarIcon: ({ color }) => <Settings size={26} color={color} />, tabBarButtonTestID: "settings-tab-button" }} />
    </Tabs>
  );
}