import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing, radius, mono, font } from "@/src/theme";

const STEPS: string[] = [
  "HEATER / COND — OFF",
  "Generator load to minimum (below 17%)",
  "Set NR to 102%",
  "Test engine MODE switch — FLIGHT",
  "Other engine MODE switch — IDLE",
  "Increase collective until light on wheels or hovering at 5 ft, nose on wind.",
  "Stabilize power 1 minute, then record OAT, Pressure Altitude, Engine Torque, ITT and NG.",
  "Enter the calculator with the recorded values to read maximum allowable ITT and NG.",
  "If indicated ITT or NG exceeds maximum allowable, repeat check.",
  "Repeat check using the other engine.",
];

const LIMITS = [
  { label: "ITT", value: "775", unit: "°C" },
  { label: "NG", value: "102.4", unit: "%" },
  { label: "TQ", value: "105", unit: "%" },
];

export default function ProcedureScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing["2xl"] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Image
            source={require("../../assets/images/aw139-hero.png")}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={["rgba(16,24,40,0.25)", "rgba(16,24,40,0.92)"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.heroContent, { paddingTop: insets.top + spacing.lg }]}>
            <Text style={styles.heroKicker}>AW139 · RFM SUPPL. 12</Text>
            <Text style={styles.heroTitle}>Power Assurance Check</Text>
            <Text style={styles.heroSub}>In Hover Flight (NR = 102%)</Text>
          </View>
        </View>

        <View style={styles.body}>
          {/* Operational limits */}
          <Text style={styles.sectionTitle}>Operational Limits</Text>
          <Text style={styles.sectionNote}>
            Do not exceed while establishing the hover.
          </Text>
          <View style={styles.limitsRow}>
            {LIMITS.map((l) => (
              <View key={l.label} style={styles.limitCard} testID={`limit-${l.label}`}>
                <Text style={styles.limitLabel}>{l.label}</Text>
                <Text style={styles.limitValue}>
                  {l.value}
                  <Text style={styles.limitUnit}>{l.unit}</Text>
                </Text>
              </View>
            ))}
          </View>

          {/* Procedure steps */}
          <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Procedure</Text>
          <View style={styles.steps}>
            {STEPS.map((s, i) => (
              <View key={i} style={styles.step} testID={`step-${i + 1}`}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumTxt}>{i + 1}</Text>
                </View>
                <Text style={styles.stepTxt}>{s}</Text>
              </View>
            ))}
          </View>

          {/* EMM note */}
          <View style={styles.emm}>
            <Ionicons name="information-circle-outline" size={18} color={colors.onSurfaceSecondary} />
            <Text style={styles.emmTxt}>
              If either engine exceeds allowable ITT or NG, published performance may
              not be achievable. Refer to the Engine Maintenance Manual (EMM).
            </Text>
          </View>

          <Text style={styles.source}>
            Source: Leonardo Helicopters AW139 RFM-4D, Supplement 12, Fig. 4K-2 (EASA
            approved). Calculator values are digitised approximations — verify against
            the official chart before operational use.
          </Text>

          <Text style={styles.copyright} testID="copyright-procedure">©Butterhill 2026</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surfaceSecondary },
  hero: { height: 220, backgroundColor: colors.brand, justifyContent: "flex-end" },
  heroContent: { padding: spacing.lg },
  heroKicker: {
    fontFamily: mono,
    fontSize: font.sm,
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  heroTitle: { fontSize: font["2xl"], fontWeight: "800", color: "#FFFFFF" },
  heroSub: { fontSize: font.base, color: "rgba(255,255,255,0.85)", marginTop: 2 },
  body: { padding: spacing.lg },
  sectionTitle: { fontSize: font.xl, fontWeight: "800", color: colors.onSurface },
  sectionNote: { fontSize: font.sm, color: colors.muted, marginTop: 2, marginBottom: spacing.md },
  limitsRow: { flexDirection: "row", gap: spacing.md },
  limitCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  limitLabel: {
    fontSize: font.sm,
    fontWeight: "700",
    color: colors.muted,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  limitValue: { fontFamily: mono, fontSize: font["2xl"], color: colors.error, fontWeight: "700" },
  limitUnit: { fontSize: font.base, color: colors.muted },
  steps: { marginTop: spacing.sm, gap: spacing.md },
  step: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumTxt: { fontFamily: mono, color: colors.onSurfaceInverse, fontSize: font.sm, fontWeight: "700" },
  stepTxt: { flex: 1, fontSize: font.base, lineHeight: 21, color: colors.onSurfaceSecondary, paddingTop: 3 },
  emm: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.xl,
    alignItems: "flex-start",
  },
  emmTxt: { flex: 1, fontSize: font.sm, lineHeight: 19, color: colors.onSurfaceSecondary },
  source: {
    fontSize: font.sm,
    lineHeight: 18,
    color: colors.muted,
    marginTop: spacing.xl,
  },
  copyright: {
    textAlign: "center",
    fontSize: 11,
    color: colors.muted,
    marginTop: spacing.xl,
  },
});
