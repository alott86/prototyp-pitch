import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { colors, radius, spacing } from "../theme";
import AppText from "./AppText";

export type SectionCardItem = {
  icon?: React.ComponentProps<typeof Feather>["name"];
  iconColor?: string;
  label?: string;
  description?: string;
  action?: () => void;
  tone?: "default" | "danger";
  content?: React.ReactNode;
};

type Props = {
  title: string;
  items: SectionCardItem[];
  style?: object;
};

export default function SectionCard({ title, items, style }: Props) {
  if (!items.length) return null;

  return (
    <View style={style}> 
      <AppText type="p3" muted style={{ textTransform: "uppercase", letterSpacing: 0.8, marginBottom: spacing.xs }}>
        {title}
      </AppText>
      <View style={styles.card}>
        {items.map((item, idx) => (
          <CardRow key={idx} item={item} showDivider={idx < items.length - 1} />
        ))}
      </View>
    </View>
  );
}

function CardRow({ item, showDivider }: { item: SectionCardItem; showDivider: boolean }) {
  const { icon, iconColor, label, description, action, tone = "default", content } = item;
  const color = tone === "danger" ? colors.secondary_600 : colors.text;

  const Wrapper: React.ElementType = action ? TouchableOpacity : View;
  const wrapperProps = action
    ? { activeOpacity: 0.75, onPress: action }
    : {};

  const baseStyle = {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  } as const;

  return (
    <Wrapper
      {...wrapperProps}
      style={content ? [baseStyle, { alignItems: "stretch" }] : [baseStyle, { flexDirection: "row", alignItems: "center" }]}
    >
      {content ? (
        <View style={{ flex: 1, gap: spacing.sm }}>{content}</View>
      ) : (
        <>
          {icon ? (
            <View style={styles.iconBubble}>
              <Feather name={icon} size={20} color={iconColor ?? colors.primary_700} />
            </View>
          ) : null}
          <View style={{ flex: 1 }}>
            {label ? (
              <AppText type="p2" style={{ color }}>
                {label}
              </AppText>
            ) : null}
            {description ? (
              <AppText type="p3" muted style={{ marginTop: 4 }}>
                {description}
              </AppText>
            ) : null}
          </View>
          <Feather
            name="chevron-right"
            size={20}
            color={tone === "danger" ? colors.secondary_600 : colors.textMuted}
          />
        </>
      )}
      {showDivider ? <View style={styles.divider} /> : null}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary_50,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
