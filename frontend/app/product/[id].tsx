import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../src/context";
import { t } from "../../src/i18n";
import { colors, obtuse, obtuseSmall, shadow } from "../../src/theme";
import { TopBar } from "../../src/components/Nav";
import { api } from "../../src/api";

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { lang, addToCart } = useApp();
  const isAr = lang === "ar";
  const [product, setProduct] = useState<any>(null);
  const [size, setSize] = useState<string | undefined>();
  const [color, setColor] = useState<string | undefined>();
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/products/${id}`).then((p) => {
      setProduct(p);
      setSize(p.sizes?.[0]);
      setColor(p.colors?.[0]);
      setLoading(false);
    });
  }, [id]);

  if (loading || !product) {
    return (
      <SafeAreaView style={styles.safe}>
        <TopBar showBack />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const handleAdd = (buyNow: boolean) => {
    if (product.stock < qty) {
      Alert.alert(t("error", lang), t("outOfStock", lang));
      return;
    }
    addToCart({
      product_id: product.product_id,
      name_ar: product.name_ar,
      name_en: product.name_en,
      price_iqd: product.price_iqd,
      image_url: product.image_url,
      quantity: qty,
      size,
      color,
    });
    if (buyNow) router.push("/cart");
    else Alert.alert(t("success", lang), isAr ? "تمت الإضافة إلى السلة" : "Added to cart");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <TopBar showBack />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.imgBox}>
          <Image source={{ uri: product.image_url }} style={styles.img} />
          {product.is_dropship && (
            <View style={styles.dropBadge}>
              <Ionicons name="airplane" size={12} color="#fff" />
              <Text style={styles.dropBadgeText}>{isAr ? "شحن دولي" : "Worldwide Shipping"}</Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          <Text style={[styles.name, { textAlign: isAr ? "right" : "left" }]}>{isAr ? product.name_ar : product.name_en}</Text>
          <View style={[styles.priceRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
            <Text style={styles.price}>{product.price_iqd.toLocaleString()}</Text>
            <Text style={styles.iqd}>{t("iqd", lang)}</Text>
          </View>

          <View style={styles.codBadge}>
            <Ionicons name="cash-outline" size={16} color={colors.primaryDark} />
            <Text style={styles.codBadgeText}>{t("cod", lang)}</Text>
          </View>

          {!!(isAr ? product.description_ar : product.description_en) && (
            <Text style={[styles.desc, { textAlign: isAr ? "right" : "left" }]}>{isAr ? product.description_ar : product.description_en}</Text>
          )}

          <View style={[styles.stockRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
            <Ionicons
              name={product.stock > 0 ? "checkmark-circle" : "close-circle"}
              size={16}
              color={product.stock > 0 ? colors.success : colors.danger}
            />
            <Text style={[styles.stockText, { color: product.stock > 0 ? colors.success : colors.danger }]}>
              {product.stock > 0 ? `${t("inStock", lang)} (${product.stock})` : t("outOfStock", lang)}
            </Text>
          </View>

          {product.sizes?.length > 0 && (
            <>
              <Text style={[styles.label, { textAlign: isAr ? "right" : "left" }]}>{t("size", lang)}</Text>
              <View style={[styles.optRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
                {product.sizes.map((s: string) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setSize(s)}
                    style={[styles.optChip, size === s && styles.optChipActive]}
                    testID={`size-${s}`}
                  >
                    <Text style={[styles.optText, size === s && { color: "#fff" }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {product.colors?.length > 0 && (
            <>
              <Text style={[styles.label, { textAlign: isAr ? "right" : "left" }]}>{t("color", lang)}</Text>
              <View style={[styles.optRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
                {product.colors.map((c: string) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setColor(c)}
                    style={[styles.optChip, color === c && styles.optChipActive]}
                    testID={`color-${c}`}
                  >
                    <Text style={[styles.optText, color === c && { color: "#fff" }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Text style={[styles.label, { textAlign: isAr ? "right" : "left" }]}>{t("quantity", lang)}</Text>
          <View style={[styles.qtyRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
            <TouchableOpacity onPress={() => setQty((q) => Math.max(1, q - 1))} style={styles.qtyBtn} testID="qty-minus">
              <Ionicons name="remove" size={20} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.qtyVal}>{qty}</Text>
            <TouchableOpacity onPress={() => setQty((q) => q + 1)} style={styles.qtyBtn} testID="qty-plus">
              <Ionicons name="add" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { flexDirection: isAr ? "row-reverse" : "row" }]}>
        <TouchableOpacity onPress={() => handleAdd(false)} style={[styles.btnSecondary, shadow]} testID="add-cart-btn">
          <Ionicons name="bag-add-outline" size={18} color={colors.primary} />
          <Text style={styles.btnSecondaryText}>{t("addToCart", lang)}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleAdd(true)} style={[styles.btnPrimary, shadow]} testID="buy-now-btn">
          <Text style={styles.btnPrimaryText}>{t("buyNow", lang)}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  imgBox: { width: "100%", aspectRatio: 1, backgroundColor: "#eee" },
  img: { width: "100%", height: "100%" },
  dropBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  dropBadgeText: { color: "#fff", fontWeight: "800", fontSize: 11 },
  body: { padding: 16, gap: 10 },
  name: { fontSize: 22, fontWeight: "900", color: colors.textPrimary },
  priceRow: { alignItems: "baseline", gap: 6 },
  price: { fontSize: 28, fontWeight: "900", color: colors.primary },
  iqd: { fontSize: 14, color: colors.textSecondary, fontWeight: "700" },
  codBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    alignSelf: "flex-start",
    ...obtuseSmall,
  },
  codBadgeText: { color: colors.primaryDark, fontWeight: "900", fontSize: 12 },
  desc: { color: colors.textSecondary, lineHeight: 20, marginTop: 6 },
  stockRow: { alignItems: "center", gap: 6, marginTop: 4 },
  stockText: { fontWeight: "700", fontSize: 13 },
  label: { fontSize: 13, fontWeight: "800", color: colors.primary, marginTop: 12 },
  optRow: { flexWrap: "wrap", gap: 8 },
  optChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...obtuseSmall,
  },
  optChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  optText: { fontWeight: "700", color: colors.textPrimary, fontSize: 13 },
  qtyRow: { alignItems: "center", gap: 14, marginTop: 4 },
  qtyBtn: {
    width: 40,
    height: 40,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    ...obtuseSmall,
  },
  qtyVal: { fontSize: 18, fontWeight: "900", minWidth: 30, textAlign: "center", color: colors.primary },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    gap: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  btnSecondary: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    ...obtuse,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  btnSecondaryText: { color: colors.primary, fontWeight: "900" },
  btnPrimary: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: colors.primary,
    ...obtuse,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimaryText: { color: "#fff", fontWeight: "900", fontSize: 15 },
});
