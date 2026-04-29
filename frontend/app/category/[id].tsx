import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useApp } from "../../src/context";
import { colors } from "../../src/theme";
import { TopBar, BottomNav } from "../../src/components/Nav";
import { api } from "../../src/api";
import { ProductCard } from "../index";

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lang } = useApp();
  const [products, setProducts] = useState<any[]>([]);
  const [cat, setCat] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get(`/products?category=${id}`), api.get("/categories")]).then(([p, c]) => {
      setProducts(p);
      setCat(c.find((x: any) => x.id === id));
      setLoading(false);
    });
  }, [id]);

  const title = cat ? (lang === "ar" ? cat.name_ar : cat.name_en) : "";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <TopBar showBack title={title} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : products.length === 0 ? (
          <Text style={styles.empty}>{lang === "ar" ? "لا توجد منتجات" : "No products yet"}</Text>
        ) : (
          <View style={styles.grid}>
            {products.map((p) => <ProductCard key={p.product_id} product={p} lang={lang} />)}
          </View>
        )}
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "space-between" },
  empty: { textAlign: "center", marginTop: 40, color: colors.textSecondary },
});
