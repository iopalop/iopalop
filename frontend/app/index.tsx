import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../src/context";
import { t } from "../src/i18n";
import { colors, obtuse, obtuseSmall, shadow } from "../src/theme";
import { TopBar, BottomNav } from "../src/components/Nav";
import { api } from "../src/api";

interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  icon: string;
}
interface Product {
  product_id: string;
  name_ar: string;
  name_en: string;
  price_iqd: number;
  image_url: string;
  category: string;
  stock: number;
  is_dropship?: boolean;
}

export default function HomeScreen() {
  const { lang } = useApp();
  const router = useRouter();
  const [cats, setCats] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const isAr = lang === "ar";

  useEffect(() => {
    (async () => {
      try {
        const [c, p] = await Promise.all([api.get("/categories"), api.get("/products")]);
        setCats(c);
        setProducts(p);
      } catch (e) {
        console.log("home err", e);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <TopBar />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, { flexDirection: isAr ? "row-reverse" : "row" }]} testID="hero-section">
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={[styles.heroSmall, { textAlign: isAr ? "right" : "left" }]}>
              {t("welcome", lang)}
            </Text>
            <Text style={[styles.heroTitle, { textAlign: isAr ? "right" : "left" }]}>عراقچي ستور</Text>
            <Text style={[styles.heroSub, { textAlign: isAr ? "right" : "left" }]}>{t("tagline", lang)}</Text>
            <View style={[styles.codBadge, { alignSelf: isAr ? "flex-end" : "flex-start" }]}>
              <Ionicons name="cash-outline" size={14} color={colors.primaryDark} />
              <Text style={styles.codBadgeText}>{t("cod", lang)}</Text>
            </View>
          </View>
          <View style={styles.heroDecor}>
            <View style={styles.diamond} />
            <View style={[styles.diamond, { backgroundColor: colors.accent, marginTop: -8 }]} />
            <View style={[styles.diamond, { backgroundColor: colors.primary }]} />
          </View>
        </View>

        {/* Shipping banner */}
        <View style={styles.shipBanner} testID="shipping-banner">
          <Ionicons name="airplane-outline" size={18} color={colors.secondary} />
          <Text style={styles.shipText}>{t("shippingTo", lang)}</Text>
        </View>

        {/* Categories */}
        <Text style={[styles.sectionTitle, { textAlign: isAr ? "right" : "left" }]}>{t("shopByCategory", lang)}</Text>
        <View style={styles.catGrid}>
          {cats.map((c, i) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => router.push(`/category/${c.id}`)}
              style={[styles.catCard, i % 2 === 0 ? obtuse : obtuseSmall]}
              testID={`category-card-${c.id}`}
            >
              <Ionicons name={c.icon as any} size={28} color={colors.primary} />
              <Text style={styles.catName} numberOfLines={1}>{isAr ? c.name_ar : c.name_en}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Featured products */}
        <Text style={[styles.sectionTitle, { textAlign: isAr ? "right" : "left", marginTop: 24 }]}>{t("featured", lang)}</Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />
        ) : (
          <View style={styles.prodGrid}>
            {products.slice(0, 8).map((p) => (
              <ProductCard key={p.product_id} product={p} lang={lang} />
            ))}
          </View>
        )}
        <View style={{ height: 16 }} />
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}

export function ProductCard({ product, lang }: { product: Product; lang: "ar" | "en" }) {
  const router = useRouter();
  const isAr = lang === "ar";
  return (
    <TouchableOpacity
      onPress={() => router.push(`/product/${product.product_id}`)}
      style={[styles.prodCard, shadow]}
      testID={`product-card-${product.product_id}`}
    >
      <View style={styles.imgWrap}>
        <Image source={{ uri: product.image_url }} style={styles.img} />
        {product.is_dropship && (
          <View style={styles.dropBadge}>
            <Text style={styles.dropBadgeText}>{isAr ? "شحن دولي" : "Worldwide"}</Text>
          </View>
        )}
      </View>
      <View style={{ padding: 10, gap: 6 }}>
        <Text style={styles.prodName} numberOfLines={2}>{isAr ? product.name_ar : product.name_en}</Text>
        <View style={[styles.priceRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
          <Text style={styles.price}>{product.price_iqd.toLocaleString()}</Text>
          <Text style={styles.iqd}>{t("iqd", lang)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 24 },
  hero: {
    ...obtuse,
    backgroundColor: colors.primary,
    padding: 22,
    marginBottom: 18,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.secondary,
    alignItems: "center",
    gap: 10,
  },
  heroSmall: { color: colors.secondary, fontSize: 12, letterSpacing: 1, fontWeight: "700" },
  heroTitle: { color: "#fff", fontSize: 32, fontWeight: "900", letterSpacing: 0.5 },
  heroSub: { color: "#E5E0D8", fontSize: 13, lineHeight: 18 },
  codBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  codBadgeText: { color: colors.primaryDark, fontWeight: "800", fontSize: 11 },
  heroDecor: { width: 60, alignItems: "center", justifyContent: "center" },
  diamond: {
    width: 24,
    height: 24,
    backgroundColor: colors.secondary,
    transform: [{ rotate: "45deg" }],
    marginVertical: 4,
  },
  shipBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#FFF8E8",
    borderWidth: 1,
    borderColor: colors.secondary,
    ...obtuseSmall,
    marginBottom: 16,
  },
  shipText: { color: colors.primaryDark, fontSize: 12, flex: 1, fontWeight: "600" },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: colors.primary, marginBottom: 12 },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  catCard: {
    width: "31%",
    aspectRatio: 1,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
  },
  catName: { fontSize: 11, fontWeight: "700", color: colors.textPrimary, textAlign: "center" },
  prodGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "space-between" },
  prodCard: {
    width: "48%",
    backgroundColor: colors.surface,
    ...obtuse,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  imgWrap: { width: "100%", aspectRatio: 1, backgroundColor: "#eee" },
  img: { width: "100%", height: "100%" },
  dropBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  dropBadgeText: { color: "#fff", fontSize: 9, fontWeight: "900" },
  prodName: { fontSize: 13, fontWeight: "700", color: colors.textPrimary, minHeight: 36 },
  priceRow: { alignItems: "baseline", gap: 4 },
  price: { fontSize: 16, fontWeight: "900", color: colors.primary },
  iqd: { fontSize: 11, color: colors.textSecondary, fontWeight: "600" },
});
