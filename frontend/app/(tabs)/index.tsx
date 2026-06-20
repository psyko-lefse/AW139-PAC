import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Switch,
  ActivityIndicator,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { colors, spacing, radius, mono, font, shadow } from "@/src/theme";
import { NumberField } from "@/src/components/NumberField";
import { calculate, CalcResponse, EngineResult } from "@/src/api";

type EngineState = { tq: string; itt: string; ng: string };
const emptyEngine: EngineState = { tq: "", itt: "", ng: "" };

const num = (s: string): number | null => {
  if (s.trim() === "") return null;
  const v = Number(s);
  return Number.isFinite(v) ? v : null;
};

export default function CalculatorScreen() {
  const insets = useSafeAreaInsets();

  const [oat, setOat] = useState("");
  const [pa, setPa] = useState("");
  const [twinEngine, setTwinEngine] = useState(true);
  const [e1, setE1] = useState<EngineState>(emptyEngine);
  const [e2, setE2] = useState<EngineState>(emptyEngine);

  const [result, setResult] = useState<CalcResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const engineValid = (e: EngineState) =>
    num(e.tq) !== null && num(e.itt) !== null && num(e.ng) !== null;

  const ready = useMemo(() => {
    if (num(oat) === null || num(pa) === null) return false;
    if (!engineValid(e1)) return false;
    if (twinEngine && !engineValid(e2)) return false;
    return true;
  }, [oat, pa, e1, e2, twinEngine]);

  const lastVerdict = useRef<boolean | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await calculate({
        oat: num(oat)!,
        pressure_altitude: num(pa)!,
        engine1: { torque: num(e1.tq)!, itt: num(e1.itt)!, ng: num(e1.ng)! },
        engine2: twinEngine
          ? { torque: num(e2.tq)!, itt: num(e2.itt)!, ng: num(e2.ng)! }
          : null,
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
    } catch (err: any) {
      setError(err?.message ?? "Calculation failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [oat, pa, e1, e2, twinEngine]);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (!ready) {
      setResult(null);
      setError(null);
      lastVerdict.current = null;
      return;
    }
    debounce.current = setTimeout(run, 350);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [ready, run]);

  const reset = () => {
    Haptics.selectionAsync().catch(() => {});
    setOat("");
    setPa("");
    setE1(emptyEngine);
    setE2(emptyEngine);
    setResult(null);
    setError(null);
    lastVerdict.current = null;
  };

  return (
    <View style={styles.root}>
      {/* Sticky header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle} testID="screen-title">
              AW139 power assurance
            </Text>
            <Text style={styles.headerSub}>Hover · NR 102% · Basic inlet</Text>
          </View>
          <Pressable
            onPress={reset}
            style={styles.resetBtn}
            testID="reset-button"
            hitSlop={8}
          >
            <Ionicons name="refresh" size={16} color={colors.onSurfaceSecondary} />
            <Text style={styles.resetTxt}>Reset</Text>
          </Pressable>
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
            />
            <NumberField
              testID="input-pa"
              label="Pressure Altitude"
              unit="ft"
              value={pa}
              onChangeText={setPa}
            />
          </View>
        </View>

        {/* Twin engine toggle */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Check both engines</Text>
          <Switch
            testID="twin-engine-switch"
            value={twinEngine}
            onValueChange={(v) => {
              Haptics.selectionAsync().catch(() => {});
              setTwinEngine(v);
            }}
            trackColor={{ false: colors.surfaceTertiary, true: colors.brand }}
            thumbColor={colors.surface}
          />
        </View>

        {/* Engine 1 */}
        <Text style={styles.sectionLabel}>ENGINE 1</Text>
        <View style={styles.card}>
          <NumberField
            testID="input-e1-tq"
            label="Torque"
            unit="%"
            value={e1.tq}
            onChangeText={(t) => setE1((s) => ({ ...s, tq: t }))}
          />
          <View style={{ height: spacing.md }} />
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
        {twinEngine && (
          <>
            <Text style={styles.sectionLabel}>ENGINE 2</Text>
            <View style={styles.card}>
              <NumberField
                testID="input-e2-tq"
                label="Torque"
                unit="%"
                value={e2.tq}
                onChangeText={(t) => setE2((s) => ({ ...s, tq: t }))}
              />
              <View style={{ height: spacing.md }} />
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
          </>
        )}

        {/* Results */}
        <View style={styles.resultsHeaderRow}>
          <Text style={styles.sectionLabel}>RESULTS</Text>
          {loading && <ActivityIndicator size="small" color={colors.brand} />}
        </View>

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
            <EngineResultCard title="Engine 1" r={result.engine1} testID="result-engine1" />
            {result.engine2 && (
              <EngineResultCard title="Engine 2" r={result.engine2} testID="result-engine2" />
            )}
          </View>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}

function VerdictBanner({ pass }: { pass: boolean }) {
  return (
    <View
      style={[styles.verdict, pass ? styles.verdictPass : styles.verdictFail]}
      testID="overall-verdict"
    >
      <Ionicons
        name={pass ? "checkmark-circle" : "close-circle"}
        size={22}
        color={colors.onSurfaceInverse}
      />
      <Text style={styles.verdictTxt}>
        {pass ? "POWER ASSURED" : "POWER NOT ASSURED"}
      </Text>
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

  return (
    <View style={[styles.card, styles.resultCard]} testID={testID}>
      <View style={styles.resultHead}>
        <Text style={styles.resultTitle}>{title}</Text>
        <View style={[styles.badge, { backgroundColor: statusBg, borderColor: statusColor }]}>
          <Text style={[styles.badgeTxt, { color: statusColor }]} testID={`${testID}-status`}>
            {statusLabel}
          </Text>
        </View>
      </View>

      <MetricRow
        label="ITT"
        measured={`${r.itt}`}
        unit="°C"
        max={`${r.max_itt}`}
        margin={r.itt_margin}
        pass={r.itt_pass}
        testID={`${testID}-itt`}
      />
      <View style={styles.rowDivider} />
      <MetricRow
        label="NG"
        measured={`${r.ng}`}
        unit="%"
        max={`${r.max_ng}`}
        margin={r.ng_margin}
        pass={r.ng_pass}
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
  testID,
}: {
  label: string;
  measured: string;
  unit: string;
  max: string;
  margin: number;
  pass: boolean;
  testID: string;
}) {
  const marginColor = pass ? colors.success : colors.error;
  const sign = margin >= 0 ? "+" : "";
  return (
    <View style={styles.metricRow} testID={testID}>
      <View style={styles.metricLeft}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricSub}>
          Measured <Text style={styles.metricSubVal}>{measured}{unit}</Text>
        </Text>
      </View>
      <View style={styles.metricMid}>
        <Text style={styles.metricMaxLabel}>MAX ALLOW.</Text>
        <Text style={styles.metricMax}>
          {max}
          <Text style={styles.metricUnit}>{unit}</Text>
        </Text>
      </View>
      <View style={styles.metricRight}>
        <Text style={styles.metricMaxLabel}>MARGIN</Text>
        <Text style={[styles.metricMargin, { color: marginColor }]} testID={`${testID}-margin`}>
          {sign}
          {margin}
        </Text>
      </View>
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
  headerTitle: { fontSize: font["2xl"], fontWeight: "800", color: colors.onSurface },
  headerSub: {
    fontFamily: mono,
    fontSize: font.sm,
    color: colors.muted,
    marginTop: 2,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
  },
  resetTxt: { fontSize: font.sm, fontWeight: "600", color: colors.onSurfaceSecondary },
  scroll: { flex: 1 },
  disclaimer: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.warningSurface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
    alignItems: "flex-start",
  },
  disclaimerTxt: {
    flex: 1,
    fontSize: font.sm,
    lineHeight: 18,
    color: "#7A4A00",
  },
  sectionLabel: {
    fontSize: font.sm,
    fontWeight: "700",
    color: colors.muted,
    letterSpacing: 1,
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
    gap: spacing.sm,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  verdictPass: { backgroundColor: colors.success },
  verdictFail: { backgroundColor: colors.error },
  verdictTxt: {
    flex: 1,
    color: colors.onSurfaceInverse,
    fontSize: font.lg,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  resultCard: { paddingVertical: spacing.md },
  resultHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  resultTitle: { fontSize: font.lg, fontWeight: "700", color: colors.onSurface },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  badgeTxt: { fontSize: font.sm, fontWeight: "800", letterSpacing: 0.5 },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  metricLeft: { flex: 1.3 },
  metricMid: { flex: 1, alignItems: "flex-end" },
  metricRight: { flex: 0.9, alignItems: "flex-end" },
  metricLabel: { fontSize: font.lg, fontWeight: "800", color: colors.onSurface },
  metricSub: { fontSize: font.sm, color: colors.muted, marginTop: 2 },
  metricSubVal: { fontFamily: mono, color: colors.onSurfaceSecondary },
  metricMaxLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.borderStrong,
    letterSpacing: 0.5,
  },
  metricMax: {
    fontFamily: mono,
    fontSize: font.xl,
    color: colors.onSurface,
    marginTop: 2,
  },
  metricUnit: { fontSize: font.sm, color: colors.muted },
  metricMargin: { fontFamily: mono, fontSize: font.xl, fontWeight: "700", marginTop: 2 },
  rowDivider: { height: 1, backgroundColor: colors.divider },
  notes: {
    marginTop: spacing.md,
    backgroundColor: colors.errorSurface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  noteRow: { flexDirection: "row", gap: spacing.xs, alignItems: "flex-start" },
  noteTxt: { flex: 1, fontSize: font.sm, color: "#7A271A", lineHeight: 17 },
});
