import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  useWindowDimensions,
  DimensionValue,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing, radius, font } from "@/src/theme";
import { ChartTrace as TraceData } from "@/src/api";

const CHART = require("../../assets/images/chart_clean.png");
const ASPECT = 2550 / 1147;

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const pct = (v: number): DimensionValue => `${clamp(v) * 100}%`;

function TraceOverlay({ t }: { t: TraceData }) {
  const top = clamp(t.top_y);
  const cy = clamp(t.carry_y);
  const tqx = clamp(t.tq_x);
  const ittx = clamp(t.itt_x);
  const ngx = clamp(t.ng_x);
  const h = (cy - top) * 100;

  const Dot = ({ x, y }: { x: number; y: number }) => (
    <View style={[styles.dot, { left: pct(x), top: pct(y) }]} />
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* horizontal carry line */}
      <View
        style={[
          styles.hline,
          { left: pct(tqx), top: pct(cy), width: `${(ngx - tqx) * 100}%` },
        ]}
      />
      {/* vertical: TQ entry, ITT read, NG read */}
      <View style={[styles.vline, { left: pct(tqx), top: pct(top), height: `${h}%` }]} />
      <View style={[styles.vline, { left: pct(ittx), top: pct(top), height: `${h}%` }]} />
      <View style={[styles.vline, { left: pct(ngx), top: pct(top), height: `${h}%` }]} />
      {/* nodes */}
      <Dot x={tqx} y={cy} />
      <Dot x={ittx} y={cy} />
      <Dot x={ngx} y={cy} />
      <Dot x={ittx} y={top} />
      <Dot x={ngx} y={top} />
    </View>
  );
}

export function ChartTrace({ trace }: { trace: TraceData }) {
  const [open, setOpen] = useState(false);
  const { width, height } = useWindowDimensions();

  // Rotated landscape view inside the modal to use the full screen height.
  const rW = height * 0.82;
  const rH = rW / ASPECT;

  return (
    <>
      <Text style={styles.sectionLabel}>CHART TRACE</Text>
      <Pressable
        style={styles.card}
        onPress={() => setOpen(true)}
        testID="chart-trace"
      >
        <View style={styles.chartBox}>
          <Image source={CHART} style={StyleSheet.absoluteFill} contentFit="fill" />
          <TraceOverlay t={trace} />
        </View>
        <View style={styles.hintRow}>
          <Ionicons name="scan-outline" size={14} color={colors.muted} />
          <Text style={styles.hint}>Tap to enlarge · blue line shows your lookup</Text>
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View
            style={{
              width: rW,
              height: rH,
              transform: [{ rotate: "90deg" }],
            }}
          >
            <Image source={CHART} style={StyleSheet.absoluteFill} contentFit="fill" />
            <TraceOverlay t={trace} />
          </View>
          <Pressable
            style={[styles.closeBtn, { top: spacing.xl + 8 }]}
            onPress={() => setOpen(false)}
            testID="chart-close"
            hitSlop={10}
          >
            <Ionicons name="close" size={22} color={colors.onSurface} />
          </Pressable>
          <Text style={[styles.modalHint, { bottom: spacing.xl }]}>
            Rotate your view · tap anywhere to close
          </Text>
        </View>
      </Modal>
    </>
  );
}

const LINE = colors.brand;

const styles = StyleSheet.create({
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
    padding: spacing.sm,
    marginBottom: spacing.lg,
  },
  chartBox: {
    width: "100%",
    aspectRatio: ASPECT,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  hint: { fontSize: font.sm, color: colors.muted },
  vline: { position: "absolute", width: 2, marginLeft: -1, backgroundColor: LINE },
  hline: { position: "absolute", height: 2, marginTop: -1, backgroundColor: LINE },
  dot: {
    position: "absolute",
    width: 9,
    height: 9,
    borderRadius: 5,
    marginLeft: -4.5,
    marginTop: -4.5,
    backgroundColor: LINE,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  modalRoot: {
    flex: 1,
    backgroundColor: "rgba(8,12,20,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: {
    position: "absolute",
    right: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  modalHint: {
    position: "absolute",
    color: "rgba(255,255,255,0.7)",
    fontSize: font.sm,
  },
});
