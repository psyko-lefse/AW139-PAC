import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

import { colors, spacing, radius, font, glow } from "@/src/theme";
import { resetBus } from "@/src/resetBus";

const META: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  index: { label: "Calculate", icon: "calculator-outline" },
  procedure: { label: "Procedure", icon: "document-text-outline" },
};

export function AppTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottom = insets.bottom || spacing.sm;

  const renderTab = (routeIndex: number) => {
    const route = state.routes[routeIndex];
    const meta = META[route.name] ?? { label: route.name, icon: "ellipse-outline" as const };
    const focused = state.index === routeIndex;
    const color = focused ? colors.brand : colors.borderStrong;

    const onPress = () => {
      Haptics.selectionAsync().catch(() => {});
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <Pressable
        key={route.key}
        style={styles.tab}
        onPress={onPress}
        testID={`tab-${route.name}`}
      >
        <Ionicons name={meta.icon} size={24} color={color} />
        <Text style={[styles.tabLabel, { color }]}>{meta.label}</Text>
      </Pressable>
    );
  };

  const onReset = () => {
    Haptics.selectionAsync().catch(() => {});
    resetBus.emit();
  };

  return (
    <View style={[styles.bar, { height: 60 + bottom, paddingBottom: bottom }]}>
      {renderTab(0)}

      <View style={styles.center}>
        <Pressable style={styles.resetBtn} onPress={onReset} testID="reset-button" hitSlop={8}>
          <Ionicons name="refresh" size={22} color={colors.onSurfaceInverse} />
        </Pressable>
        <Text style={styles.resetLabel}>Reset</Text>
      </View>

      {renderTab(1)}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3, paddingTop: spacing.sm },
  tabLabel: { fontSize: 11, fontWeight: "600" },
  center: { width: 88, alignItems: "center", justifyContent: "center", gap: 2 },
  resetBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    ...glow,
  },
  resetLabel: { fontSize: 11, fontWeight: "600", color: colors.onSurfaceSecondary },
});
