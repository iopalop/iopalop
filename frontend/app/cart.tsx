import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput,
  KeyboardAvoidingView, Platform, Alert, Linking, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../src/context";
import { t } from "../src/i18n";
import { colors, obtuse, obtuseSmall, shadow } from "../src/theme";
import { TopBar, BottomNav } from "../src/components/Nav";
import { api } from "../src/api";

export default function CartScreen() {
  const { lang, cart, removeFromCart, updateQty, clearCart, user } = useApp();
  const router = useRouter();
  const isAr = lang === "ar";

  const [step, setStep] = useState<"cart" | "checkout" | "done">("cart");
  const [discountCode, setDiscountCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState(isAr ? "العراق" : "Iraq");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);

  const subtotal = cart.reduce((s, i) => s + i.price_iqd * i.quantity, 0);
  const discountVal = subtotal * (discountPercent / 100);
  const total = subtotal - discountVal;

  const applyDiscount = async () => {
    try {
      const res = await api.get(`/discounts/validate/${discountCode.trim()}`);
      setDiscountPercent(res.percent);
      Alert.alert(t("success", lang), `${res.code}: ${res.percent}%`);
    } catch (e: any) {
      setDiscountPercent(0);
      Alert.alert(t("error", lang), t("invalidCode", lang));
    }
  };

  const placeOrder = async () => {
    if (!name || !phone || !address || !city) {
      Alert.alert(t("error", lang), isAr ? "يرجى ملء جميع الحقول" : "Please fill all fields");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        items: cart.map((c) => ({ product_id: c.product_id, quantity: c.quantity, size: c.size, color: c.color })),
        customer_name: name,
        customer_phone: phone,
        customer_address: address,
        customer_city: city,
        customer_country: country,
        notes,
        discount_code: discountPercent > 0 ? discountCode.trim() : undefined,
      };
      const res = await api.post("/orders", payload);
      setOrderResult(res);
      clearCart();
      setStep("done");
      // Open WhatsApp automatically
      Linking.openURL(res.whatsapp_link).catch(() => {});
    } catch (e: any) {
      Alert.alert(t("error", lang), e.message);
    }
    setSubmitting(false);
  };

  // ============ Done state ============
  if (step === "done" && orderResult) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <TopBar />
        <View style={styles.doneWrap}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={60} color="#fff" />
          </View>
          <Text style={styles.doneTitle}>{t("orderPlaced", lang)}</Text>
          <Text style={styles.doneOrder}>{t("orderId", lang)}: {orderResult.order.order_id}</Text>
          <Text style={styles.doneTotal}>
            {t("total", lang)}: {orderResult.order.total_iqd.toLocaleString()} {t("iqd", lang)}
          </Text>
          <View style={styles.codBadgeBig}>
            <Ionicons name="cash-outline" size={18} color={colors.primaryDark} />
            <Text style={styles.codBadgeBigText}>{t("cod", lang)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.waBtn, shadow]}
            onPress={() => Linking.openURL(orderResult.whatsapp_link)}
            testID="whatsapp-btn"
          >
            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
            <Text style={styles.waBtnText}>{t("contactWhatsApp", lang)}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setStep("cart"); router.push("/"); }} style={styles.linkBtn}>
            <Text style={styles.linkText}>{t("home", lang)}</Text>
          </TouchableOpacity>
        </View>
        <BottomNav />
      </SafeAreaView>
    );
  }

  // ============ Empty cart ============
  if (cart.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <TopBar title={t("cart", lang)} />
        <View style={styles.emptyWrap}>
          <Ionicons name="bag-outline" size={80} color={colors.textMuted} />
          <Text style={styles.emptyText}>{t("emptyCart", lang)}</Text>
          <TouchableOpacity onPress={() => router.push("/")} style={[styles.btnPrimary, shadow]} testID="start-shopping-btn">
            <Text style={styles.btnPrimaryText}>{t("startShopping", lang)}</Text>
          </TouchableOpacity>
        </View>
        <BottomNav />
      </SafeAreaView>
    );
  }

  // ============ Checkout state ============
  if (step === "checkout") {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <TopBar showBack title={t("checkout", lang)} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}>
            <Field label={t("name", lang)} value={name} onChange={setName} testID="ck-name" />
            <Field label={t("phone", lang)} value={phone} onChange={setPhone} keyboardType="phone-pad" testID="ck-phone" />
            <Field label={t("address", lang)} value={address} onChange={setAddress} multiline testID="ck-address" />
            <Field label={t("city", lang)} value={city} onChange={setCity} testID="ck-city" />
            <Field label={t("country", lang)} value={country} onChange={setCountry} testID="ck-country" />
            <Field label={t("notes", lang)} value={notes} onChange={setNotes} multiline testID="ck-notes" />

            <View style={styles.summary}>
              <SumRow label={t("subtotal", lang)} val={`${subtotal.toLocaleString()} ${t("iqd", lang)}`} />
              {discountPercent > 0 && (
                <SumRow label={`${t("discount", lang)} (${discountPercent}%)`} val={`-${discountVal.toLocaleString()} ${t("iqd", lang)}`} accent />
              )}
              <View style={styles.divider} />
              <SumRow label={t("total", lang)} val={`${total.toLocaleString()} ${t("iqd", lang)}`} bold />
              <View style={styles.codBadgeBig}>
                <Ionicons name="cash-outline" size={16} color={colors.primaryDark} />
                <Text style={styles.codBadgeBigText}>{t("cod", lang)}</Text>
              </View>
            </View>
          </ScrollView>
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.btnPrimary, shadow, submitting && { opacity: 0.6 }]}
              onPress={placeOrder}
              disabled={submitting}
              testID="place-order-btn"
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>{t("placeOrder", lang)}</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ============ Cart state ============
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <TopBar title={t("cart", lang)} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {cart.map((item, idx) => (
          <View key={idx} style={[styles.cartItem, { flexDirection: isAr ? "row-reverse" : "row" }]} testID={`cart-item-${idx}`}>
            <Image source={{ uri: item.image_url }} style={styles.cartImg} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.cartName} numberOfLines={2}>{isAr ? item.name_ar : item.name_en}</Text>
              {(item.size || item.color) && (
                <Text style={styles.cartMeta}>
                  {item.size ? `${t("size", lang)}: ${item.size}` : ""} {item.color ? `· ${t("color", lang)}: ${item.color}` : ""}
                </Text>
              )}
              <Text style={styles.cartPrice}>{(item.price_iqd * item.quantity).toLocaleString()} {t("iqd", lang)}</Text>
              <View style={[styles.qtyRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
                <TouchableOpacity onPress={() => updateQty(idx, item.quantity - 1)} style={styles.qtyBtn} testID={`item-${idx}-minus`}>
                  <Ionicons name="remove" size={16} color={colors.primary} />
                </TouchableOpacity>
                <Text style={{ minWidth: 24, textAlign: "center", fontWeight: "800" }}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => updateQty(idx, item.quantity + 1)} style={styles.qtyBtn} testID={`item-${idx}-plus`}>
                  <Ionicons name="add" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity onPress={() => removeFromCart(idx)} style={styles.removeBtn} testID={`item-${idx}-remove`}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </TouchableOpacity>
          </View>
        ))}

        {/* Discount */}
        <View style={[styles.discRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
          <TextInput
            placeholder={t("discountCode", lang)}
            value={discountCode}
            onChangeText={setDiscountCode}
            style={[styles.input, { flex: 1, textAlign: isAr ? "right" : "left" }]}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            testID="discount-input"
          />
          <TouchableOpacity onPress={applyDiscount} style={[styles.applyBtn, shadow]} testID="apply-discount-btn">
            <Text style={styles.applyText}>{t("applyCode", lang)}</Text>
          </TouchableOpacity>
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <SumRow label={t("subtotal", lang)} val={`${subtotal.toLocaleString()} ${t("iqd", lang)}`} />
          {discountPercent > 0 && (
            <SumRow label={`${t("discount", lang)} (${discountPercent}%)`} val={`-${discountVal.toLocaleString()} ${t("iqd", lang)}`} accent />
          )}
          <View style={styles.divider} />
          <SumRow label={t("total", lang)} val={`${total.toLocaleString()} ${t("iqd", lang)}`} bold />
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => setStep("checkout")} style={[styles.btnPrimary, shadow]} testID="checkout-btn">
          <Text style={styles.btnPrimaryText}>{t("checkout", lang)}</Text>
        </TouchableOpacity>
      </View>
      <BottomNav />
    </SafeAreaView>
  );
}

