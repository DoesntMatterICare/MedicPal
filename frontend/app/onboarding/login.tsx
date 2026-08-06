import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { LogIn, LockKeyhole, ShieldCheck } from "lucide-react-native";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BigButton } from "@/components/BigButton";
import { Speakable } from "@/components/Speakable";
import { useApp } from "@/src/context/AppContext";
import { colors, radii } from "@/src/theme";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { language, saveProfile, speak } = useApp();
  const extra = Constants.expoConfig?.extra || {};
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || extra.googleWebClientId || "";
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || extra.googleAndroidClientId || "";
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || extra.googleIosClientId || "";
  const configured = Platform.OS === "web" ? Boolean(webClientId) : Platform.OS === "android" ? Boolean(androidClientId) : Boolean(iosClientId);
  const redirectUri = Platform.OS === "web" ? makeRedirectUri({ path: "auth/callback" }) : undefined;
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [, response, promptAsync] = Google.useAuthRequest({
    webClientId: webClientId || "missing.apps.googleusercontent.com",
    androidClientId: androidClientId || "missing.apps.googleusercontent.com",
    iosClientId: iosClientId || "missing.apps.googleusercontent.com",
    redirectUri,
    scopes: ["openid", "profile", "email", "https://www.googleapis.com/auth/calendar.events"],
  });

  useEffect(() => {
    if (response?.type !== "success") return;
    const token = response.authentication?.accessToken;
    if (!token) { setError("Google did not return Calendar access. Please try again."); return; }
    setLoading(true);
    fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: `Bearer ${token}` } })
      .then((result) => { if (!result.ok) throw new Error(); return result.json(); })
      .then(async (user) => {
        await saveProfile({
          googleId: user.sub, name: user.given_name || user.name || "Friend", email: user.email,
          photoUrl: user.picture || "", accessToken: token, language: language || "en",
          fontSize: 18, highContrast: true, ttsEnabled: true, caregiverPhone: "",
        });
        speak("Signed in. Your medicines are safe.");
        router.replace("/(tabs)");
      })
      .catch(() => setError("We could not complete Google sign-in. Please try again."))
      .finally(() => setLoading(false));
  }, [response, language, saveProfile, speak]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.topMark}><View style={styles.logo}><ShieldCheck size={44} color={colors.white} /></View><Text style={styles.brand}>MedicPal</Text></View>
      <View style={styles.content}>
        <Speakable text="Your medicines, always in safe hands" testID="login-heading-speak-button">
          <Text style={styles.title}>Your medicines,{"\n"}always in safe hands.</Text>
        </Speakable>
        <Text style={styles.subtitle}>Sign in with Google to keep your medicines safe and add reminders to your calendar.</Text>
        <View style={styles.securityCard}>
          <LockKeyhole size={26} color={colors.primary} />
          <Text style={styles.securityText}>Private sign-in. MedicPal only requests your profile and medicine reminder calendar access.</Text>
        </View>
        {!!error && <Text testID="login-error-text" style={styles.error}>{error}</Text>}
        {!configured && <Text testID="oauth-setup-message" style={styles.setup}>Google OAuth client IDs are not configured yet. Add them to the app environment to enable sign-in.</Text>}
      </View>
      <View style={styles.footer}>
        <BigButton testID="google-sign-in-button" label="Continue with Google" icon={LogIn} loading={loading} disabled={!configured} onPress={async () => { setError(""); await promptAsync(); }} />
        <Text style={styles.note}>Google sign-in is the only sign-in method.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 22 },
  topMark: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 20 },
  logo: { width: 60, height: 60, borderRadius: 20, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  brand: { color: colors.primary, fontSize: 28, fontWeight: "900" },
  content: { flex: 1, justifyContent: "center" },
  title: { fontSize: 31, lineHeight: 38, fontWeight: "900", color: colors.text },
  subtitle: { fontSize: 20, lineHeight: 29, color: colors.textSecondary, marginTop: 20 },
  securityCard: { marginTop: 28, backgroundColor: colors.white, borderRadius: radii.lg, padding: 18, flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1, borderColor: colors.border },
  securityText: { flex: 1, color: colors.text, fontSize: 17, lineHeight: 24, fontWeight: "600" },
  error: { marginTop: 18, color: colors.danger, fontSize: 17, fontWeight: "700" },
  setup: { marginTop: 18, color: colors.warning, fontSize: 17, lineHeight: 24, fontWeight: "800" },
  footer: { paddingBottom: 20 },
  note: { textAlign: "center", marginTop: 14, color: colors.textSecondary, fontSize: 14 },
});