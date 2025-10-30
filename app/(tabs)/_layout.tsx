import { Feather } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs, useRouter } from "expo-router";
import React from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";

const ACTIVE = "#FF9385";
const INACTIVE = "#9CA3AF"; // neutral grau
const SCAN_BG = "#91C788";
const BAR_BG = "#FFFFFF";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" }, // wir bauen eigene Bar
      }}
      tabBar={(props) => <CustomBar {...props} />}
    >
      {/* sichtbare Tabs */}
      <Tabs.Screen name="search" />
      <Tabs.Screen name="favorites" />
      <Tabs.Screen name="profile" />
      {/* zusätzlicher Screen innerhalb des Tab-Navigators, aber NICHT als Tab angezeigt */}
      <Tabs.Screen name="product/[id]" options={{ href: null }} />
    </Tabs>
  );
}

function CustomBar({ state, navigation }: BottomTabBarProps) {
  const router = useRouter();
  const activeRoute = state.routes[state.index];
  const currentRoute = activeRoute?.name;

  if (currentRoute === "product/[id]" || (activeRoute?.params as { hideTabBar?: boolean } | undefined)?.hideTabBar) {
    return null;
  }

  const goTo = (name: string) => {
    navigation.navigate(name as never);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.bar}>
        {/* linke Seite */}
        <IconButton
          icon="search"
          active={currentRoute === "search"}
          onPress={() => goTo("search")}
        />

        {/* Scan-Button in der Mitte (führt zu /scan innerhalb der Tabs-Gruppe) */}
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => router.push("/scan")}
          style={styles.scanButton}
          activeOpacity={0.9}
        >
          <Feather name="camera" size={28} color="#ffffff" />
        </TouchableOpacity>

        {/* rechte Seite */}
        {/* Verlauf: statt heart -> clipboard (Feather) */}
        <IconButton
          icon="clipboard"
          active={currentRoute === "favorites"}
          onPress={() => goTo("favorites")}
        />
      </View>
    </View>
  );
}

function IconButton({
  icon,
  active,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.iconHit} activeOpacity={0.8}>
      <Feather name={icon} size={26} color={active ? ACTIVE : INACTIVE} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: Platform.select({ ios: 16, android: 12 }),
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  bar: {
    height: 72,
    backgroundColor: BAR_BG,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  iconHit: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  scanButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: SCAN_BG,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
