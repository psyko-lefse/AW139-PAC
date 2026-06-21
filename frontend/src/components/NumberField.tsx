import React, { useState } from "react";
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
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          focused && styles.inputRowFocused,
          !!value && !focused && styles.inputRowFilled,
        ]}
      >
        <TextInput
          testID={testID}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder ?? "––"}
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
    fontSize: 11,
    color: colors.onSurfaceTertiary,
    fontWeight: "700",
    marginBottom: spacing.xs + 2,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: "transparent",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 54,
  },
  inputRowFilled: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  inputRowFocused: {
    backgroundColor: colors.surface,
    borderColor: colors.brand,
  },
  input: {
    flex: 1,
    fontFamily: mono,
    fontSize: font.xl,
    color: colors.onSurface,
    padding: 0,
  },
});
