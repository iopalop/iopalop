import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../src/context";
import { t } from "../src/i18n";
import { colors, obtuse, obtuseSmall, shadow } from "../src/theme";
import { TopBar, BottomNav } from "../src/components/Nav";
import { api } from "../src/api";

const SUPPORT_EMAIL = "ejjkio3@gmail.com";

export default function ProfileScreen() {
  const { lang, user, logout, authLoading } = useApp();
  const router = useRouter();
  const isAr = lang === "ar";
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    api.get("/orders/me").then((o) => { setOrders(o); setLoading(false); }).catch(() => setLoading(false));
  }, [user, authLoading]);

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const statusColor = (s: string) => ({
    pending: colors.secondary, confirmed: colors.primary, shipped: colors.primary,
    delivered: colors.success, cancelled: colors.danger,
  } as any)[s] || colors.textSecondary;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <TopBar title={t("profile", lang)} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={[styles.userCard, shadow]} testID="user-card">
          <View style={styles.avatar}>
            {user.picture ? (
              <Image source={{ uri: user.picture }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarText}>{user.name?.charAt(0)?.toUpperCase()}</Text>
            )}
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            {user.is_admin && (
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={12} color={colors.primaryDark} />
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
          </View>
        </View>

        {user.is_admin && (
          <TouchableOpacity onPress={() => router.push("/admin")} style={[styles.linkRow, shadow]} testID="goto-admin">
            <Ionicons name="settings-outline" size={22} color={colors.primary} />
            <Text style={styles.linkText}>{t("admin", lang)}</Text>
            <Ionicons name={isAr ? "chevron-back" : "chevron-forward"} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => router.push("/privacy")} style={[styles.linkRow, shadow]} testID="goto-privacy">
          <Ionicons name="document-text-outline" size={22} color={colors.primary} />
          <Text style={styles.linkText}>{t("privacyPolicy", lang)}</Text>
          <Ionicons name={isAr ? "chevron-back" : "chevron-forward"} size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          style={[styles.linkRow, shadow]}
          testID="contact-support"
        >
          <Ionicons name="mail-outline" size={22} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.linkText}>{t("support", lang)}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{SUPPORT_EMAIL}</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.section}>{t("myOrders", lang)}</Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : orders.length === 0 ? (
          <Text style={styles.empty}>{isAr ? "لا توجد طلبات بعد" : "No orders yet"}</Text>
        ) : (
          orders.map((o) => (
            <View key={o.order_id} style={[styles.orderCard, shadow]} testID={`order-${o.order_id}`}>
              <View style={styles.orderHead}>
                <Text style={styles.orderId}>#{o.order_id}</Text>
                <View style={[styles.statusPill, { backgroundColor: statusColor(o.status) }]}>
                  <Text style={styles.statusText}>{t(o.status as any, lang)}</Text>
                </View>
              </View>
              <Text style={styles.orderDate}>{new Date(o.created_at).toLocaleDateString()}</Text>
              <Text style={styles.orderTotal}>{o.total_iqd.toLocaleString()} {t("iqd", lang)}</Text>
              <Text style={styles.orderItems}>
                {o.items.map((i: any) => isAr ? i.name_ar : i.name_en).join(" · ")}
              </Text>
            </View>
          ))
        )}

        <TouchableOpacity onPress={async () => { await logout(); router.replace("/"); }} style={[styles.logoutBtn]} testID="logout-btn">
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>{t("logout", lang)}</Text>
        </TouchableOpacity>
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  userCard: {
    flexDirection: "row", gap: 14, padding: 16, backgroundColor: colors.primary,
    ...obtuse, alignItems: "center", marginBottom: 16,
  },
  avatar: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: colors.secondary,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarText: { fontSize: 26, fontWeight: "900", color: colors.primaryDark },
  userName: { color: "#fff", fontWeight: "900", fontSize: 17 },
  userEmail: { color: "#E5E0D8", fontSize: 12 },
  adminBadge: {
    backgroundColor: colors.secondary, alignSelf: "flex-start", flexDirection: "row",
    gap: 4, alignItems: "center", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginTop: 4,
  },
  adminBadgeText: { color: colors.primaryDark, fontWeight: "900", fontSize: 10 },
  linkRow: {
    flexDirection: "row", gap: 12, alignItems: "center", padding: 16,
    backgroundColor: colors.surface, ...obtuseSmall, marginBottom: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  linkText: { flex: 1, fontWeight: "800", color: colors.textPrimary, fontSize: 14 },
  section: { fontSize: 16, fontWeight: "900", color: colors.primary, marginVertical: 16 },
  empty: { textAlign: "center", color: colors.textSecondary, padding: 20 },
  orderCard: {
    padding: 14, backgroundColor: colors.surface, ...obtuse, marginBottom: 10,
    borderWidth: 1, borderColor: colors.border, gap: 4,
  },
  orderHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderId: { fontWeight: "900", color: colors.primary },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { color: "#fff", fontWeight: "900", fontSize: 11 },
  orderDate: { color: colors.textSecondary, fontSize: 11 },
  orderTotal: { fontWeight: "900", color: colors.primary, fontSize: 15 },
  orderItems: { color: colors.textSecondary, fontSize: 12 },
  logoutBtn: {
    flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center",
    padding: 14, marginTop: 18, borderWidth: 2, borderColor: colors.danger, ...obtuse,
  },
  logoutText: { color: colors.danger, fontWeight: "900" },
});
