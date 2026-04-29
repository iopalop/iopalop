import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context";
import { t } from "../i18n";
import { colors } from "../theme";
import { BrandLogo } from "./Brand";

export function TopBar({ showBack = false, title }: { showBack?: boolean; title?: string }) {
  const router = useRouter();
  const { lang, setLang, cartCount } = useApp();
  return (
    <View style={styles.topBar} testID="top-bar">
      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} testID="back-btn">
            <Ionicons name={lang === "ar" ? "chevron-forward" : "chevron-back"} size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <Pressable onPress={() => router.push("/")}><BrandLogo size="sm" /></Pressable>
        )}
        {title ? <Text style={styles.title}>{title}</Text> : <View style={{ flex: 1 }} />}
        <TouchableOpacity
          onPress={() => setLang(lang === "ar" ? "en" : "ar")}
          style={styles.langBtn}
          testID="lang-toggle"
        >
          <Text style={styles.langText}>{lang === "ar" ? "EN" : "ع"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/cart")} style={styles.iconBtn} testID="cart-icon-btn">
          <Ionicons name="bag-outline" size={22} color={colors.textPrimary} />
          {cartCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { lang, user } = useApp();
  const items = [
    { key: "/", icon: "home-outline" as const, label: t("home", lang), testID: "nav-home" },
    { key: "/categories", icon: "grid-outline" as const, label: t("categories", lang), testID: "nav-categories" },
    { key: "/cart", icon: "bag-outline" as const, label: t("cart", lang), testID: "nav-cart" },
    { key: user ? "/profile" : "/auth/login", icon: "person-outline" as const, label: t("profile", lang), testID: "nav-profile" },
  ];
  return (
    <View style={styles.bottom} testID="bottom-nav">
      {items.map((it) => {
        const active = pathname === it.key;
        return (
          <TouchableOpacity
            key={it.key}
            style={styles.bottomItem}
            onPress={() => router.push(it.key as any)}
            testID={it.testID}
          >
            <View style={[styles.bottomIconWrap, active && styles.bottomIconWrapActive]}>
              <Ionicons name={it.icon} size={20} color={active ? "#fff" : colors.textSecondary} />
            </View>
            <Text style={[styles.bottomLabel, active && { color: colors.primary, fontWeight: "700" }]}>
              {it.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  langBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  langText: { fontWeight: "900", color: "#fff", fontSize: 12 },
  title: { flex: 1, fontWeight: "900", fontSize: 17, color: colors.textPrimary, textAlign: "center", letterSpacing: -0.3 },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#fff",
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "900" },
  bottom: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    paddingBottom: 10,
  },
  bottomItem: { flex: 1, alignItems: "center", gap: 4 },
  bottomIconWrap: {
    width: 40,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  bottomIconWrapActive: {
    backgroundColor: colors.primary,
  },
  bottomLabel: { fontSize: 10, color: colors.textMuted, fontWeight: "600" },
});