function Field({ label, value, onChange, keyboardType, multiline, testID }: any) {
  const { lang } = useApp();
  return (
    <View>
      <Text style={[styles.fieldLabel, { textAlign: lang === "ar" ? "right" : "left" }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.input, multiline && { minHeight: 70, textAlignVertical: "top" }, { textAlign: lang === "ar" ? "right" : "left" }]}
        placeholderTextColor={colors.textMuted}
        testID={testID}
      />
    </View>
  );
}

function SumRow({ label, val, bold, accent }: any) {
  const { lang } = useApp();
  return (
    <View style={[styles.sumRow, { flexDirection: lang === "ar" ? "row-reverse" : "row" }]}>
      <Text style={[styles.sumLabel, bold && { fontWeight: "900", fontSize: 16 }]}>{label}</Text>
      <Text style={[styles.sumVal, bold && { fontWeight: "900", fontSize: 18, color: colors.primary }, accent && { color: colors.accent }]}>{val}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  cartItem: {
    backgroundColor: colors.surface,
    padding: 12,
    marginBottom: 10,
    gap: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    ...obtuse,
  },
  cartImg: { width: 70, height: 70, ...obtuseSmall, backgroundColor: "#eee" },
  cartName: { fontWeight: "800", color: colors.textPrimary, fontSize: 14 },
  cartMeta: { fontSize: 11, color: colors.textSecondary },
  cartPrice: { fontWeight: "900", color: colors.primary, fontSize: 14 },
  qtyRow: { gap: 10, alignItems: "center", marginTop: 2 },
  qtyBtn: {
    width: 28, height: 28, borderWidth: 1, borderColor: colors.border, ...obtuseSmall,
    alignItems: "center", justifyContent: "center", backgroundColor: colors.background,
  },
  removeBtn: { padding: 8 },
  discRow: { gap: 8, marginTop: 14, marginBottom: 14 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 12, ...obtuseSmall, color: colors.textPrimary, fontSize: 14,
  },
  applyBtn: { paddingHorizontal: 22, justifyContent: "center", backgroundColor: colors.secondary, ...obtuseSmall },
  applyText: { color: colors.primaryDark, fontWeight: "900" },
  summary: {
    backgroundColor: colors.surface, padding: 16, ...obtuse,
    borderWidth: 1, borderColor: colors.border, gap: 8, marginTop: 4,
  },
  sumRow: { justifyContent: "space-between", alignItems: "center" },
  sumLabel: { color: colors.textSecondary, fontWeight: "600" },
  sumVal: { color: colors.textPrimary, fontWeight: "700" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  fieldLabel: { fontSize: 12, fontWeight: "800", color: colors.primary, marginBottom: 4 },
  codBadgeBig: {
    backgroundColor: colors.secondary, paddingHorizontal: 14, paddingVertical: 8,
    flexDirection: "row", gap: 6, alignItems: "center", alignSelf: "center",
    ...obtuseSmall, marginTop: 12,
  },
  codBadgeBigText: { color: colors.primaryDark, fontWeight: "900", fontSize: 13 },
  footer: { padding: 12, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  btnPrimary: { backgroundColor: colors.primary, paddingVertical: 16, ...obtuse, alignItems: "center" },
  btnPrimaryText: { color: "#fff", fontWeight: "900", fontSize: 16 },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
  emptyText: { fontSize: 18, color: colors.textSecondary, fontWeight: "700" },
  doneWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  successCircle: {
    width: 110, height: 110, borderRadius: 55, backgroundColor: colors.success,
    alignItems: "center", justifyContent: "center",
  },
  doneTitle: { fontSize: 22, fontWeight: "900", color: colors.primary, textAlign: "center" },
  doneOrder: { fontSize: 14, color: colors.textSecondary, fontWeight: "700" },
  doneTotal: { fontSize: 18, color: colors.primary, fontWeight: "900" },
  waBtn: {
    flexDirection: "row", gap: 10, alignItems: "center",
    backgroundColor: "#25D366", paddingHorizontal: 24, paddingVertical: 14, ...obtuse,
  },
  waBtnText: { color: "#fff", fontWeight: "900", fontSize: 15 },
  linkBtn: { padding: 12 },
  linkText: { color: colors.primary, fontWeight: "700" },
});
