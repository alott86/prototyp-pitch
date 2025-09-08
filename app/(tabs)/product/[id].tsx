import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fetchProductByBarcode, ProductEval } from "../../../src/logic";
import { colors, radius, spacing, typography } from "../../../src/theme";
import AppText from "../../../src/ui/AppText";
import { useTabBarPadding } from "../../../src/ui/tabBarInset";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [busy, setBusy] = useState(true);
  const [data, setData] = useState<ProductEval | null>(null);
  const bottomPad = useTabBarPadding(spacing.lg);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetchProductByBarcode(String(id || "").trim());
        if (!alive) return;
        if (!res) {
          Alert.alert("Nicht gefunden", "Für diesen Barcode wurden keine Produktdaten gefunden.");
          return;
        }
        setData(res);
      } catch {
        Alert.alert("Fehler", "Beim Abrufen der Produktdaten ist ein Fehler aufgetreten.");
      } finally {
        if (alive) setBusy(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  if (busy) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
          <AppText type="p3" muted style={{ marginTop: 6 }}>Produktdaten werden geladen…</AppText>
        </View>
      </SafeAreaView>
    );
  }
  if (!data) return null;

  const statusColor = data.suitable ? colors.primary_700 : colors.secondary_700;
  const statusIcon = data.suitable ? "✅" : "⛔";
  const statusText = data.suitable ? "Geeignet" : "Nicht geeignet";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{
          padding: spacing.lg,
          gap: spacing.lg,
          paddingBottom: bottomPad,
        }}
      >
        {(data.productName || data.brand) && (
          <AppText type="h3" style={{ color: colors.text }}>
            {data.productName || "Unbenannt"} {data.brand ? `· ${data.brand}` : ""}
          </AppText>
        )}

        {data.category && (
          <AppText type="p3" muted>
            Kategorie: {data.categoryPath?.join(" – ") || data.category}
          </AppText>
        )}

        <View style={{ backgroundColor: colors.primary_50, borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: colors.border }}>
          {data.imageUrl ? (
            <Image source={{ uri: data.imageUrl }} style={{ width: "100%", height: 260, resizeMode: "cover" }} />
          ) : (
            <View style={{ padding: spacing.xl, alignItems: "center" }}>
              <AppText type="p2" muted>Kein Bild verfügbar</AppText>
            </View>
          )}
        </View>

        <View style={{ borderRadius: radius.lg, backgroundColor: "#FEECE9", borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.md }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <NCell label="Kalorien" value={fmt(data.nutrition.kcal, "kcal")} />
            <NCell label="Fett" value={fmtOne(data.nutrition.fat, "g")} />
            <NCell label="Zucker" value={fmtOne(data.nutrition.sugars, "g")} />
            <NCell label="Salz" value={fmtOne(data.nutrition.salt, "g")} />
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, justifyContent: "center", marginTop: spacing.sm }}>
          <Text style={{ fontSize: 28 }}>{statusIcon}</Text>
          <AppText type="h2" style={{ color: statusColor }}>{statusText}</AppText>
        </View>

        <View style={{ gap: spacing.sm }}>
          <AppText type="h3">Warum {data.suitable ? "geeignet" : "nicht geeignet"}?</AppText>
          {data.reasons.map((r, i) => (
            <View key={i} style={{ flexDirection: "row", gap: spacing.sm }}>
              <Text>•</Text>
              <AppText style={{ flex: 1 }}>{r}</AppText>
            </View>
          ))}
        </View>

        <View style={{ gap: spacing.sm }}>
          <AppText type="h3">Details</AppText>
          <AppText type="p2">
            {data.description?.trim() || "Keine Beschreibung verfügbar. Daten stammen von OpenFoodFacts."}
          </AppText>
        </View>

        {/* expliziter Spacer, damit nichts unter der Bar liegt */}
        <View style={{ height: bottomPad }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/** Helfer */
function NCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ width: "24%" }}>
      <AppText type="p3" muted>{label}</AppText>
      <Text style={{ ...typography.h3, color: colors.text }}>{value}</Text>
    </View>
  );
}
function fmt(v?: number, unit?: string) {
  if (typeof v !== "number" || !Number.isFinite(v)) return "–";
  const n = Math.round(v);
  return unit ? `${n} ${unit}` : String(n);
}
function fmtOne(v?: number, unit?: string) {
  if (typeof v !== "number" || !Number.isFinite(v)) return "–";
  const n = v.toFixed(1).replace(".", ",");
  return unit ? `${n} ${unit}` : n;
}