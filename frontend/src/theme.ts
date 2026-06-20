import { Platform } from "react-native";

// Design tokens — dark cockpit / instrument theme with neon-green accent
// (matches the "Jet A1" aviation calculator look).
export const colors = {
  surface: "#121821", // cards, header
  onSurface: "#F2F5F8", // primary text
  surfaceSecondary: "#0A0E14", // page background, inset inputs
  onSurfaceSecondary: "#AEB8C4",
  surfaceTertiary: "#1A2230",
  onSurfaceTertiary: "#8A95A2",
  surfaceInverse: "#34F58D",
  onSurfaceInverse: "#06210F", // dark text/icon on green surfaces
  brand: "#34F58D", // neon green accent
  brandPrimary: "#2BE07E",
  onBrandPrimary: "#06210F",
  brandSoft: "rgba(52,245,141,0.10)",
  success: "#34F58D",
  successSurface: "rgba(52,245,141,0.12)",
  onSuccess: "#06210F",
  warning: "#FFB020",
  warningSurface: "rgba(255,176,32,0.12)",
  onWarning: "#1A1200",
  error: "#FF5247",
  errorSurface: "rgba(255,82,71,0.12)",
  onError: "#FFFFFF",
  border: "#222C38",
  borderStrong: "#3A4552",
  divider: "#1B232E",
  muted: "#6B7682",
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
  sm: 6,
  md: 10,
  lg: 16,
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

// Neutral elevation (barely visible on dark) for plain cards.
export const shadow = {
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 6,
  elevation: 3,
};

// Neon-green glow for active / highlighted elements.
export const glow = {
  shadowColor: "#34F58D",
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.5,
  shadowRadius: 14,
  elevation: 10,
};
