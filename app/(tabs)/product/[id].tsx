// app/(tabs)/product/[id].tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fetchProductByBarcode, ProductEval } from "../../../src/logic";
import { colors, radius, spacing } from "../../../src/theme";
import AppText from "../../../src/ui/AppText";
import ProfileHeader from "../../../src/ui/ProfileHeader";
import SectionCard from "../../../src/ui/SectionCard";
import SettingsButtonOverlay, {
  SETTINGS_OVERLAY_HEIGHT,
} from "../../../src/ui/SettingsButtonOverlay";
import { useTabBarPadding } from "../../../src/ui/tabBarInset";

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [busy, setBusy] = useState(true);
  const [data, setData] = useState<ProductEval | null>(null);
  const bottomPad = useTabBarPadding(spacing.lg);
  const insets = useSafeAreaInsets();
  const overlayTop = Math.max(insets.top + spacing.sm, spacing.lg);
  const contentTop = overlayTop + SETTINGS_OVERLAY_HEIGHT + spacing.lg;

  const renderSettingsButton = () => (
    <SettingsButtonOverlay onPress={() => router.push("/(tabs)/profile")} offset={spacing.sm} />
  );

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
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {renderSettingsButton()}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
          <AppText type="p3" muted style={{ marginTop: 6 }}>
            Produktdaten werden geladen…
          </AppText>
        </View>
      </View>
    );
  }

  if (!data) return null;

  const statusColor = data.suitable ? colors.primary_700 : colors.secondary_700;
  const statusIcon = data.suitable ? "✅" : "⛔";
  const statusText = data.suitable ? "Geeignet" : "Nicht geeignet";
  const reasons = Array.isArray(data.reasons) ? data.reasons : [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {renderSettingsButton()}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: contentTop,
          gap: spacing.xl,
          paddingBottom: bottomPad,
        }}
      >
        <ProfileHeader
          title={data.productName || "Unbekanntes Produkt"}
          subtitle={data.brand || "Marke unbekannt"}
          icon="package"
        />

        <SectionCard
          title="Überblick"
          items={[
            { icon: "tag", label: "Marke", description: data.brand || "Keine Angabe" },
            {
              icon: "layers",
              label: "Kategorie",
              description: data.categoryPath?.join(" · ") || data.category || "Keine Angabe",
            },
          ]}
        />

        <View
          style={{
            backgroundColor: colors.primary_50,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: "hidden",
          }}
        >
          {data.imageUrl ? (
            <Image source={{ uri: data.imageUrl }} style={{ width: "100%", height: 220, resizeMode: "cover" }} />
          ) : (
            <View style={{ padding: spacing.xl, alignItems: "center" }}>
              <AppText type="p3" muted>Kein Bild verfügbar</AppText>
            </View>
          )}
        </View>

        <SectionCard
          title="Bewertung"
          items={[
            {
              content: (
                <View style={{ alignItems: "center", gap: spacing.sm }}>
                  <Text style={{ fontSize: 40 }}>{statusIcon}</Text>
                  <AppText type="h2" style={{ color: statusColor }}>
                    {statusText}
                  </AppText>
                </View>
              ),
            },
          ]}
        />

        <SectionCard
          title="Nährwerte je 100g"
          items={[
            {
              content: (
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
              ),
            },
          ]}
        />

        {reasons.length ? (
          <SectionCard
            title="Warum diese Bewertung?"
            items={reasons.map((reason) => ({ content: <AppText type="p3">• {reason}</AppText> }))}
          />
        ) : null}

        <SectionCard
          title="Details"
          items={[
            {
              content: (
                <AppText type="p3">
                  {data.description?.trim() || "Keine Beschreibung verfügbar. Daten stammen von OpenFoodFacts."}
                </AppText>
              ),
            },
          ]}
        />

        <SectionCard
          title="Zutaten"
          items={[
            {
              content: (
                <AppText type="p3">
                  {(() => {
                    const ing = getIngredientsTextFromData(data);
                    return ing || "Keine Zutatenliste verfügbar.";
                  })()}
                </AppText>
              ),
            },
          ]}
        />
      </ScrollView>
    </View>
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
