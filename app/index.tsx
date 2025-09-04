import { Link } from "expo-router";
import { View } from "react-native";
import { colors, spacing } from "../src/theme";
import AppButton from "../src/ui/AppButton";
import AppText from "../src/ui/AppText";

export default function Home() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        padding: spacing.xl,
        justifyContent: "center",
      }}
    >
      <AppText type="h1" style={{ marginBottom: spacing.lg }}>
        FoodScan
      </AppText>

      <AppText type="p2" muted style={{ marginBottom: spacing.xl }}>
        Scanne einen Barcode und bewerte das Produkt nach WHO-Regeln.
      </AppText>

      <Link href="/scan" asChild>
        <AppButton title="Barcode scannen" />
      </Link>
    </View>
  );
}