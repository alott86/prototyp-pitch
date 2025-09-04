import { Pressable, Text, ViewStyle } from "react-native";
import { colors, radius, spacing, typography } from "../theme";

type Variant = "primary" | "secondary" | "ghost";

type Props = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
};

export default function AppButton({
  title,
  onPress,
  variant = "primary",
  disabled,
  style,
}: Props) {
  const bg =
    variant === "secondary" ? colors.secondary :
    variant === "ghost" ? "transparent" :
    colors.primary;

  const txt = variant === "ghost" ? colors.text : "#FFFFFF";

  const borderColor =
    variant === "ghost" ? colors.border :
    variant === "secondary" ? colors.secondary_700 :
    colors.primary_800;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          backgroundColor: bg,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xl,
          borderRadius: radius.pill,
          borderWidth: variant === "ghost" ? 1 : 0,
          borderColor,
          opacity: disabled ? 0.6 : 1,
          alignSelf: "flex-start",
        },
        style,
      ]}
    >
      <Text style={[typography.p2b, { color: txt, textAlign: "center" }]}>
        {title}
      </Text>
    </Pressable>
  );
}