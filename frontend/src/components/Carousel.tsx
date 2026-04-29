import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, obtuse } from "../theme";
import { t } from "../i18n";
import { useApp } from "../context";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = SCREEN_W - 32;
const AUTO_MS = 3500;

interface Product {
  product_id: string;
  name_ar: string;
  name_en: string;
  price_iqd: number;
  image_url: string;
  is_dropship?: boolean;
}

export function ProductCarousel({ products }: { products: Product[] }) {
  const ref = useRef<FlatList<Product>>(null);
  const [idx, setIdx] = useState(0);
  const router = useRouter();
  const { lang } = useApp();
  const isAr = lang === "ar";

  useEffect(() => {
    if (products.length < 2) return;
    const id = setInterval(() => {
      setIdx((prev) => {
        const next = (prev + 1) % products.length;
        try { ref.current?.scrollToIndex({ index: next, animated: true }); } catch {}
        return next;
      });
    }, AUTO_MS);
    return () => clearInterval(id);
  }, [products.length]);

  if (products.length === 0) return null;

  return (
    <View style={styles.wrap} testID="product-carousel">
      <FlatList
        ref={ref}
        data={products}
        keyExtractor={(item) => item.product_id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_W + 12}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / (CARD_W + 12));
          setIdx(Math.max(0, Math.min(products.length - 1, i)));
        }}
        getItemLayout={(_, i) => ({ length: CARD_W + 12, offset: (CARD_W + 12) * i, index: i })}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.slide, { width: CARD_W }]}
            onPress={() => router.push(`/product/${item.product_id}`)}
            testID={`carousel-slide-${item.product_id}`}
          >
            <Image source={{ uri: item.image_url }} style={styles.img} />
            <View style={styles.overlay}>
              <View style={styles.badgeBig}>
                <Ionicons name="flame" size={14} color="#fff" />
                <Text style={styles.badgeBigText}>{t("trending", lang)}</Text>
              </View>
              <Text style={[styles.name, { textAlign: isAr ? "right" : "left" }]} numberOfLines={2}>
                {isAr ? item.name_ar : item.name_en}
              </Text>
              <View style={[styles.priceRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
                <Text style={styles.price}>{item.price_iqd.toLocaleString()}</Text>
                <Text style={styles.iqd}>{t("iqd", lang)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
      <View style={styles.dots}>
        {products.map((_, i) => (
          <View key={i} style={[styles.dot, i === idx && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 18 },
  slide: {
    height: 220,
    marginRight: 12,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: colors.surfaceAlt,
  },
  img: { width: "100%", height: "100%", position: "absolute" },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 18,
    backgroundColor: "rgba(0,0,0,0.65)",
    gap: 6,
  },
  badgeBig: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primary,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeBigText: { color: "#fff", fontWeight: "900", fontSize: 10, letterSpacing: 0.5 },
  name: { color: "#fff", fontWeight: "900", fontSize: 17, letterSpacing: -0.3 },
  priceRow: { alignItems: "baseline", gap: 4 },
  price: { color: colors.primaryGlow, fontSize: 24, fontWeight: "900", letterSpacing: -0.5 },
  iqd: { color: "#FFE5D0", fontSize: 12, fontWeight: "600" },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 22 },
});
