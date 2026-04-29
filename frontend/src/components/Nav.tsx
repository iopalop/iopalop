import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context";
import { t } from "../i18n";
import { colors, obtuse } from "../theme";
import { BrandLogo } from "./Brand";

export function TopBar({ showBack = false, title }: { showBack?: boolean; title?: string }) {
  const router = useRouter();
  const { lang, setLang, cartCount } = useApp();
  return (
    <View style={styles.topBar} testID="top-bar">
      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} testID="back-btn">
            <Ionicons name={lang === "ar" ? "chevron-forward" : "chevron-back"} size={24} color={colors.primary} />
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
          <Ionicons name="bag-outline" size={24} color={colors.primary} />
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
            <Ionicons name={it.icon} size={22} color={active ? colors.primary : colors.textSecondary} />
            <Text style={[styles.bottomLabel, active && { color: colors.primary, fontWeight: "700" }]}>
              {it.label}
            </Text>
            {active && <View style={styles.bottomDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: {
    padding: 8,
    ...obtuse,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...obtuse,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.secondaryDark,
  },
  langText: { fontWeight: "900", color: colors.primaryDark, fontSize: 13 },
  title: { flex: 1, fontWeight: "900", fontSize: 18, color: colors.primary, textAlign: "center" },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "900" },
  bottom: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 8,
  },
  bottomItem: { flex: 1, alignItems: "center", paddingVertical: 6, gap: 3 },
  bottomLabel: { fontSize: 11, color: colors.textSecondary },
  bottomDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.secondary,
    marginTop: 2,
  },
});
