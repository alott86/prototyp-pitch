import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleProp, ViewStyle } from "react-native";

import { colors, radius, spacing } from "../theme";

type Props = {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export default function SettingsButton({ onPress, style }: Props) {
  return (
    <Pressable
      accessibilityLabel="Einstellungen öffnen"
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={[
        {
          width: 40,
          height: 40,
          borderRadius: radius.pill,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 4,
          padding: spacing.xs,
        },
        style,
      ]}
    >
      <Feather name="settings" size={20} color="#FFFFFF" />
    </Pressable>
  );
}
