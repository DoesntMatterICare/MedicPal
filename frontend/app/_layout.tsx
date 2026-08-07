import { useEffect } from "react";
import { LogBox, Platform } from "react-native";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { AppProvider, useApp } from "@/src/context/AppContext";
import { syncCalendarQueue } from "@/services/calendar";

LogBox.ignoreAllLogs(true);
SplashScreen.preventAutoHideAsync();

function AppStack() {
  const router = useRouter();
  const { profile } = useApp();

  useEffect(() => {
    void syncCalendarQueue(profile?.accessToken);
  }, [profile?.accessToken]);

  useEffect(() => {
    const openReminder = (response: Notifications.NotificationResponse) => {
      const id = response.notification.request.content.data?.medicineId;
      const missed = response.notification.request.content.data?.missedDose;
      if (typeof id === "string") router.push({ pathname: "/reminder/[id]", params: { id, missed: missed ? "1" : "0" } });
    };
    const subscription = Notifications.addNotificationResponseReceivedListener(openReminder);
    if (Platform.OS !== "web") {
      void Notifications.getLastNotificationResponseAsync().then((response) => { if (response) openReminder(response); });
    }
    return () => subscription.remove();
  }, [router]);

  return <Stack screenOptions={{ headerShown: false, animation: "fade" }} />;
}

export default function RootLayout() {
  const [loaded, error] = useIconFonts();
  useEffect(() => { if (loaded || error) void SplashScreen.hideAsync(); }, [loaded, error]);
  if (!loaded && !error) return null;
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <AppStack />
      </AppProvider>
    </SafeAreaProvider>
  );
}