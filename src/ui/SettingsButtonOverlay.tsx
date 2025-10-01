import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { spacing } from "../theme";
import SettingsButton from "./SettingsButton";

export const SETTINGS_OVERLAY_HEIGHT = 40;

type Props = {
  onPress: () => void;
  offset?: number;
  minTop?: number;
};

export default function SettingsButtonOverlay({ onPress, offset = spacing.md, minTop = spacing.lg }: Props) {
  const insets = useSafeAreaInsets();
  const top = Math.max(insets.top + offset, minTop);

  return (
    <View pointerEvents="box-none" style={[styles.overlay, { top }]}>
      <SettingsButton onPress={onPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    right: spacing.lg,
    zIndex: 30,
  },
});
