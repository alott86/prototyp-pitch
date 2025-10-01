// src/tabBarInset.ts
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMemo } from "react";

/**
 * Gibt ein paddingBottom zurück, damit Inhalte nicht von der Tab-Bar überdeckt werden.
 * Du kannst zusätzlich einen eigenen Offset (z. B. spacing.lg) addieren.
 */
export function useTabBarPadding(extra: number = 0) {
  const insets = useSafeAreaInsets();
  return useMemo(() => insets.bottom + extra, [insets.bottom, extra]);
}