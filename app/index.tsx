import { useRouter } from "expo-router";
import React from "react";
import { Image, Platform, TouchableOpacity, View } from "react-native";

import { colors, spacing } from "../src/theme";
import AppText from "../src/ui/AppText";

const NUMUM_LOGO = require("../assets/images/NuMum_Logo Kopie.png");

export default function Index() {
  const router = useRouter();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: spacing.lg,
      }}
   >
      <View style={{ alignItems: "center", gap: spacing.lg, marginTop: -80 }}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.replace("/(tabs)/scan")}
        >
          <Image
            source={NUMUM_LOGO}
            resizeMode="contain"
            style={{ width: 300, height: 300 }}
          />
        </TouchableOpacity>

        <AppText
          type="h1"
          style={{
            textAlign: "center",
            color: "#FF69B4",
            // Rundere Schrift: iOS nutzt ArialRounded, Android bleibt bei sans-serif fett
            fontFamily: Platform.select({ ios: "ArialRoundedMTBold", android: "sans-serif", default: "System" }),
            fontWeight: Platform.OS === "android" ? "700" : undefined,
            letterSpacing: 0.5,
          }}
        >
          Ein Scan,{"\n"} ein sicheres Gefühl.
        </AppText>
      </View>
    </View>
  );
}
