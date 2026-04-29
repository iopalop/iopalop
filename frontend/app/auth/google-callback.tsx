import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../../src/context";
import { colors } from "../../src/theme";
import { api } from "../../src/api";
import { t } from "../../src/i18n";

export default function GoogleCallback() {
  const router = useRouter();
  const { setToken, lang } = useApp();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
      try {
        let sessionId: string | null = null;
        if (typeof window !== "undefined" && window.location?.hash) {
          const params = new URLSearchParams(window.location.hash.replace("#", ""));
          sessionId = params.get("session_id");
        }
        if (!sessionId) {
          setError("No session_id");
          setTimeout(() => router.replace("/auth/login"), 1200);
          return;
        }
        const res = await api.post("/auth/google/session", { session_id: sessionId });
        const { default: AsyncStorage } = await import("@react-native-async-storage/async-storage");
        await AsyncStorage.setItem("auth_token", res.token);
        await setToken(res.token);
        router.replace(res.user.is_admin ? "/admin" : "/");
      } catch (e: any) {
        setError(e.message || "Auth failed");
        setTimeout(() => router.replace("/auth/login"), 1500);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.text}>{error || t("loading", lang)}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  text: { color: colors.textSecondary, fontSize: 14 },
});
