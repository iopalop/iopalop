import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../src/context";
import { t } from "../src/i18n";
import { colors, obtuse, obtuseSmall, shadow } from "../src/theme";
import { TopBar, BottomNav } from "../src/components/Nav";
import { ProductCarousel } from "../src/components/Carousel";
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
        {/* Modern Architectural Hero */}
        <View style={styles.hero} testID="hero-section">
          <Text style={[styles.heroSmall, { textAlign: isAr ? "right" : "left" }]}>
            {t("welcome", lang).toUpperCase()}
          </Text>
          <Text style={[styles.heroTitle, { textAlign: isAr ? "right" : "left" }]}>عراقچي ستور</Text>
          <View style={styles.heroLine} />
          <Text style={[styles.heroSub, { textAlign: isAr ? "right" : "left" }]}>{t("tagline", lang)}</Text>
          <View style={[styles.codBadge, { alignSelf: isAr ? "flex-end" : "flex-start" }]}>
            <Ionicons name="cash-outline" size={14} color={colors.primary} />
            <Text style={styles.codBadgeText}>{t("cod", lang)}</Text>
          </View>
        </View>

        {/* Shipping banner — minimal */}
        <View style={styles.shipBanner} testID="shipping-banner">
          <Ionicons name="airplane-outline" size={16} color={colors.primary} />
          <Text style={styles.shipText}>{t("shippingTo", lang)}</Text>
        </View>

        {/* Auto-rotating carousel - top deals */}
        {!loading && products.length > 0 && (
          <ProductCarousel products={products.slice(0, 6)} />
        )}

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

        {/* Cheapest products */}
        {!loading && products.length > 0 && (
          <>
            <View style={[styles.sectionRow, { flexDirection: isAr ? "row-reverse" : "row", marginTop: 24 }]}>
              <Ionicons name="pricetag" size={18} color={colors.danger} />
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>{t("cheapest", lang)}</Text>
            </View>
            <View style={styles.prodGrid}>
              {[...products]
                .sort((a, b) => a.price_iqd - b.price_iqd)
                .slice(0, 4)
                .map((p) => <ProductCard key={`cheap-${p.product_id}`} product={p} lang={lang} />)}
            </View>
          </>
        )}

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
    backgroundColor: colors.surfaceAlt,
    padding: 28,
    marginBottom: 16,
    borderRadius: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroSmall: { color: colors.primary, fontSize: 11, letterSpacing: 2.5, fontWeight: "700" },
  heroTitle: { color: colors.textPrimary, fontSize: 38, fontWeight: "900", letterSpacing: -1, lineHeight: 44 },
  heroLine: { width: 40, height: 3, backgroundColor: colors.primary, marginVertical: 6, borderRadius: 2 },
  heroSub: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, fontWeight: "500" },
  codBadge: {
    backgroundColor: "#FFF1E8",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#FFD9C2",
  },
  codBadgeText: { color: colors.primary, fontWeight: "700", fontSize: 11 },
  heroDecor: { display: "none" },
  diamond: { display: "none" },
  shipBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginBottom: 22,
  },
  shipText: { color: colors.textSecondary, fontSize: 12, flex: 1, fontWeight: "500" },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: colors.primary, marginBottom: 12 },
  sectionRow: { alignItems: "center", gap: 8, marginBottom: 12 },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  catCard: {
    width: "31%",
    aspectRatio: 1,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    borderRadius: 14,
  },
  catName: { fontSize: 11, fontWeight: "700", color: colors.textPrimary, textAlign: "center" },
  prodGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "space-between" },
  prodCard: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  imgWrap: { width: "100%", aspectRatio: 1, backgroundColor: colors.surfaceAlt },
  img: { width: "100%", height: "100%" },
  dropBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dropBadgeText: { color: "#fff", fontSize: 9, fontWeight: "900" },
  prodName: { fontSize: 13, fontWeight: "700", color: colors.textPrimary, minHeight: 36 },
  priceRow: { alignItems: "baseline", gap: 4 },
  price: { fontSize: 16, fontWeight: "900", color: colors.primary },
  iqd: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },
});
