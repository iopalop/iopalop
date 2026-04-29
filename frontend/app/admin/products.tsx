import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal,
  Image, Alert, ActivityIndicator, Switch, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../src/context";
import { t } from "../../src/i18n";
import { colors, obtuse, obtuseSmall, shadow } from "../../src/theme";
import { TopBar } from "../../src/components/Nav";
import { api } from "../../src/api";

const EMPTY = {
  product_id: null,
  name_ar: "",
  name_en: "",
  description_ar: "",
  description_en: "",
  price_iqd: "",
  category: "clothing",
  image_url: "",
  stock: "",
  sizes: "",
  colors: "",
  is_dropship: false,
  alibaba_link: "",
  low_stock_threshold: "5",
};

export default function AdminProducts() {
  const { lang, user, authLoading } = useApp();
  const isAr = lang === "ar";
  const [products, setProducts] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [p, c] = await Promise.all([api.get("/products"), api.get("/categories")]);
    setProducts(p);
    setCats(c);
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user?.is_admin) return;
    load();
  }, [user, authLoading]);

  const openAdd = () => { setForm(EMPTY); setShowForm(true); };
  const openEdit = (p: any) => {
    setForm({
      ...p,
      price_iqd: String(p.price_iqd),
      stock: String(p.stock),
      sizes: (p.sizes || []).join(","),
      colors: (p.colors || []).join(","),
      low_stock_threshold: String(p.low_stock_threshold || 5),
      alibaba_link: p.alibaba_link || "",
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name_ar || !form.name_en || !form.price_iqd || !form.image_url) {
      Alert.alert(t("error", lang), isAr ? "يرجى ملء الحقول المطلوبة" : "Please fill required fields");
      return;
    }
    setSaving(true);
    const payload = {
      name_ar: form.name_ar,
      name_en: form.name_en,
      description_ar: form.description_ar,
      description_en: form.description_en,
      price_iqd: parseFloat(form.price_iqd),
      category: form.category,
      image_url: form.image_url,
      stock: parseInt(form.stock || "0"),
      sizes: form.sizes ? form.sizes.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
      colors: form.colors ? form.colors.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
      is_dropship: !!form.is_dropship,
      alibaba_link: form.alibaba_link || null,
      low_stock_threshold: parseInt(form.low_stock_threshold || "5"),
    };
    try {
      if (form.product_id) {
        await api.put(`/products/${form.product_id}`, payload);
      } else {
        await api.post("/products", payload);
      }
      setShowForm(false);
      await load();
    } catch (e: any) {
      Alert.alert(t("error", lang), e.message);
    }
    setSaving(false);
  };

  const del = async (id: string) => {
    try {
      await api.del(`/products/${id}`);
      await load();
    } catch (e: any) {
      Alert.alert(t("error", lang), e.message);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <TopBar showBack title={t("manageProducts", lang)} />
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 100 }}>
        <TouchableOpacity onPress={openAdd} style={[styles.addBtn, shadow]} testID="add-product-btn">
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>{t("addProduct", lang)}</Text>
        </TouchableOpacity>

        {loading ? <ActivityIndicator color={colors.primary} /> : products.map((p) => (
          <View key={p.product_id} style={[styles.row, shadow]} testID={`product-row-${p.product_id}`}>
            <Image source={{ uri: p.image_url }} style={styles.img} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.name} numberOfLines={1}>{isAr ? p.name_ar : p.name_en}</Text>
              <Text style={styles.priceTxt}>{p.price_iqd.toLocaleString()} {t("iqd", lang)}</Text>
              <View style={[styles.metaRow]}>
                <View style={[styles.tag, p.stock <= p.low_stock_threshold && { backgroundColor: colors.danger }]}>
                  <Text style={styles.tagText}>{p.stock} {isAr ? "قطعة" : "stock"}</Text>
                </View>
                {p.is_dropship && (
                  <View style={[styles.tag, { backgroundColor: colors.accent }]}>
                    <Text style={styles.tagText}>{isAr ? "دروب" : "Dropship"}</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={() => openEdit(p)} style={styles.actBtn} testID={`edit-${p.product_id}`}>
              <Ionicons name="pencil" size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => del(p.product_id)} style={styles.actBtn} testID={`del-${p.product_id}`}>
              <Ionicons name="trash" size={18} color={colors.danger} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal visible={showForm} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <View style={[styles.modalHead, { flexDirection: isAr ? "row-reverse" : "row" }]}>
              <Text style={styles.modalTitle}>{form.product_id ? t("editProduct", lang) : t("addProduct", lang)}</Text>
              <TouchableOpacity onPress={() => setShowForm(false)} testID="close-form">
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ gap: 10, paddingBottom: 20 }}>
              <FormField label={t("productNameAr", lang)} v={form.name_ar} on={(v: string) => setForm({ ...form, name_ar: v })} testID="f-name-ar" />
              <FormField label={t("productNameEn", lang)} v={form.name_en} on={(v: string) => setForm({ ...form, name_en: v })} testID="f-name-en" />
              <FormField label={`${t("description", lang)} (AR)`} v={form.description_ar} on={(v: string) => setForm({ ...form, description_ar: v })} multiline />
              <FormField label={`${t("description", lang)} (EN)`} v={form.description_en} on={(v: string) => setForm({ ...form, description_en: v })} multiline />
              <FormField label={t("price", lang)} v={form.price_iqd} on={(v: string) => setForm({ ...form, price_iqd: v })} kb="numeric" testID="f-price" />
              <FormField label={t("stock", lang)} v={form.stock} on={(v: string) => setForm({ ...form, stock: v })} kb="numeric" testID="f-stock" />
              <FormField label={t("imageUrl", lang)} v={form.image_url} on={(v: string) => setForm({ ...form, image_url: v })} testID="f-image" />
              <Text style={styles.label}>{t("category", lang)}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {cats.map((c: any) => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setForm({ ...form, category: c.id })}
                    style={[styles.catChip, form.category === c.id && styles.catChipActive]}
                  >
                    <Text style={[styles.catChipText, form.category === c.id && { color: "#fff" }]}>{isAr ? c.name_ar : c.name_en}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <FormField label={t("sizesCsv", lang)} v={form.sizes} on={(v: string) => setForm({ ...form, sizes: v })} />
              <FormField label={t("colorsCsv", lang)} v={form.colors} on={(v: string) => setForm({ ...form, colors: v })} />
              <View style={[styles.switchRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
                <Text style={{ flex: 1, fontWeight: "800", color: colors.primary }}>{t("isDropship", lang)}</Text>
                <Switch value={!!form.is_dropship} onValueChange={(v) => setForm({ ...form, is_dropship: v })} testID="f-dropship" />
              </View>
              {form.is_dropship && (
                <FormField label={t("alibabaLink", lang)} v={form.alibaba_link} on={(v: string) => setForm({ ...form, alibaba_link: v })} testID="f-alibaba" />
              )}
              <TouchableOpacity onPress={save} style={[styles.saveBtn, saving && { opacity: 0.6 }]} disabled={saving} testID="save-product-btn">
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t("save", lang)}</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function FormField({ label, v, on, kb, multiline, testID }: any) {
  const { lang } = useApp();
  return (
    <View>
      <Text style={[styles.label, { textAlign: lang === "ar" ? "right" : "left" }]}>{label}</Text>
      <TextInput
        value={v}
        onChangeText={on}
        keyboardType={kb}
        multiline={multiline}
        style={[styles.input, multiline && { minHeight: 60, textAlignVertical: "top" }]}
        placeholderTextColor={colors.textMuted}
        testID={testID}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  addBtn: {
    flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.primary, paddingVertical: 14, ...obtuse, marginBottom: 12,
  },
  addBtnText: { color: "#fff", fontWeight: "900", fontSize: 14 },
  row: {
    flexDirection: "row", gap: 10, padding: 10, alignItems: "center",
    backgroundColor: colors.surface, ...obtuseSmall, marginBottom: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  img: { width: 56, height: 56, ...obtuseSmall, backgroundColor: "#eee" },
  name: { fontWeight: "800", color: colors.textPrimary, fontSize: 13 },
  priceTxt: { color: colors.primary, fontWeight: "900", fontSize: 13 },
  metaRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  tag: { backgroundColor: colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagText: { color: "#fff", fontSize: 9, fontWeight: "900" },
  actBtn: { padding: 8 },
  modalWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: colors.background, padding: 18, maxHeight: "92%", borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalHead: { justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: "900", color: colors.primary },
  label: { fontSize: 12, fontWeight: "800", color: colors.primary, marginBottom: 4 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, paddingVertical: 10, ...obtuseSmall, fontSize: 14, color: colors.textPrimary,
  },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 8, ...obtuseSmall,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catChipText: { fontWeight: "700", color: colors.textPrimary, fontSize: 12 },
  switchRow: { alignItems: "center", padding: 8 },
  saveBtn: { backgroundColor: colors.primary, paddingVertical: 14, ...obtuse, alignItems: "center", marginTop: 14 },
  saveBtnText: { color: "#fff", fontWeight: "900", fontSize: 15 },
});
