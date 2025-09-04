import { Text, TextProps } from "react-native";
import { colors, fonts, typography } from "../theme";

type TType =
  | "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  | "p1" | "p1b" | "p2" | "p2b" | "p3" | "p3b";

type Props = TextProps & { type?: TType; muted?: boolean };

export default function AppText({ type = "p2", muted = false, style, ...rest }: Props) {
  const base = typography[type];
  return (
    <Text
      {...rest}
      style={[
        { color: muted ? colors.textMuted : colors.text, fontFamily: fonts.regular },
        base,
        style,
      ]}
    />
  );
}