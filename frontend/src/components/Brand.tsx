import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme";

export function BrandLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const fontSize = size === "lg" ? 28 : size === "md" ? 20 : 16;
  return (
    <View style={styles.wrap} testID="brand-logo">
      <View style={[styles.dot, { width: fontSize * 0.35, height: fontSize * 0.35 }]} />
      <Text style={[styles.text, { fontSize }]}>عراقچي</Text>
      <Text style={[styles.textLight, { fontSize }]}>ستور</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    backgroundColor: colors.primary,
    borderRadius: 100,
  },
  text: {
    color: colors.textPrimary,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  textLight: {
    color: colors.primary,
    fontWeight: "300",
    letterSpacing: -0.5,
  },
});
