import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Image, ScrollView, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getRecents, RecentItem, removeRecent, setFavorite } from "../../src/history";
import { colors, radius, spacing } from "../../src/theme";
import AppButton from "../../src/ui/AppButton";
import AppText from "../../src/ui/AppText";
import ProfileHeader from "../../src/ui/ProfileHeader";
import SettingsButtonOverlay, {
  SETTINGS_OVERLAY_HEIGHT,
} from "../../src/ui/SettingsButtonOverlay";
import { useTabBarPadding } from "../../src/ui/tabBarInset";

export default function FavoritesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<RecentItem[]>([]);
  const bottomPad = useTabBarPadding(spacing.lg);
  const insets = useSafeAreaInsets();
  const overlayTop = Math.max(insets.top + spacing.sm, spacing.lg);
  const contentTop = overlayTop + SETTINGS_OVERLAY_HEIGHT + spacing.lg;

  const load = useCallback(async () => {
    const list = await getRecents();
    setItems(list);
  }, []);

  const handleToggleFavorite = useCallback(async (id: string, next: boolean) => {
    await setFavorite(id, next);
    setItems((prev) => prev.map((entry) => (entry.id === id ? { ...entry, favorite: next } : entry)));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      return () => {};
    }, [load])
  );

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

        {items.length ? (
          <View style={{ gap: spacing.lg }}>
            {items.map((item) => (
              <FavoriteCard
                key={item.id}
                item={item}
                onOpen={() => router.push(`/product/${encodeURIComponent(item.id)}`)}
                onRemove={async () => {
                  await removeRecent(item.id);
                  load();
                }}
                onToggleFavorite={(next) => handleToggleFavorite(item.id, next)}
              />
            ))}
          </View>
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

function FavoriteCard({
  item,
  onOpen,
  onRemove,
  onToggleFavorite,
}: {
  item: RecentItem;
  onOpen: () => void;
  onRemove: () => Promise<void> | void;
  onToggleFavorite: (next: boolean) => Promise<void> | void;
}) {
  const suitable = item.suitable;
  const suitableLabel = suitable === true ? "Geeignet" : suitable === false ? "Nicht geeignet" : "Bewertung ausstehend";
  const suitabilityColor = suitable === false ? colors.secondary_600 : colors.primary_700;
  const suitabilityIcon: React.ComponentProps<typeof Feather>["name"] =
    suitable === false ? "x-circle" : suitable === true ? "check-circle" : "help-circle";
  const isFavorite = item.favorite === true;

  return (
    <View
      style={{
        borderRadius: radius.xl,
        backgroundColor: colors.bg,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
        elevation: 6,
      }}
    >
      <TouchableOpacity activeOpacity={0.85} onPress={onOpen} style={{ borderRadius: radius.xl, overflow: "hidden" }}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={{ width: "100%", height: 180 }} />
        ) : (
          <View
            style={{
              height: 180,
              backgroundColor: colors.primary_50,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppText type="p2" muted>Kein Bild verfügbar</AppText>
          </View>
        )}

        <View style={{ padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.bg }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: radius.pill,
                  backgroundColor: suitable === false ? colors.secondary_100 : colors.primary_100,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name={suitabilityIcon} size={18} color={suitabilityColor} />
              </View>
              <AppText type="p3" style={{ color: suitabilityColor }}>
                {suitableLabel}
              </AppText>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => onToggleFavorite(!isFavorite)}
              hitSlop={8}
            >
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: radius.pill,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isFavorite ? colors.secondary_100 : "transparent",
                  borderWidth: isFavorite ? 0 : 1,
                  borderColor: colors.border,
                }}
              >
                <Feather
                  name="heart"
                  size={18}
                  color={isFavorite ? colors.secondary_400 : colors.textMuted}
                  style={{ opacity: isFavorite ? 1 : 0.6 }}
                />
              </View>
            </TouchableOpacity>
          </View>

          <AppText type="h3" style={{ color: colors.text }}>
            {item.name || "Unbenannt"}
          </AppText>
          {item.brand ? (
            <AppText type="p3" muted>
              {item.brand}
            </AppText>
          ) : null}

        </View>
      </TouchableOpacity>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.lg,
          paddingTop: spacing.sm,
          gap: spacing.sm,
        }}
      >
        <AppButton title="Ansehen" variant="ghost" onPress={onOpen} />
        <AppButton title="Entfernen" variant="ghost" onPress={onRemove} />
      </View>
    </View>
  );
}
