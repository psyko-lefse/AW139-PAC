import { Platform } from "react-native";

// Design tokens — "Clean Light Instrument": soft daylight surfaces, deep
// aviation-blue primary, fresh lime-green pass accent. Sleek & modern.
export const colors = {
  surface: "#FFFFFF", // cards, header
  onSurface: "#0F172A", // primary text (slate-900)
  surfaceSecondary: "#F1F5F9", // page background, inset inputs (slate-100)
  onSurfaceSecondary: "#475569", // slate-600
  surfaceTertiary: "#E2E8F0", // slate-200
  onSurfaceTertiary: "#64748B", // slate-500
  surfaceInverse: "#0F172A",
  onSurfaceInverse: "#FFFFFF", // text/icon on colored (blue/green) fills
  brand: "#1E4FD8", // deep aviation blue
  brandPrimary: "#1A45BE",
  onBrandPrimary: "#FFFFFF",
  brandSoft: "rgba(30,79,216,0.08)",
  success: "#15B66E", // fresh lime-green
  successSurface: "#E7F8EF",
  onSuccess: "#FFFFFF",
  warning: "#D97706",
  warningSurface: "#FEF3E2",
  onWarning: "#FFFFFF",
  error: "#DC2626",
  errorSurface: "#FEF2F2",
  onError: "#FFFFFF",
  border: "#E5EAF1",
  borderStrong: "#CBD5E1",
  divider: "#EEF2F6",
  muted: "#94A3B8",
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
  sm: 8,
  md: 12,
  lg: 18,
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

// Soft, modern elevation for light surfaces.
export const shadow = {
  shadowColor: "#1E293B",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.06,
  shadowRadius: 16,
  elevation: 3,
};

// Subtle colored lift for primary/accent elements.
export const glow = {
  shadowColor: "#1E4FD8",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.28,
  shadowRadius: 12,
  elevation: 8,
};
