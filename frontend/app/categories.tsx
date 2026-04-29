import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../src/context";
import { t } from "../src/i18n";
import { colors, obtuse, obtuseSmall } from "../src/theme";
import { TopBar, BottomNav } from "../src/components/Nav";
import { api } from "../src/api";

export default function CategoriesScreen() {
  const { lang } = useApp();
  const router = useRouter();
  const isAr = lang === "ar";
  const [cats, setCats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/categories").then((c) => { setCats(c); setLoading(false); });
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <TopBar title={t("categories", lang)} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {loading ? <ActivityIndicator color={colors.primary} /> : cats.map((c, i) => (
          <TouchableOpacity
            key={c.id}
            onPress={() => router.push(`/category/${c.id}`)}
            style={[styles.row, i % 2 === 0 ? obtuse : obtuseSmall, { flexDirection: isAr ? "row-reverse" : "row" }]}
            testID={`category-row-${c.id}`}
          >
            <View style={styles.iconBox}>
              <Ionicons name={c.icon} size={26} color={colors.primary} />
            </View>
            <Text style={styles.name}>{isAr ? c.name_ar : c.name_en}</Text>
            <Ionicons name={isAr ? "chevron-back" : "chevron-forward"} size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  row: {
    backgroundColor: colors.surface,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBox: {
    width: 52,
    height: 52,
    backgroundColor: "#FFF8E8",
    alignItems: "center",
    justifyContent: "center",
    ...obtuseSmall,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  name: { flex: 1, fontWeight: "800", fontSize: 16, color: colors.textPrimary },
});
