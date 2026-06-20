import { Platform } from "react-native";

// Design tokens — clinical / instrument aviation theme (light)
export const colors = {
  surface: "#FFFFFF",
  onSurface: "#101828",
  surfaceSecondary: "#F2F4F7",
  onSurfaceSecondary: "#344054",
  surfaceTertiary: "#E4E7EC",
  onSurfaceTertiary: "#475467",
  surfaceInverse: "#101828",
  onSurfaceInverse: "#FFFFFF",
  brand: "#101828",
  brandPrimary: "#1D2939",
  onBrandPrimary: "#FFFFFF",
  success: "#027A48",
  successSurface: "#ECFDF3",
  onSuccess: "#FFFFFF",
  warning: "#DC6803",
  warningSurface: "#FFFAEB",
  onWarning: "#FFFFFF",
  error: "#D92D20",
  errorSurface: "#FEF3F2",
  onError: "#FFFFFF",
  border: "#E4E7EC",
  borderStrong: "#98A2B3",
  divider: "#EAECF0",
  muted: "#667085",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
};

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  pill: 999,
};

export const mono = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "SpaceMono",
});

export const font = {
  sm: 12,
  base: 14,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 34,
};

export const shadow = {
  shadowColor: "#101828",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 3,
  elevation: 2,
};
