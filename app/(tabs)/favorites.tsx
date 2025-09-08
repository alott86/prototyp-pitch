// app/(tabs)/favorites.tsx
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { FlatList, Image, SafeAreaView, TouchableOpacity, View } from "react-native";

import { clearRecents, getRecents, RecentItem, removeRecent } from "../../src/history";
import { colors, radius, spacing } from "../../src/theme";
import AppButton from "../../src/ui/AppButton";
import AppText from "../../src/ui/AppText";

export default function FavoritesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const list = await getRecents();
    setItems(list);
    setLoading(false);
  }, []);

  // Beim Fokussieren des Tabs: Verlauf neu laden
  useFocusEffect(
    useCallback(() => {
      load();
      // kein Cleanup nötig
      return () => {};
    }, [load])
  );

  const renderItem = ({ item }: { item: RecentItem }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => router.push(`/product/${encodeURIComponent(item.id)}`)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      {/* Bild / Platzhalter */}
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={{
            width: 64,
            height: 64,
            borderRadius: radius.md,
            backgroundColor: colors.primary_50,
          }}
        />
      ) : (
        <View
          style={{
            width: 64,
            height: 64,
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

      {/* Texte */}
      <View style={{ flex: 1 }}>
        <AppText type="p2" style={{ color: colors.text }}>
          {item.name || "Unbenannt"}
        </AppText>
        {item.brand ? <AppText type="p3" muted>{item.brand}</AppText> : null}
      </View>

      {/* Entfernen */}
      <AppButton
        title="Entfernen"
        variant="ghost"
        onPress={async () => {
          await removeRecent(item.id);
          load();
        }}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
        <AppText type="h2" style={{ color: colors.text }}>Verlauf</AppText>
        <AppText type="p3" muted>
          Zuletzt geprüfte Produkte (max. 10). Tippe auf einen Eintrag, um die Bewertung erneut zu sehen.
        </AppText>
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingTop: spacing.md }}
        ListEmptyComponent={
          <View style={{ padding: spacing.lg }}>
            <AppText type="p2" muted>Noch keine Einträge vorhanden.</AppText>
          </View>
        }
        refreshing={loading}
        onRefresh={load}
      />

      {items.length > 0 && (
        <View style={{ padding: spacing.lg }}>
          <AppButton
            title="Verlauf leeren"
            variant="ghost"
            onPress={async () => {
              await clearRecents();
              load();
            }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}