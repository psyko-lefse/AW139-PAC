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
import { GestureHandlerRootView, Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { colors, spacing, radius, font } from "@/src/theme";
import { ChartTrace as TraceData } from "@/src/api";

const CHART = require("../../assets/images/chart_clean.png");
const ASPECT = 2550 / 1147;
const LINE = "#E5322D"; // red trace

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const pct = (v: number): DimensionValue => `${clamp(v) * 100}%`;

function TraceOverlay({ t }: { t: TraceData }) {
  const top = clamp(t.top_y);
  const cy = clamp(t.carry_y);
  const tqx = clamp(t.tq_x);
  const ittx = clamp(t.itt_x);
  const ngx = clamp(t.ng_x);
  const h = (cy - top) * 100;

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
    </View>
  );
}

function ZoomableChart({ trace }: { trace: TraceData }) {
  const { width } = useWindowDimensions();
  const w = width;
  const hgt = w / ASPECT;

  const scale = useSharedValue(1);
  const saved = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const stx = useSharedValue(0);
  const sty = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(1, Math.min(saved.value * e.scale, 6));
    })
    .onEnd(() => {
      saved.value = scale.value;
      if (scale.value <= 1.01) {
        scale.value = withTiming(1);
        tx.value = withTiming(0);
        ty.value = withTiming(0);
        stx.value = 0;
        sty.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tx.value = stx.value + e.translationX;
      ty.value = sty.value + e.translationY;
    })
    .onEnd(() => {
      stx.value = tx.value;
      sty.value = ty.value;
    });

  const composed = Gesture.Simultaneous(pinch, pan);

  const aStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[{ width: w, height: hgt }, aStyle]}>
        <Image source={CHART} style={StyleSheet.absoluteFill} contentFit="fill" />
        <TraceOverlay t={trace} />
      </Animated.View>
    </GestureDetector>
  );
}

export function ChartTrace({ trace, label }: { trace: TraceData; label?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Text style={styles.sectionLabel}>
        {label ? `${label} — CHART TRACE` : "CHART TRACE"}
      </Text>
      <Pressable style={styles.card} onPress={() => setOpen(true)} testID="chart-trace">
        <View style={styles.chartBox}>
          <Image source={CHART} style={StyleSheet.absoluteFill} contentFit="fill" />
          <TraceOverlay t={trace} />
        </View>
        <View style={styles.hintRow}>
          <Ionicons name="scan-outline" size={14} color={colors.muted} />
          <Text style={styles.hint}>Tap to enlarge · red line shows your lookup</Text>
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={styles.modalRoot}>
            <ZoomableChart trace={trace} />
            <Pressable
              style={styles.closeBtn}
              onPress={() => setOpen(false)}
              testID="chart-close"
              hitSlop={10}
            >
              <Ionicons name="close" size={22} color={colors.onSurface} />
            </Pressable>
            <Text style={styles.modalHint}>Pinch to zoom · drag to pan</Text>
          </View>
        </GestureHandlerRootView>
      </Modal>
    </>
  );
}

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
  modalRoot: {
    flex: 1,
    backgroundColor: "rgba(8,12,20,0.94)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  closeBtn: {
    position: "absolute",
    top: spacing["2xl"] + 8,
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
    bottom: spacing.xl,
    color: "rgba(255,255,255,0.7)",
    fontSize: font.sm,
  },
});
