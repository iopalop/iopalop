import React, { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../../src/context";
import { t } from "../../src/i18n";
import { colors, obtuse, obtuseSmall, shadow } from "../../src/theme";
import { TopBar } from "../../src/components/Nav";
import { api } from "../../src/api";

export default function RegisterScreen() {
  const router = useRouter();
  const { lang, setToken } = useApp();
  const isAr = lang === "ar";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !email || !password) return;
    setLoading(true);
    try {
      const res = await api.post("/auth/register", { name, email, password });
      const { default: AsyncStorage } = await import("@react-native-async-storage/async-storage");
      await AsyncStorage.setItem("auth_token", res.token);
      await setToken(res.token);
      router.replace(res.user.is_admin ? "/admin" : "/");
    } catch (e: any) {
      Alert.alert(t("error", lang), e.message);
    }
    setLoading(false);
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

          <Field label={t("name", lang)} value={name} onChange={setName} testID="reg-name" />
          <Field label={t("email", lang)} value={email} onChange={setEmail} kb="email-address" auto testID="reg-email" />
          <Field label={t("password", lang)} value={password} onChange={setPassword} secure testID="reg-password" />

          <TouchableOpacity onPress={handleSubmit} style={[styles.btnPrimary, shadow, loading && { opacity: 0.6 }]} disabled={loading} testID="register-submit">
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>{t("register", lang)}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace("/auth/login")} style={{ alignItems: "center", marginTop: 18 }} testID="go-login">
            <Text style={{ color: colors.textSecondary }}>
              {t("haveAccount", lang)} <Text style={{ color: colors.primary, fontWeight: "900" }}>{t("login", lang)}</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChange, kb, secure, auto, testID }: any) {
  const { lang } = useApp();
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={[styles.label, { textAlign: lang === "ar" ? "right" : "left" }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={kb}
        secureTextEntry={secure}
        autoCapitalize={auto ? "none" : undefined}
        style={[styles.input, { textAlign: lang === "ar" ? "right" : "left" }]}
        placeholderTextColor={colors.textMuted}
        testID={testID}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 22, paddingBottom: 60 },
  heroBlock: { alignItems: "center", gap: 6, paddingVertical: 30 },
  welcome: { color: colors.secondary, fontWeight: "700", fontSize: 14 },
  brand: { fontSize: 36, fontWeight: "900", color: colors.primary },
  label: { fontWeight: "800", color: colors.primary, fontSize: 13, marginBottom: 4 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 14, ...obtuseSmall, fontSize: 15, color: colors.textPrimary,
  },
  btnPrimary: { backgroundColor: colors.primary, paddingVertical: 15, ...obtuse, alignItems: "center", marginTop: 26 },
  btnPrimaryText: { color: "#fff", fontWeight: "900", fontSize: 15 },
});
