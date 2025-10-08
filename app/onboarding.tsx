import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import AppButton from "../src/ui/AppButton";
import AppText from "../src/ui/AppText";
import { colors, radius, spacing } from "../src/theme";
import { STORAGE_KEYS } from "../src/storageKeys";

const SLIDES: Array<{ key: string; title: string; description: string; icon: React.ComponentProps<typeof Feather>["name"] }>
  = [
    {
      key: "healthy",
      title: "Gesunde Entscheidungen",
      description: "Verstehe sofort, welche Lebensmittel deinem Kind wirklich gut tun.",
      icon: "heart",
    },
    {
      key: "scan",
      title: "Schnell zum Ergebnis",
      description: "Scanne Produkte oder durchstöbere Kategorien, um in Sekunden Entscheidungen zu treffen.",
      icon: "camera",
    },
    {
      key: "science",
      title: "Wissenschaftlich fundiert",
      description: "Bewertungen basieren auf dem WHO-Modell und aktuellen Ernährungsempfehlungen.",
      icon: "book-open",
    },
  ];

export default function OnboardingScreen() {
  const router = useRouter();
  const listRef = useRef<FlatList<any> | null>(null);
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const handleGetStarted = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.onboardingSeen, "1");
    } catch (error) {
      console.warn("Failed to persist onboarding flag", error);
    }
    router.replace("/(tabs)/scan");
  }, [router, saving]);

  const handleMomentumEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offset / width);
    setIndex(newIndex);
  }, [width]);

  const handleNext = useCallback(() => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      void handleGetStarted();
    }
  }, [index, handleGetStarted]);

  const handleSkip = useCallback(() => {
    void handleGetStarted();
  }, [handleGetStarted]);

  const buttonLabel = useMemo(
    () => (index === SLIDES.length - 1 ? "Los geht's" : "Weiter"),
    [index]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, paddingTop: spacing.xl, paddingBottom: spacing.lg }}>
        <View style={{ paddingHorizontal: spacing.lg, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <AppText type="h2" style={{ color: colors.primary_600 }}>NuMum</AppText>
          <TouchableOpacity onPress={handleSkip} hitSlop={8}>
            <AppText type="p3" style={{ color: colors.primary_600 }}>
              Überspringen
            </AppText>
          </TouchableOpacity>
        </View>

        <FlatList
          ref={listRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          data={SLIDES}
          keyExtractor={(item) => item.key}
          onMomentumScrollEnd={handleMomentumEnd}
          renderItem={({ item }) => (
            <View
              style={{
                width,
                paddingHorizontal: spacing.lg,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: 220,
                  height: 220,
                  borderRadius: radius.xl,
                  backgroundColor: colors.primary_100,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: spacing.xl,
                }}
              >
                <Feather name={item.icon} size={96} color={colors.primary_600} />
              </View>

              <AppText type="h2" style={{ textAlign: "center", color: colors.text, marginBottom: spacing.sm }}>
                {item.title}
              </AppText>
              <AppText type="p2" muted style={{ textAlign: "center" }}>
                {item.description}
              </AppText>
            </View>
          )}
        />

        <View style={{ alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg }}>
          <View style={{ flexDirection: "row", gap: spacing.xs }}>
            {SLIDES.map((slide, slideIndex) => {
              const active = slideIndex === index;
              return (
                <View
                  key={slide.key}
                  style={{
                    width: active ? 16 : 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: active ? colors.primary_600 : colors.primary_200,
                  }}
                />
              );
            })}
          </View>

          <AppButton
            title={buttonLabel}
            onPress={handleNext}
            disabled={saving}
            style={{ alignSelf: "center", paddingHorizontal: spacing.xl }}
          />
        </View>
      </View>
    </View>
  );
}
