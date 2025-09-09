// app/(tabs)/product/[id].tsx
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fetchProductByBarcode, ProductEval } from "../../../src/logic";
import { colors, radius, spacing } from "../../../src/theme";
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
        const res = await fetchProductByBarcode(String(id ?? "").trim());
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
    return () => {
      alive = false;
    };
  }, [id]);

  if (busy) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
          <AppText type="p3" muted style={{ marginTop: 6 }}>
            Produktdaten werden geladen…
          </AppText>
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
        {/* === Titelblock: Produktname (h2) + Marke (p2) === */}
        {(data.productName || data.brand) && (
          <View style={{ gap: 4 }}>
            {data.productName ? <AppText type="h2">{data.productName}</AppText> : null}
            {data.brand ? <AppText type="p2">{data.brand}</AppText> : null}
          </View>
        )}

        {/* Kategorie (optional) */}
        {data.category && (
          <AppText type="p3" muted>
            Kategorie: {data.categoryPath?.join(" – ") || data.category}
          </AppText>
        )}

        {/* Bild */}
        <View
          style={{
            backgroundColor: colors.primary_50,
            borderRadius: radius.lg,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {data.imageUrl ? (
            <Image source={{ uri: data.imageUrl }} style={{ width: "100%", height: 260, resizeMode: "cover" }} />
          ) : (
            <View style={{ padding: spacing.xl, alignItems: "center" }}>
              <AppText type="p2" muted>Kein Bild verfügbar</AppText>
            </View>
          )}
        </View>

        {/* Nährwerte – neues Design */}
        <View
          style={{
            borderRadius: radius.lg,
            backgroundColor: "#FFFAF0",
            borderWidth: 1,
            borderColor: "#FFE0D9",
            paddingVertical: spacing.lg,
            paddingHorizontal: spacing.lg,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <NutriCell label="Kalorien" value={fmt(data.nutrition.kcal, "kcal")} />
            <NutriCell label="Fett" value={fmtOne(data.nutrition.fat, "g")} />
            <NutriCell label="Zucker" value={fmtOne(data.nutrition.sugars, "g")} />
            <NutriCell label="Salz" value={fmtOne(data.nutrition.salt, "g")} />
          </View>
        </View>

        {/* Status */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, justifyContent: "center", marginTop: spacing.sm }}>
          <Text style={{ fontSize: 28 }}>{statusIcon}</Text>
          <AppText type="h2" style={{ color: statusColor }}>{statusText}</AppText>
        </View>

        {/* === Warum === */}
        <View style={{ gap: spacing.xs }}>
          <AppText type="h4">Warum {data.suitable ? "geeignet" : "nicht geeignet"}?</AppText>
          {data.reasons.map((r, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 8 }}>
              <Text>•</Text>
              <AppText type="p3" style={{ flex: 1 }}>{r}</AppText>
            </View>
          ))}
        </View>

        {/* === Details === */}
        <View style={{ gap: spacing.xs }}>
          <AppText type="h4">Details</AppText>
          <AppText type="p3">
            {data.description?.trim() || "Keine Beschreibung verfügbar. Daten stammen von OpenFoodFacts."}
          </AppText>
        </View>

        {/* === Zutaten === */}
        <View style={{ gap: spacing.xs }}>
          <AppText type="h4">Zutaten</AppText>

          {(() => {
            const ing = getIngredientsTextFromData(data);
            if (ing) return <AppText type="p3">{ing}</AppText>;
            return <AppText type="p3">Keine Zutatenliste verfügbar.</AppText>;
          })()}
        </View>

        {/* Extra-Abstand am Ende */}
        <View style={{ height: bottomPad }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- Helfer & NutriCell ---------- */

function fmt(v?: number, unit?: string) {
  if (typeof v !== "number" || !Number.isFinite(v)) return "–";
  const n = Math.round(v);
  return unit ? `${n} ${unit}` : n;
}

function fmtOne(v?: number, unit?: string) {
  if (typeof v !== "number" || !Number.isFinite(v)) return "–";
  const n = v.toFixed(1).replace(".", ",");
  return unit ? `${n} ${unit}` : n;
}

/** Zutaten robust (de bevorzugt) */
function getIngredientsTextFromData(x: any): string | null {
  const candidates = [
    x?.ingredientsText,
    x?.ingredients_text_de,
    x?.ingredients_text,
    x?.ingredients?.text_de,
    x?.ingredients?.text,
  ];
  const val = candidates.find((v) => typeof v === "string" && v.trim().length > 0);
  return val ? String(val).trim() : null;
}

/** Nährwert-Zelle (Design: #FFFAF0 / #FF8473) */
function NutriCell({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <AppText type="p3" style={{ color: "#FF8473", marginBottom: 4 }}>{label}</AppText>
      <AppText style={{ fontSize: 18, fontWeight: "600", color: "#FF8473" }}>
        {String(value)}
      </AppText>
    </View>
  );
}