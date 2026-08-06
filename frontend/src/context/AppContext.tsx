import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Speech from "expo-speech";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import i18n from "@/src/i18n";
import type { UserProfile } from "@/src/types";

const PROFILE_KEY = "medicpal:user-profile";
const LANGUAGE_KEY = "medicpal:language";

type ContextValue = {
  ready: boolean;
  profile: UserProfile | null;
  language: string | null;
  fontSize: number;
  ttsEnabled: boolean;
  highContrast: boolean;
  saveProfile: (profile: UserProfile) => Promise<void>;
  chooseLanguage: (code: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  clearProfile: () => Promise<void>;
  speak: (text: string) => void;
};

const AppContext = createContext<ContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [language, setLanguage] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(PROFILE_KEY), AsyncStorage.getItem(LANGUAGE_KEY)])
      .then(([savedProfile, savedLanguage]) => {
        const parsed = savedProfile ? JSON.parse(savedProfile) : null;
        setProfile(parsed);
        setLanguage(savedLanguage || parsed?.language || null);
        void i18n.changeLanguage(savedLanguage || parsed?.language || "en");
      })
      .finally(() => setReady(true));
  }, []);

  const saveProfile = useCallback(async (next: UserProfile) => {
    setProfile(next);
    setLanguage(next.language);
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  }, []);

  const chooseLanguage = useCallback(async (code: string) => {
    setLanguage(code);
    await i18n.changeLanguage(code);
    await AsyncStorage.setItem(LANGUAGE_KEY, code);
    if (profile) {
      const next = { ...profile, language: code };
      setProfile(next);
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    }
  }, [profile]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!profile) return;
    const next = { ...profile, ...updates };
    setProfile(next);
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  }, [profile]);

  const clearProfile = useCallback(async () => {
    setProfile(null);
    setLanguage(null);
    await AsyncStorage.multiRemove([PROFILE_KEY, LANGUAGE_KEY]);
  }, []);

  const ttsEnabled = profile?.ttsEnabled ?? true;
  const speak = useCallback((text: string) => {
    if (!ttsEnabled || !text) return;
    Speech.stop();
    Speech.speak(text, { language: language || "en", rate: 0.88 });
  }, [language, ttsEnabled]);

  const value = useMemo(() => ({
    ready, profile, language, fontSize: profile?.fontSize ?? 18,
    ttsEnabled, highContrast: profile?.highContrast ?? true,
    saveProfile, chooseLanguage, updateProfile, clearProfile, speak,
  }), [ready, profile, language, ttsEnabled, saveProfile, chooseLanguage, updateProfile, clearProfile, speak]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}