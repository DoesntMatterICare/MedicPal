import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useApp } from "@/src/context/AppContext";
import { colors } from "@/src/theme";

export default function Index() {
  const { ready, language, profile } = useApp();
  if (!ready) return <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /></View>;
  if (!language) return <Redirect href="/onboarding/language" />;
  if (!profile) return <Redirect href="/onboarding/login" />;
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({ loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background } });