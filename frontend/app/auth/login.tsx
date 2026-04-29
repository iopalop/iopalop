import React, { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../src/context";
import { t } from "../../src/i18n";
import { colors, obtuse, obtuseSmall, shadow } from "../../src/theme";
import { TopBar } from "../../src/components/Nav";
import { api, BACKEND_URL } from "../../src/api";

export default function LoginScreen() {
  const router = useRouter();
  const { lang, setToken } = useApp();
  const isAr = lang === "ar";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const token = res.token;
      const { default: AsyncStorage } = await import("@react-native-async-storage/async-storage");
      await AsyncStorage.setItem("auth_token", token);
      await setToken(token);
      router.replace(res.user.is_admin ? "/admin" : "/");
    } catch (e: any) {
      Alert.alert(t("error", lang), e.message);
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = `${BACKEND_URL}/auth/google-callback`;
    const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    if (Platform.OS === "web") {
      // On web Linking.openURL works
      window.location.href = authUrl;
    } else {
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
      if (result.type === "success" && result.url) {
        const hash = result.url.split("#")[1] || "";
        const params = new URLSearchParams(hash);
        const sessionId = params.get("session_id");
        if (sessionId) {
          try {
            const res = await api.post("/auth/google/session", { session_id: sessionId });
            const { default: AsyncStorage } = await import("@react-native-async-storage/async-storage");
            await AsyncStorage.setItem("auth_token", res.token);
            await setToken(res.token);
            router.replace(res.user.is_admin ? "/admin" : "/");
          } catch (e: any) {
            Alert.alert(t("error", lang), e.message);
          }
        }
      }
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <TopBar showBack />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.heroBlock}>
            <Text style={styles.welcome}>{t("welcome", lang)}</Text>
            <Text style={styles.brand}>عراقچي ستور</Text>
          </View>

          <Text style={[styles.label, { textAlign: isAr ? "right" : "left" }]}>{t("email", lang)}</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[styles.input, { textAlign: isAr ? "right" : "left" }]}
            placeholderTextColor={colors.textMuted}
            testID="login-email"
          />
          <Text style={[styles.label, { textAlign: isAr ? "right" : "left", marginTop: 14 }]}>{t("password", lang)}</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={[styles.input, { textAlign: isAr ? "right" : "left" }]}
            placeholderTextColor={colors.textMuted}
            testID="login-password"
          />

          <TouchableOpacity onPress={handleLogin} style={[styles.btnPrimary, shadow, loading && { opacity: 0.6 }]} disabled={loading} testID="login-submit">
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>{t("login", lang)}</Text>}
          </TouchableOpacity>

          <View style={[styles.divRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
            <View style={styles.line} />
            <Text style={styles.orText}>{t("or", lang)}</Text>
            <View style={styles.line} />
          </View>

          <TouchableOpacity onPress={handleGoogle} style={[styles.btnGoogle, shadow]} testID="google-login-btn">
            <Ionicons name="logo-google" size={20} color="#DB4437" />
            <Text style={styles.btnGoogleText}>{t("continueWithGoogle", lang)}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/auth/register")} style={{ alignItems: "center", marginTop: 18 }} testID="go-register">
            <Text style={{ color: colors.textSecondary }}>
              {t("noAccount", lang)} <Text style={{ color: colors.primary, fontWeight: "900" }}>{t("register", lang)}</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 22, gap: 6, paddingBottom: 60 },
  heroBlock: { alignItems: "center", gap: 6, paddingVertical: 30 },
  welcome: { color: colors.secondary, fontWeight: "700", fontSize: 14 },
  brand: { fontSize: 36, fontWeight: "900", color: colors.primary },
  label: { fontWeight: "800", color: colors.primary, fontSize: 13, marginTop: 4 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 14, ...obtuseSmall, fontSize: 15, color: colors.textPrimary,
  },
  btnPrimary: { backgroundColor: colors.primary, paddingVertical: 15, ...obtuse, alignItems: "center", marginTop: 24 },
  btnPrimaryText: { color: "#fff", fontWeight: "900", fontSize: 15 },
  divRow: { alignItems: "center", gap: 10, marginVertical: 18 },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  orText: { color: colors.textSecondary, fontWeight: "700" },
  btnGoogle: {
    flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border,
    paddingVertical: 14, ...obtuse,
  },
  btnGoogleText: { fontWeight: "800", color: colors.textPrimary, fontSize: 14 },
});
