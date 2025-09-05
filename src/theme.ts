// src/theme.ts
import { Platform } from "react-native";

// ---------- Farben ----------
export const colors = {
  // Neutrals
  bg: "#FFFFFF",
  text: "#111111",
  textMuted: "#444444",
  border: "#E5E7EB",

  // Primary (Grün) – Figma-Reihenfolge
  // 91C788, F4F9F3, D3E9CF, B2D8AC, 749F6D, 577752, 3A5036
  primary: "#91C788",
  primary_50:  "#F4F9F3",
  primary_100: "#D3E9CF",
  primary_200: "#B2D8AC",
  primary_400: "#91C788",
  primary_600: "#577752",
  primary_700: "#3A5036",

  // Secondary (Rot/Rosa)
  // FF9385, FFF4F3, FFD4CE, FFB3AA, CC766A, 995850, 663B35
  secondary: "#FF9385",
  secondary_50:  "#FFF4F3",
  secondary_100: "#FFD4CE",
  secondary_200: "#FFB3AA",
  secondary_400: "#FF9385",
  secondary_600: "#CC766A",
  secondary_700: "#995850",
  secondary_800: "#663B35",

  // --- Aliase / Kompatibilität (damit Code mit führender Null läuft) ---
  primary_050: "#F4F9F3",
  secondary_050: "#FFF4F3",

  // Statusfarben (Aliase)
  success: "#91C788",
  success_700: "#3A5036",
  danger: "#FF9385",
} as const;

// ---------- Abstände ----------
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  pill: 999,
} as const;

// ---------- Eckenradius ----------
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

// ---------- Typografie ----------
export const typography = {
  // Headings
  h1: { fontSize: 36, lineHeight: 46, fontWeight: "600" as const },
  h2: { fontSize: 24, lineHeight: 34, fontWeight: "600" as const },
  h3: { fontSize: 22, lineHeight: 32, fontWeight: "600" as const },
  h4: { fontSize: 18, lineHeight: 28, fontWeight: "600" as const },

  // Paragraphs
  p1:  { fontSize: 18, lineHeight: 28, fontWeight: "400" as const },
  p1b: { fontSize: 18, lineHeight: 28, fontWeight: "600" as const },
  p2:  { fontSize: 16, lineHeight: 26, fontWeight: "400" as const },
  p2b: { fontSize: 16, lineHeight: 26, fontWeight: "600" as const },
  p3:  { fontSize: 14, lineHeight: 24, fontWeight: "400" as const },
  p3b: { fontSize: 14, lineHeight: 24, fontWeight: "600" as const },
} as const;

// ---------- System-Fonts (robust, keine extra Installation nötig) ----------
export const fonts = {
  regular: Platform.select({ ios: "System", android: "sans-serif", default: "System" }),
  medium:  Platform.select({ ios: "System", android: "sans-serif-medium", default: "System" }),
  bold:    Platform.select({ ios: "System", android: "sans-serif", default: "System" }),
} as const;

// (Optionale) Typen
export type ThemeColors = typeof colors;
export type ThemeSpacing = typeof spacing;
export type ThemeRadius = typeof radius;
export type ThemeTypography = typeof typography;
export type ThemeFonts = typeof fonts;