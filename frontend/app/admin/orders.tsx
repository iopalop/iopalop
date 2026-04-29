import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../src/context";
import { t } from "../../src/i18n";
import { colors, obtuse, obtuseSmall, shadow } from "../../src/theme";
import { TopBar } from "../../src/components/Nav";
import { api } from "../../src/api";

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export default function AdminOrders() {
  const { lang } = useApp();
  const isAr = lang === "ar";
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setOrders(await api.get("/admin/orders")); } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await api.put(`/admin/orders/${orderId}/status?status=${status}`, {});
      await load();
    } catch (e: any) { Alert.alert(t("error", lang), e.message); }
  };

  const statusColor = (s: string) => ({
    pending: colors.secondary, confirmed: colors.primary, shipped: colors.primary,
    delivered: colors.success, cancelled: colors.danger,
  } as any)[s] || colors.textSecondary;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <TopBar showBack title={t("manageOrders", lang)} />
      <ScrollView contentContainerStyle={{ padding: 14 }}>
        {loading ? <ActivityIndicator color={colors.primary} /> : orders.length === 0 ? (
          <Text style={{ textAlign: "center", color: colors.textSecondary, padding: 30 }}>—</Text>
        ) : orders.map((o) => (
          <View key={o.order_id} style={[styles.card, shadow]} testID={`order-${o.order_id}`}>
            <View style={styles.head}>
              <Text style={styles.id}>#{o.order_id}</Text>
              <View style={[styles.pill, { backgroundColor: statusColor(o.status) }]}>
                <Text style={styles.pillText}>{t(o.status as any, lang)}</Text>
              </View>
            </View>
            <Text style={styles.customer}>{o.customer_name} · {o.customer_phone}</Text>
            <Text style={styles.address}>{o.customer_address}, {o.customer_city}, {o.customer_country}</Text>
            <Text style={styles.items}>{o.items.map((i: any) => `${isAr ? i.name_ar : i.name_en} × ${i.quantity}`).join(" · ")}</Text>
            <Text style={styles.total}>{o.total_iqd.toLocaleString()} {t("iqd", lang)}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 8 }}>
              {STATUSES.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => updateStatus(o.order_id, s)}
                  style={[styles.statBtn, o.status === s && { backgroundColor: statusColor(s), borderColor: statusColor(s) }]}
                  testID={`set-${o.order_id}-${s}`}
                >
                  <Text style={[styles.statBtnText, o.status === s && { color: "#fff" }]}>{t(s as any, lang)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  card: {
    backgroundColor: colors.surface, padding: 14, ...obtuse, marginBottom: 10,
    borderWidth: 1, borderColor: colors.border, gap: 4,
  },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  id: { fontWeight: "900", color: colors.primary },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  pillText: { color: "#fff", fontWeight: "900", fontSize: 11 },
  customer: { color: colors.textPrimary, fontWeight: "700" },
  address: { color: colors.textSecondary, fontSize: 12 },
  items: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  total: { color: colors.primary, fontWeight: "900", fontSize: 15, marginTop: 4 },
  statBtn: {
    paddingHorizontal: 12, paddingVertical: 6, ...obtuseSmall,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background,
  },
  statBtnText: { fontSize: 11, fontWeight: "800", color: colors.textPrimary },
});
