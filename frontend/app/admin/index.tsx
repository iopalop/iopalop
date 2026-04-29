import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../src/context";
import { t } from "../../src/i18n";
import { colors, obtuse, obtuseSmall, shadow } from "../../src/theme";
import { TopBar, BottomNav } from "../../src/components/Nav";
import { api } from "../../src/api";

export default function AdminDashboard() {
  const { user, lang, authLoading } = useApp();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isAr = lang === "ar";

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/auth/login"); return; }
    if (!user.is_admin) { router.replace("/"); return; }
    api.get("/admin/dashboard").then((d) => { setData(d); setLoading(false); });
  }, [user, authLoading]);

  if (loading || !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <TopBar title={t("dashboard", lang)} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <TopBar title={t("dashboard", lang)} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.statGrid}>
          <Stat label={t("totalRevenue", lang)} val={`${data.total_revenue_iqd.toLocaleString()} ${t("iqd", lang)}`} icon="cash" color={colors.success} />
          <Stat label={t("totalOrders", lang)} val={data.total_orders} icon="bag" color={colors.primary} />
          <Stat label={t("totalProducts", lang)} val={data.total_products} icon="cube" color={colors.secondary} />
          <Stat label={t("pendingOrders", lang)} val={data.pending_orders} icon="time" color={colors.accent} />
        </View>

        <View style={styles.menuGrid}>
          <MenuTile icon="cube-outline" label={t("manageProducts", lang)} onPress={() => router.push("/admin/products")} testID="admin-products-tile" />
          <MenuTile icon="receipt-outline" label={t("manageOrders", lang)} onPress={() => router.push("/admin/orders")} testID="admin-orders-tile" />
          <MenuTile icon="pricetag-outline" label={t("manageDiscounts", lang)} onPress={() => router.push("/admin/discounts")} testID="admin-discounts-tile" />
        </View>

        {data.low_stock_products?.length > 0 && (
          <View style={[styles.alertCard, shadow]}>
            <View style={[styles.alertHead, { flexDirection: isAr ? "row-reverse" : "row" }]}>
              <Ionicons name="warning" size={20} color={colors.danger} />
              <Text style={styles.alertTitle}>{t("lowStock", lang)}</Text>
            </View>
            {data.low_stock_products.map((p: any) => (
              <View key={p.product_id} style={[styles.alertRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
                <Text style={styles.alertName}>{isAr ? p.name_ar : p.name_en}</Text>
                <Text style={styles.alertStock}>{p.stock} {isAr ? "قطعة" : "left"}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}

function Stat({ label, val, icon, color }: any) {
  return (
    <View style={[styles.statCard, shadow]} testID={`stat-${label}`}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.statVal}>{val}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuTile({ icon, label, onPress, testID }: any) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.tile, shadow]} testID={testID}>
      <Ionicons name={icon} size={28} color={colors.primary} />
      <Text style={styles.tileLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 18 },
  statCard: {
    width: "48%", padding: 16, gap: 6, backgroundColor: colors.surface,
    ...obtuse, borderWidth: 1, borderColor: colors.border,
  },
  statVal: { fontSize: 18, fontWeight: "900", color: colors.primary },
  statLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: "700" },
  menuGrid: { gap: 10, marginBottom: 18 },
  tile: {
    flexDirection: "row", gap: 14, alignItems: "center", padding: 18,
    backgroundColor: colors.surface, ...obtuse, borderWidth: 1, borderColor: colors.border,
  },
  tileLabel: { fontWeight: "900", color: colors.textPrimary, fontSize: 15 },
  alertCard: {
    backgroundColor: "#FFF8E8", padding: 14, ...obtuse,
    borderWidth: 2, borderColor: colors.danger,
  },
  alertHead: { gap: 8, alignItems: "center", marginBottom: 8 },
  alertTitle: { fontSize: 15, fontWeight: "900", color: colors.danger },
  alertRow: { paddingVertical: 6, gap: 8, alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#F2E0B0" },
  alertName: { color: colors.textPrimary, fontWeight: "700", flex: 1 },
  alertStock: { color: colors.danger, fontWeight: "900" },
});
