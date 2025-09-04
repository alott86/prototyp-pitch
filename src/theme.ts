// src/theme.ts
import { Platform } from "react-native";

export const colors = {
  primary: "#91C788",
  primary_50: "#F4F9F3",
  primary_100: "#D3E9CF",
  primary_200: "#B2D8AC",
  primary_700: "#749F6D",
  primary_800: "#577752",
  primary_900: "#3A5036",
  secondary: "#FF9385",
  secondary_50: "#FFF4F3",
  secondary_100: "#FFD4CE",
  secondary_200: "#FFB3AA",
  secondary_700: "#CC766A",
  secondary_800: "#995850",
  secondary_900: "#663B35",
  bg: "#FFFFFF",
  text: "#111111",
  textMuted: "#444444",
  border: "#E5E7EB",
};
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };
export const typography = {
  h1: { fontSize: 36, lineHeight: 46, fontWeight: "600" as const },
  h2: { fontSize: 24, lineHeight: 34, fontWeight: "600" as const },
  h3: { fontSize: 22, lineHeight: 32, fontWeight: "600" as const },
  h4: { fontSize: 18, lineHeight: 28, fontWeight: "600" as const },
  h5: { fontSize: 16, lineHeight: 26, fontWeight: "600" as const },
  h6: { fontSize: 14, lineHeight: 24, fontWeight: "600" as const },
  p1:  { fontSize: 18, lineHeight: 28, fontWeight: "400" as const },
  p1b: { fontSize: 18, lineHeight: 28, fontWeight: "600" as const },
  p2:  { fontSize: 16, lineHeight: 26, fontWeight: "400" as const },
  p2b: { fontSize: 16, lineHeight: 26, fontWeight: "600" as const },
  p3:  { fontSize: 14, lineHeight: 24, fontWeight: "400" as const },
  p3b: { fontSize: 14, lineHeight: 24, fontWeight: "600" as const },
};
export const fonts = {
  regular: Platform.select({ ios: "System", android: "Roboto", default: "System" }),
  medium:  Platform.select({ ios: "System", android: "Roboto", default: "System" }),
};