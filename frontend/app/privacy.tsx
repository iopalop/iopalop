import React from "react";
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../src/context";
import { t } from "../src/i18n";
import { colors, obtuse } from "../src/theme";
import { TopBar, BottomNav } from "../src/components/Nav";

const SUPPORT_EMAIL = "ejjkio3@gmail.com";

export default function PrivacyScreen() {
  const { lang } = useApp();
  const isAr = lang === "ar";
  const align = isAr ? "right" : "left";

  const ar = {
    title: "سياسة الخصوصية",
    intro: "في عراقچي ستور، نحن نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. توضح هذه السياسة كيفية جمعنا واستخدامنا وحماية المعلومات التي تقدمها لنا.",
    s1: "1. جمع البيانات",
    s1b: "نقوم بجمع المعلومات الأساسية مثل الاسم والبريد الإلكتروني ورقم الهاتف والعنوان لمعالجة طلباتك وإيصالها إليك بالشكل الصحيح.",
    s2: "2. استخدام البيانات",
    s2b: "نستخدم بياناتك فقط لأغراض معالجة الطلبات، التواصل بشأن الشحن، وإرسال إشعارات الطلبات. لا نشارك بياناتك مع جهات خارجية إلا لخدمات التوصيل.",
    s3: "3. الدفع عند الاستلام",
    s3b: "نعتمد طريقة الدفع عند الاستلام كخيار أساسي. لا نقوم بتخزين أي بيانات بنكية أو معلومات بطاقات ائتمانية.",
    s4: "4. الشحن الدولي",
    s4b: "نقوم بالشحن إلى جميع دول العالم مع التركيز على العراق. قد تختلف أوقات التوصيل حسب الموقع.",
    s5: "5. الاتصال بنا",
    s5b: "للاستفسارات أو طلبات حذف البيانات، يرجى التواصل معنا على البريد:",
  };
  const en = {
    title: "Privacy Policy",
    intro: "At Iraqchi Store, we respect your privacy and are committed to protecting your personal data. This policy explains how we collect, use, and protect the information you provide.",
    s1: "1. Data Collection",
    s1b: "We collect basic information such as name, email, phone, and address to process and deliver your orders correctly.",
    s2: "2. Data Use",
    s2b: "Your data is used only for order processing, shipping communication, and order notifications. We do not share data with third parties except shipping carriers.",
    s3: "3. Cash on Delivery",
    s3b: "We use Cash on Delivery as our primary payment method. We do not store any bank or card data.",
    s4: "4. International Shipping",
    s4b: "We ship worldwide with focus on Iraq. Delivery times may vary by location.",
    s5: "5. Contact Us",
    s5b: "For inquiries or data deletion requests, please contact:",
  };
  const txt = isAr ? ar : en;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <TopBar showBack title={t("privacyPolicy", lang)} />
      <ScrollView contentContainerStyle={{ padding: 18 }}>
        <View style={styles.card}>
          <Text style={[styles.title, { textAlign: align }]}>{txt.title}</Text>
          <Text style={[styles.body, { textAlign: align }]}>{txt.intro}</Text>
          {[ ["s1","s1b"], ["s2","s2b"], ["s3","s3b"], ["s4","s4b"], ["s5","s5b"] ].map(([h, b]) => (
            <View key={h} style={{ marginTop: 18 }}>
              <Text style={[styles.h, { textAlign: align }]}>{(txt as any)[h]}</Text>
              <Text style={[styles.body, { textAlign: align }]}>{(txt as any)[b]}</Text>
            </View>
          ))}
          <TouchableOpacity onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} style={styles.mailBtn}>
            <Text style={styles.mailBtnText}>{SUPPORT_EMAIL}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  card: {
    backgroundColor: colors.surface, padding: 22, ...obtuse,
    borderWidth: 1, borderColor: colors.border, gap: 6,
  },
  title: { fontSize: 22, fontWeight: "900", color: colors.primary, marginBottom: 8 },
  h: { fontSize: 15, fontWeight: "900", color: colors.primary, marginBottom: 6 },
  body: { color: colors.textPrimary, fontSize: 14, lineHeight: 22 },
  mailBtn: {
    marginTop: 18, padding: 14, backgroundColor: colors.secondary,
    alignItems: "center", borderRadius: 6,
  },
  mailBtnText: { color: colors.primaryDark, fontWeight: "900" },
});
