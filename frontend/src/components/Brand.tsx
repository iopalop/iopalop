import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, obtuse } from "../theme";

export function BrandLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const fontSize = size === "lg" ? 32 : size === "md" ? 22 : 18;
  return (
    <View style={[styles.wrap, { paddingHorizontal: fontSize * 0.6, paddingVertical: fontSize * 0.3 }]} testID="brand-logo">
      <View style={styles.accent} />
      <Text style={[styles.text, { fontSize }]}>عراقچي ستور</Text>
      <View style={styles.accent2} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...obtuse,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  text: {
    color: "#F9F6F0",
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  accent: {
    width: 8,
    height: 8,
    backgroundColor: colors.secondary,
    transform: [{ rotate: "45deg" }],
  },
  accent2: {
    width: 8,
    height: 8,
    backgroundColor: colors.accent,
    transform: [{ rotate: "45deg" }],
  },
});
