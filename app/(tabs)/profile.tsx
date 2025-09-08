import React from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../../src/theme";
import AppText from "../../src/ui/AppText";
import { useTabBarPadding } from "../../src/ui/tabBarInset";

export default function ProfileScreen() {
  const bottomPad = useTabBarPadding(spacing.lg);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: bottomPad,
          gap: spacing.lg,
        }}
      >
        <AppText type="h2" style={{ color: colors.text }}>Profil</AppText>
        {/* … Profil-Inhalte, Einstellungen etc. … */}
      </ScrollView>
    </SafeAreaView>
  );
}