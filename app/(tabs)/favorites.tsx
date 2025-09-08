// app/(tabs)/favorites.tsx
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { RecentItem, clearRecents, getRecents, removeRecent } from "../../src/history";
import { colors, radius, spacing } from "../../src/theme";
import AppButton from "../../src/ui/AppButton";
import AppText from "../../src/ui/AppText";

export default function FavoritesScreen() {
  const [items, setItems] = useState<RecentItem[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const list = await getRecents();
    setItems(list);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  async function onRemove(id: string) {
    await removeRecent(id);
    await load();
  }

  async function onClear() {
    await clearRecents();
    await load();
  }

  if (items === null) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
        ListHeaderComponent={
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <AppText type="h2" style={{ color: colors.text }}>
              Zuletzt geprüft
            </AppText>
            {items.length > 0 && (
              <AppButton title="Alle löschen" onPress={onClear} variant="ghost" />
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={{ marginTop: spacing.xl, alignItems: "center" }}>
            <AppText type="p2" muted>
              Hier erscheinen die letzten 10 Produkte aus Scan & manueller Suche.
            </AppText>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={{
              flexDirection: "row",
              gap: spacing.md,
              backgroundColor: "#FFF",
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.md,
              alignItems: "center",
            }}
          >
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
                <Text style={{ fontSize: 12, color: colors.textMuted }}>Kein Bild</Text>
              </View>
            )}

            <View style={{ flex: 1 }}>
              <AppText type="p2" numberOfLines={1} style={{ color: colors.text }}>
                {item.name || "Unbekanntes Produkt"}
              </AppText>
              {item.brand ? (
                <AppText type="p3" muted numberOfLines={1}>
                  {item.brand}
                </AppText>
              ) : null}
              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                ID: {item.id}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => onRemove(item.id)}
              accessibilityRole="button"
            >
              <Text style={{ color: colors.secondary_700 }}>Entfernen</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}