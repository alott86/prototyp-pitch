import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";

import { colors, radius, spacing, typography } from "../theme";
import AppText from "./AppText";

type Props = {
  title: string;
  subtitle?: string;
  icon?: React.ComponentProps<typeof Feather>["name"];
  accent?: React.ComponentProps<typeof Feather>["name"];
  accentColor?: string;
  showAvatar?: boolean;
};

export default function ProfileHeader({
  title,
  subtitle,
  icon = "user",
  accent,
  accentColor,
  showAvatar = true,
}: Props) {
  return (
    <View style={styles.wrapper}>
      {showAvatar ? (
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarCircle}>
            <Feather name={icon} size={42} color={colors.primary_700} />
          </View>
          {accent ? (
            <View style={[styles.accentBadge, { backgroundColor: accentColor ?? colors.secondary_200 }]}> 
              <Feather name={accent} size={16} color={colors.secondary_600} />
            </View>
          ) : null}
        </View>
      ) : null}

      <AppText type="h2" style={{ color: colors.text, textAlign: "center" }}>
        {title}
      </AppText>
      {subtitle ? (
        <AppText type="p3" muted style={{ textAlign: "center" }}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    gap: spacing.sm,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.primary_50,
    alignItems: "center",
    justifyContent: "center",
  },
  accentBadge: {
    position: "absolute",
    right: -spacing.sm,
    bottom: -spacing.sm,
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.bg,
  },
});
