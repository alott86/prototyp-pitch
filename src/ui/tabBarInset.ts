// src/ui/tabBarInset.ts
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// exakt wie in _layout.tsx
export const TAB_BAR_HEIGHT = 72;
// das Extra-Padding, das der Wrapper unten addiert (ios 16 / android 12)
const WRAPPER_EXTRA = Platform.select({ ios: 16, android: 12 }) ?? 12;

/** Einheitliches Bottom-Padding für ScrollViews/FlatLists etc. */
export function useTabBarPadding(extra = 0) {
  const { bottom } = useSafeAreaInsets();
  return bottom + TAB_BAR_HEIGHT + WRAPPER_EXTRA + extra;
}