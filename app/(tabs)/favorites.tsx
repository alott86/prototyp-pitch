import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Image, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getRecents, RecentItem, removeRecent } from "../../src/history";
import { colors, radius, spacing } from "../../src/theme";
import AppButton from "../../src/ui/AppButton";
import AppText from "../../src/ui/AppText";
import ProfileHeader from "../../src/ui/ProfileHeader";
import SectionCard from "../../src/ui/SectionCard";
import SettingsButtonOverlay, {
  SETTINGS_OVERLAY_HEIGHT,
} from "../../src/ui/SettingsButtonOverlay";
import { useTabBarPadding } from "../../src/ui/tabBarInset";

export default function FavoritesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<RecentItem[]>([]);
  const bottomPad = useTabBarPadding(spacing.lg);
  const insets = useSafeAreaInsets();
  const overlayTop = insets.top + spacing.lg;
  const contentTop = overlayTop + SETTINGS_OVERLAY_HEIGHT + spacing.lg;

  const load = useCallback(async () => {
    const list = await getRecents();
    setItems(list);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      return () => {};
    }, [load])
  );

  const sectionItems = useMemo(() => {
    if (!items.length) return [];
    return items.map((item) => ({
      content: (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
          }}
        >
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={{ width: 60, height: 60, borderRadius: radius.md, backgroundColor: colors.primary_50 }}
            />
          ) : (
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: radius.md,
                backgroundColor: colors.primary_50,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <AppText type="p3" muted>Ohne Bild</AppText>
            </View>
          )}

          <View style={{ flex: 1 }}>
            <AppText type="p2" style={{ color: colors.text }}>
              {item.name || "Unbenannt"}
            </AppText>
            {item.brand ? (
              <AppText type="p3" muted>
                {item.brand}
              </AppText>
            ) : null}
            <View style={{ marginTop: spacing.xs }}>
              <AppButton
                title="Zeigen"
                variant="ghost"
                onPress={() => router.push(`/product/${encodeURIComponent(item.id)}`)}
              />
            </View>
          </View>

          <AppButton
            title="Entfernen"
            variant="ghost"
            onPress={async () => {
              await removeRecent(item.id);
              load();
            }}
          />
        </View>
      ),
    }));
  }, [items, load, router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SettingsButtonOverlay onPress={() => router.push("/(tabs)/profile")} offset={spacing.sm} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: contentTop,
          paddingBottom: bottomPad,
          gap: spacing.xl,
        }}
      >
        <ProfileHeader
          title="Verlauf"
          subtitle="Deine letzten Scans, schnell wiederfinden."
          icon="clipboard"
        />

        {sectionItems.length ? (
          <SectionCard title="Zuletzt geprüft" items={sectionItems} />
        ) : (
          <View style={{ alignItems: "center", gap: spacing.sm }}>
            <AppText type="p2" muted>
              Noch keine Produkte gescannt.
            </AppText>
            <AppButton
              title="Zum Scanner"
              onPress={() => router.push("/(tabs)/scan")}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
