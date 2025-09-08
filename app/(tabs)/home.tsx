import React from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../../src/theme";
import AppText from "../../src/ui/AppText";
import { useTabBarPadding } from "../../src/ui/tabBarInset";

export default function HomeScreen() {
  const bottomPad = useTabBarPadding(spacing.lg);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: bottomPad,
          gap: spacing.lg,
        }}
      >
        <View>
          <AppText type="h1" style={{ color: colors.text }}>Home</AppText>
          <AppText type="p2" muted>Willkommen 👋</AppText>
        </View>
        {/* … deine weiteren Home-Abschnitte … */}
      </ScrollView>
    </SafeAreaView>
  );
}