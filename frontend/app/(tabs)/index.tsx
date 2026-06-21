import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { colors, spacing, radius, mono, font, shadow } from "@/src/theme";
import { NumberField } from "@/src/components/NumberField";
import { ChartTrace } from "@/src/components/ChartTrace";
import { CalcResponse, EngineResult } from "@/src/api";
import { computeCheck, RANGE } from "@/src/calc";
import { resetBus } from "@/src/resetBus";

type EngineState = { itt: string; ng: string };
const emptyEngine: EngineState = { itt: "", ng: "" };

const num = (s: string): number | null => {
  const t = s.trim().replace(",", ".");
  if (t === "") return null;
  const v = Number(t);
  return Number.isFinite(v) ? v : null;
};

export default function CalculatorScreen() {
  const insets = useSafeAreaInsets();

  const [oat, setOat] = useState("");
  const [pa, setPa] = useState("");
  const [tq, setTq] = useState("");
  const [e1, setE1] = useState<EngineState>(emptyEngine);
  const [e2, setE2] = useState<EngineState>(emptyEngine);

  const [result, setResult] = useState<CalcResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const engineValid = (e: EngineState) =>
    num(e.itt) !== null && num(e.ng) !== null;

  const ready = useMemo(() => {
    if (num(oat) === null || num(pa) === null || num(tq) === null) return false;
    if (!engineValid(e1)) return false;
    if (!engineValid(e2)) return false;
    return true;
  }, [oat, pa, tq, e1, e2]);

  // Edge-of-chart warnings (inputs outside the digitised chart range)
  const oatWarn = useMemo(() => {
    const v = num(oat);
    return v !== null && (v < RANGE.oat.min || v > RANGE.oat.max)
      ? `Chart range ${RANGE.oat.min}…${RANGE.oat.max}°C`
      : undefined;
  }, [oat]);
  const paWarn = useMemo(() => {
    const v = num(pa);
    return v !== null && (v < RANGE.pa.min || v > RANGE.pa.max)
      ? `Chart range ${RANGE.pa.min}…${RANGE.pa.max} ft`
      : undefined;
  }, [pa]);
  const tqWarn = useMemo(() => {
    const v = num(tq);
    return v !== null && (v < RANGE.tq.min || v > RANGE.tq.max)
      ? `Chart range ${RANGE.tq.min}…${RANGE.tq.max}%`
      : undefined;
  }, [tq]);
  const edgeWarn = !!(oatWarn || paWarn || tqWarn);

  const lastVerdict = useRef<boolean | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(() => {
    setError(null);
    try {
      const res = computeCheck({
        oat: num(oat)!,
        pressure_altitude: num(pa)!,
        engine1: { torque: num(tq)!, itt: num(e1.itt)!, ng: num(e1.ng)! },
        engine2: { torque: num(tq)!, itt: num(e2.itt)!, ng: num(e2.ng)! },
      });
      setResult(res);
      if (lastVerdict.current !== res.overall_pass) {
        Haptics.notificationAsync(
          res.overall_pass
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Error
        ).catch(() => {});
        lastVerdict.current = res.overall_pass;
      }
    } catch {
      setError("Calculation error — check your inputs");
      setResult(null);
    }
  }, [oat, pa, tq, e1, e2]);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (!ready) {
      setResult(null);
      setError(null);
      lastVerdict.current = null;
      return;
    }
    debounce.current = setTimeout(run, 150);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [ready, run]);

  const reset = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    setOat("");
    setPa("");
    setTq("");
    setE1(emptyEngine);
    setE2(emptyEngine);
    setResult(null);
    setError(null);
    lastVerdict.current = null;
  }, []);

  useEffect(() => resetBus.subscribe(reset), [reset]);

  return (
    <View style={styles.root}>
      {/* Sticky header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Image
              source={require("../../assets/images/app-logo.png")}
              style={styles.logo}
              contentFit="cover"
            />
            <View style={styles.headerTitles}>
              <Text style={styles.headerTitle} testID="screen-title">
                AW139 POWER ASSURANCE
              </Text>
              <Text style={styles.headerSub}>HOVER · NR 102% · BASIC INLET</Text>
            </View>
          </View>
        </View>
      </View>

      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: insets.bottom + spacing["3xl"],
        }}
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Ambient conditions */}
        <Text style={styles.sectionLabel}>AMBIENT CONDITIONS</Text>
        <View style={styles.card}>
          <View style={styles.fieldRow}>
            <NumberField
              testID="input-oat"
              label="OAT"
              unit="°C"
              value={oat}
              onChangeText={setOat}
              warning={oatWarn}
            />
            <NumberField
              testID="input-pa"
              label="Press alt"
              unit="ft"
              value={pa}
              onChangeText={setPa}
              warning={paWarn}
            />
          </View>
          <View style={{ height: spacing.md }} />
          <NumberField
            testID="input-tq"
            label="Torque"
            unit="%"
            value={tq}
            onChangeText={setTq}
            warning={tqWarn}
          />
        </View>

        {/* Engine 1 */}
        <Text style={styles.sectionLabel}>ENGINE 1</Text>
        <View style={styles.card}>
          <View style={styles.fieldRow}>
            <NumberField
              testID="input-e1-itt"
              label="ITT"
              unit="°C"
              value={e1.itt}
              onChangeText={(t) => setE1((s) => ({ ...s, itt: t }))}
            />
            <NumberField
              testID="input-e1-ng"
              label="NG"
              unit="%"
              value={e1.ng}
              onChangeText={(t) => setE1((s) => ({ ...s, ng: t }))}
            />
          </View>
        </View>

        {/* Engine 2 */}
        <Text style={styles.sectionLabel}>ENGINE 2</Text>
        <View style={styles.card}>
          <View style={styles.fieldRow}>
            <NumberField
              testID="input-e2-itt"
              label="ITT"
              unit="°C"
              value={e2.itt}
              onChangeText={(t) => setE2((s) => ({ ...s, itt: t }))}
            />
            <NumberField
              testID="input-e2-ng"
              label="NG"
              unit="%"
              value={e2.ng}
              onChangeText={(t) => setE2((s) => ({ ...s, ng: t }))}
            />
          </View>
        </View>

        {/* Results */}
        <Text style={styles.sectionLabel}>RESULTS</Text>

        {error && (
          <View style={[styles.verdict, styles.verdictFail]} testID="error-banner">
            <Ionicons name="alert-circle" size={20} color={colors.onError} />
            <Text style={styles.verdictTxt}>{error}</Text>
          </View>
        )}

        {!result && !error && (
          <View style={styles.placeholder} testID="results-placeholder">
            <Ionicons
              name="speedometer-outline"
              size={28}
              color={colors.borderStrong}
            />
            <Text style={styles.placeholderTxt}>
              Enter all values to compute maximum allowable limits.
            </Text>
          </View>
        )}

        {result && !error && (
          <View testID="results-section">
            <VerdictBanner pass={result.overall_pass} />
            {edgeWarn && (
              <View style={styles.edgeNote} testID="edge-warning">
                <Ionicons name="warning-outline" size={16} color={colors.warning} />
                <Text style={styles.edgeTxt}>
                  Inputs outside the digitised chart range — values extrapolated. Verify
                  manually against the chart.
                </Text>
              </View>
            )}
            <EngineResultCard title="Engine 1" r={result.engine1} testID="result-engine1" />
            {result.engine2 && (
              <EngineResultCard title="Engine 2" r={result.engine2} testID="result-engine2" />
            )}
            {result.trace && <ChartTrace trace={result.trace} />}
          </View>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}

function VerdictBanner({ pass }: { pass: boolean }) {
  const fg = pass ? colors.success : colors.error;
  return (
    <View
      style={[styles.verdict, pass ? styles.verdictPass : styles.verdictFail]}
      testID="overall-verdict"
    >
      <Ionicons
        name={pass ? "checkmark-circle" : "alert-circle"}
        size={24}
        color={fg}
      />
      <View style={{ flex: 1 }}>
        <Text style={[styles.verdictTxt, { color: fg }]}>
          {pass ? "POWER ASSURED" : "POWER NOT ASSURED"}
        </Text>
        <Text style={styles.verdictSub}>
          {pass ? "All checks within limits" : "One or more limits exceeded"}
        </Text>
      </View>
    </View>
  );
}

function EngineResultCard({
  title,
  r,
  testID,
}: {
  title: string;
  r: EngineResult;
  testID: string;
}) {
  const status = r.passed ? (r.near_limit ? "caution" : "pass") : "fail";
  const statusColor =
    status === "pass" ? colors.success : status === "caution" ? colors.warning : colors.error;
  const statusBg =
    status === "pass"
      ? colors.successSurface
      : status === "caution"
      ? colors.warningSurface
      : colors.errorSurface;
  const statusLabel =
    status === "pass" ? "PASS" : status === "caution" ? "CAUTION" : "FAIL";

  const ittClose = r.max_itt > 0 ? r.itt / r.max_itt : 0;
  const ngClose = r.max_ng > 0 ? r.ng / r.max_ng : 0;
  const limiting = ittClose >= ngClose ? "ITT" : "NG";
  const limMargin = limiting === "ITT" ? r.itt_margin : r.ng_margin;
  const limUnit = limiting === "ITT" ? "°C" : "%";

  return (
    <View style={[styles.card, styles.resultCard]} testID={testID}>
      <View style={styles.resultHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.resultTitle}>{title}</Text>
          <Text style={styles.limiting} testID={`${testID}-limiting`}>
            Limited by {limiting} · {limMargin >= 0 ? "+" : ""}
            {limMargin}
            {limUnit} margin
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: statusBg, borderColor: statusColor }]}>
          <Text style={[styles.badgeTxt, { color: statusColor }]} testID={`${testID}-status`}>
            {statusLabel}
          </Text>
        </View>
      </View>

      <MetricRow
        label="ITT"
        measured={r.itt}
        unit="°C"
        max={r.max_itt}
        margin={r.itt_margin}
        pass={r.itt_pass}
        cautionBand={10}
        testID={`${testID}-itt`}
      />
      <MetricRow
        label="NG"
        measured={r.ng}
        unit="%"
        max={r.max_ng}
        margin={r.ng_margin}
        pass={r.ng_pass}
        cautionBand={0.5}
        testID={`${testID}-ng`}
      />

      {r.notes.length > 0 && (
        <View style={styles.notes}>
          {r.notes.map((n, i) => (
            <View key={i} style={styles.noteRow}>
              <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
              <Text style={styles.noteTxt}>{n}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function MetricRow({
  label,
  measured,
  unit,
  max,
  margin,
  pass,
  cautionBand,
  testID,
}: {
  label: string;
  measured: number;
  unit: string;
  max: number;
  margin: number;
  pass: boolean;
  cautionBand: number;
  testID: string;
}) {
  const color = !pass
    ? colors.error
    : margin <= cautionBand
    ? colors.warning
    : colors.success;
  const sign = margin >= 0 ? "+" : "";
  const ratio = max > 0 ? Math.max(0, Math.min(1, measured / max)) : 0;

  return (
    <View style={styles.metricRow} testID={testID}>
      <View style={styles.metricTop}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={[styles.metricMargin, { color }]} testID={`${testID}-margin`}>
          {sign}
          {margin}
          {unit}
        </Text>
      </View>
      <View style={styles.gaugeTrack}>
        <View style={[styles.gaugeFill, { width: `${ratio * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.metricSub}>
        Measured{" "}
        <Text style={styles.metricSubVal}>
          {measured}
          {unit}
        </Text>{" "}
        · Max allowable{" "}
        <Text style={styles.metricSubVal}>
          {max}
          {unit}
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surfaceSecondary },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: spacing.md, flex: 1 },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
  },
  headerTitles: { flex: 1 },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: 0.5,
  },
  headerSub: {
    fontFamily: mono,
    fontSize: 10,
    color: colors.muted,
    marginTop: 3,
    letterSpacing: 1.2,
  },
  scroll: { flex: 1 },
  sectionLabel: {
    fontSize: font.sm,
    fontWeight: "800",
    color: colors.muted,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow,
  },
  fieldRow: { flexDirection: "row", gap: spacing.md },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  toggleLabel: { fontSize: font.lg, fontWeight: "600", color: colors.onSurface },
  resultsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  placeholder: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  placeholderTxt: {
    fontSize: font.base,
    color: colors.muted,
    textAlign: "center",
  },
  verdict: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  verdictPass: { backgroundColor: colors.successSurface, borderColor: colors.success },
  verdictFail: { backgroundColor: colors.errorSurface, borderColor: colors.error },
  verdictTxt: {
    fontSize: font.lg,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  verdictSub: {
    fontSize: font.sm,
    color: colors.onSurfaceSecondary,
    marginTop: 1,
  },
  resultCard: { paddingVertical: spacing.md },
  resultHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  resultTitle: { fontSize: font.lg, fontWeight: "700", color: colors.onSurface },
  limiting: { fontSize: font.sm, color: colors.onSurfaceSecondary, marginTop: 2 },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  badgeTxt: { fontSize: font.sm, fontWeight: "800", letterSpacing: 0.5 },
  metricRow: {
    paddingVertical: spacing.md,
  },
  metricTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  metricLabel: { fontSize: font.lg, fontWeight: "800", color: colors.onSurface },
  metricMargin: { fontFamily: mono, fontSize: font.lg, fontWeight: "700" },
  gaugeTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    overflow: "hidden",
  },
  gaugeFill: { height: "100%", borderRadius: radius.pill },
  metricSub: { fontSize: font.sm, color: colors.muted, marginTop: spacing.sm },
  metricSubVal: { fontFamily: mono, color: colors.onSurfaceSecondary },
  edgeNote: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
    backgroundColor: colors.warningSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.warning,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  edgeTxt: { flex: 1, fontSize: font.sm, color: "#7A4A00", lineHeight: 18 },
  notes: {
    marginTop: spacing.md,
    backgroundColor: colors.errorSurface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  noteRow: { flexDirection: "row", gap: spacing.xs, alignItems: "flex-start" },
  noteTxt: { flex: 1, fontSize: font.sm, color: "#B42318", lineHeight: 17 },
});
