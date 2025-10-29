import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Image, ScrollView, TouchableOpacity, View } from "react-native";

import { getRecents, RecentItem, removeRecent, setFavorite } from "../../src/history";
import { colors, radius, spacing } from "../../src/theme";
import AppButton from "../../src/ui/AppButton";
import AppText from "../../src/ui/AppText";
import ProfileHeader from "../../src/ui/ProfileHeader";
import SettingsButton from "../../src/ui/SettingsButton";
import { useTabBarPadding } from "../../src/ui/tabBarInset";

const NUMUM_LOGO = require("../../assets/images/NuMum_Logo Kopie.png");
const LOGO_SIZE = 120;
const LOGO_TOP_MARGIN = spacing.lg;
const BUTTON_TOP_MARGIN = LOGO_TOP_MARGIN + spacing.xs;

export default function FavoritesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<RecentItem[]>([]);
  const bottomPad = useTabBarPadding(spacing.lg);

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
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: 0,
          paddingBottom: bottomPad,
          gap: spacing.xl,
        }}
        contentInsetAdjustmentBehavior="never"
      >
        <View style={{ paddingTop: LOGO_TOP_MARGIN, marginBottom: spacing.sm }}>
          <View style={{ alignItems: "center" }}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Zum Startbildschirm"
              activeOpacity={0.8}
              onPress={() => router.replace("/")}
            >
              <Image
                source={NUMUM_LOGO}
                style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
          <View
            pointerEvents="box-none"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 30,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: BUTTON_TOP_MARGIN,
              paddingHorizontal: spacing.lg,
            }}
          >
            <View style={{ width: 40, height: 40 }} />
            <SettingsButton onPress={() => router.push("/(tabs)/profile")} />
          </View>
        </View>

        <ProfileHeader
          title="Verlauf"
          subtitle="Deine letzten Scans, schnell wiederfinden."
          icon="clipboard"
          showAvatar={false}
        />

        {items.length ? (
          <View style={{ gap: spacing.lg }}>
            {items.map((item) => (
              <FavoriteCard
                key={item.id}
                item={item}
                onOpen={() =>
                  router.push({
                    pathname: "/product/[id]",
                    params: { id: item.id, source: "favorites" },
                  })
                }
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
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: "100%", height: 180, backgroundColor: colors.primary_50 }}
            resizeMode="contain"
          />
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
