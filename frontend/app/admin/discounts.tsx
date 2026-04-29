import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform, Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../src/context";
import { t } from "../../src/i18n";
import { colors, obtuse, obtuseSmall, shadow } from "../../src/theme";
import { TopBar } from "../../src/components/Nav";
import { api } from "../../src/api";

export default function AdminDiscounts() {
  const { lang } = useApp();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState("");
  const [active, setActive] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setItems(await api.get("/discounts")); } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!code || !percent) return;
    try {
      await api.post("/discounts", { code: code.trim(), percent: parseFloat(percent), active });
      setCode(""); setPercent(""); setShowForm(false);
      await load();
    } catch (e: any) { Alert.alert(t("error", lang), e.message); }
  };

  const del = async (id: string) => {
    try { await api.del(`/discounts/${id}`); await load(); } catch {}
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <TopBar showBack title={t("manageDiscounts", lang)} />
      <ScrollView contentContainerStyle={{ padding: 14 }}>
        <TouchableOpacity onPress={() => setShowForm(true)} style={[styles.addBtn, shadow]} testID="add-discount-btn">
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>{t("addCode", lang)}</Text>
        </TouchableOpacity>

        {loading ? <ActivityIndicator color={colors.primary} /> : items.length === 0 ? (
          <Text style={{ textAlign: "center", color: colors.textSecondary, padding: 30 }}>—</Text>
        ) : items.map((d) => (
          <View key={d.discount_id} style={[styles.row, shadow]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.code}>{d.code}</Text>
              <Text style={styles.percent}>{d.percent}% {d.active ? "✓" : "✗"} · {d.uses || 0} uses</Text>
            </View>
            <TouchableOpacity onPress={() => del(d.discount_id)} style={styles.actBtn}>
              <Ionicons name="trash" size={18} color={colors.danger} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal visible={showForm} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>{t("addCode", lang)}</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}><Ionicons name="close" size={24} color={colors.textPrimary} /></TouchableOpacity>
            </View>
            <Text style={styles.label}>{t("code", lang)}</Text>
            <TextInput value={code} onChangeText={setCode} autoCapitalize="characters" style={styles.input} testID="disc-code" />
            <Text style={[styles.label, { marginTop: 12 }]}>{t("percent", lang)}</Text>
            <TextInput value={percent} onChangeText={setPercent} keyboardType="numeric" style={styles.input} testID="disc-percent" />
            <View style={[styles.switchRow]}>
              <Text style={{ flex: 1, fontWeight: "800", color: colors.primary }}>Active</Text>
              <Switch value={active} onValueChange={setActive} />
            </View>
            <TouchableOpacity onPress={create} style={styles.saveBtn} testID="save-discount-btn">
              <Text style={styles.saveBtnText}>{t("save", lang)}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  addBtn: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary, paddingVertical: 14, ...obtuse, marginBottom: 12 },
  addBtnText: { color: "#fff", fontWeight: "900" },
  row: { flexDirection: "row", padding: 14, alignItems: "center", backgroundColor: colors.surface, ...obtuseSmall, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  code: { fontWeight: "900", color: colors.primary, fontSize: 16, letterSpacing: 1 },
  percent: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  actBtn: { padding: 8 },
  modalWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: colors.background, padding: 22, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: "900", color: colors.primary },
  label: { fontSize: 12, fontWeight: "800", color: colors.primary, marginBottom: 4 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 12, ...obtuseSmall, fontSize: 14 },
  switchRow: { flexDirection: "row", alignItems: "center", padding: 8, marginTop: 8 },
  saveBtn: { backgroundColor: colors.primary, paddingVertical: 14, ...obtuse, alignItems: "center", marginTop: 18 },
  saveBtnText: { color: "#fff", fontWeight: "900", fontSize: 15 },
});
