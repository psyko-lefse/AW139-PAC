import React from "react";
import { View, Text, TextInput, StyleSheet, TextInputProps } from "react-native";

import { colors, spacing, radius, mono, font } from "@/src/theme";

type Props = {
  label: string;
  unit?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  testID?: string;
} & Pick<TextInputProps, "keyboardType">;

export function NumberField({
  label,
  value,
  onChangeText,
  placeholder,
  testID,
  keyboardType = "numbers-and-punctuation",
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          testID={testID}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? "--"}
          placeholderTextColor={colors.borderStrong}
          keyboardType={keyboardType}
          returnKeyType="done"
          selectionColor={colors.brand}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  label: {
    fontSize: font.sm,
    color: colors.onSurfaceSecondary,
    fontWeight: "600",
    marginBottom: spacing.xs,
    letterSpacing: 0.2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  input: {
    flex: 1,
    fontFamily: mono,
    fontSize: font.xl,
    color: colors.onSurface,
    padding: 0,
  },
});
