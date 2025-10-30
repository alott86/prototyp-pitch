// app/(tabs)/product/[id].tsx
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fetchProductByBarcode, ProductEval } from "../../../src/logic";
import { colors, radius, spacing } from "../../../src/theme";
import AppText from "../../../src/ui/AppText";
import ProfileHeader from "../../../src/ui/ProfileHeader";
import SectionCard from "../../../src/ui/SectionCard";
// SettingsButton entfällt im Overlay-Design

export default function ProductDetailScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id, source } = useLocalSearchParams<{ id: string; source?: string }>();
  const [busy, setBusy] = useState(true);
  const [data, setData] = useState<ProductEval | null>(null);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const bottomPad = insets.bottom + spacing.lg;
  const overlayTop = Math.max(insets.top + spacing.md, spacing.lg);
  const overlayMinHeight = 480;
  const LOGO_TOP_MARGIN = spacing.lg;

  useEffect(() => {
    navigation.setParams({ hideTabBar: true });
    return () => {
      navigation.setParams({ hideTabBar: false });
    };
  }, [navigation]);

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
  const statusText = data.suitable ? "Geeignet" : "Nicht geeignet";
  const statusBg = data.suitable ? colors.primary_100 : colors.secondary_100;
  const statusIcon: React.ComponentProps<typeof Feather>["name"] = data.suitable ? "check-circle" : "x-circle";
  const reasons = data.reasons ?? [];
  const showImageBg = Boolean(data.imageUrl) && source !== "favorites"; // aus Verlauf immer hellgrün

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Dezenter Bild-Hintergrund im oberen Bereich für konsistente Optik */}
      {showImageBg ? (
        <Image
          source={{ uri: data.imageUrl }}
          style={{ position: "absolute", top: 0, left: 0, right: 0, height: 220, resizeMode: "cover", opacity: 0.8 }}
        />
      ) : (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 220, backgroundColor: colors.primary_50 }} />
      )}

      {/* Overlay-Karte wie im Scan-Ergebnis */}
      <View
        style={{
          position: "absolute",
          left: spacing.lg,
          right: spacing.lg,
          top: overlayTop,
          height: Math.max(overlayMinHeight, height - overlayTop - bottomPad),
          borderRadius: radius.xl,
          backgroundColor: colors.bg,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 10 },
          elevation: 8,
        }}
      >
        {/* Schließen rechts oben */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Auswertung schließen"
          onPress={() => {
            if (source === "favorites") {
              router.replace("/(tabs)/favorites");
              return;
            }
            router.back();
          }}
          hitSlop={8}
          style={{ position: "absolute", top: spacing.md, right: spacing.md, width: 36, height: 36, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", zIndex: 10 }}
        >
          <Feather name="x" size={24} color={colors.text} />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: LOGO_TOP_MARGIN, gap: spacing.xl, paddingBottom: bottomPad }}
          contentInsetAdjustmentBehavior="never"
        >
          <View style={{ alignItems: "center" }}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Zum Startbildschirm"
              activeOpacity={0.8}
              onPress={() => router.replace("/")}
            >
              <Image source={require("../../../assets/images/NuMum_Logo Kopie.png")} style={{ width: 120, height: 120 }} resizeMode="contain" />
            </TouchableOpacity>
          </View>

          <ProfileHeader title={data.productName || "Unbekanntes Produkt"} subtitle={data.brand || "Marke unbekannt"} icon="package" showAvatar={false} />

          <View style={{ backgroundColor: colors.primary_50, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
            {data.imageUrl ? (
              <Image source={{ uri: data.imageUrl }} style={{ width: "100%", height: 220 }} resizeMode="contain" />
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
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm }}>
                    <View style={{ width: 32, height: 32, borderRadius: radius.pill, backgroundColor: statusBg, alignItems: "center", justifyContent: "center" }}>
                      <Feather name={statusIcon} size={18} color={statusColor} />
                    </View>
                    <AppText type="h2" style={{ color: statusColor }}>
                      {statusText}
                    </AppText>
                  </View>
                ),
              },
            ]}
          />

          {!data.suitable && reasons.length ? (
            <SectionCard
              title="Warum diese Bewertung?"
              items={reasons.map((reason, idx) => ({
                content: renderWhyBlock(reason, data.productName ?? null),
              }))}
            />
          ) : null}

          <SectionCard title="Nährwerte je 100g" items={[{ content: <NutritionRow items={buildNutritionItems(data.nutrition)} /> }]} />

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
  return normalizeIngredientsList(val);
}

function normalizeIngredientsList(raw?: string): string | null {
  if (typeof raw !== "string") return null;

  const unified = raw
    .replace(/[\r\n]+/g, ",")
    .replace(/[;•·:]/g, ",")
    .replace(/[(){}\[\]]/g, " ");

  const parts = unified
    .split(",")
    .map((part) =>
      part
        .replace(/[^0-9A-Za-zÄÖÜäöüß\s-]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean)
    .map((part) => {
      if (!part.length) return "";
      const head = part.charAt(0).toUpperCase();
      const tail = part.slice(1);
      return `${head}${tail}`;
    })
    .filter(Boolean);

  return parts.length ? parts.join(", ") : null;
}

type NutritionTone = "good" | "warn" | "neutral";

type NutritionRowItem = {
  label: string;
  value: string;
  tone: NutritionTone;
};

function NutritionRow({ items }: { items: NutritionRowItem[] }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.sm }}>
      {items.map((item) => {
        const color = item.tone === "warn" ? "#FF8473" : "#91C788";

        const label = item.label.charAt(0).toUpperCase() + item.label.slice(1);

        return (
          <View key={item.label} style={{ flex: 1, alignItems: "center", gap: spacing.xs }}>
            <AppText type="p3" style={{ color, fontWeight: "600", letterSpacing: 0.2 }}>
              {label}
            </AppText>
            <AppText type="p2" style={{ color }}>
              {item.value}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

function buildNutritionItems(nutrition: ProductEval["nutrition"]): NutritionRowItem[] {
  // Demo-Anpassung: immer grün darstellen, keine Warnfarbe mehr
  return [
    { label: "Kalorien", value: fmt(nutrition.kcal, "kcal"), tone: "good" },
    { label: "Fett", value: fmtOne(nutrition.fat, "g"), tone: "good" },
    { label: "Zucker", value: fmtOne(nutrition.sugars, "g"), tone: "good" },
    { label: "Salz", value: fmtOne(nutrition.salt, "g"), tone: "good" },
  ];
}

function renderWhyBlock(reason: string, fallbackName: string | null) {
  const raw = String(reason || "");
  const parts = raw.split(/\n+/);
  const nameLine = (parts[0] || fallbackName || "").trim();
  const body = parts.slice(1).join("\n").trim();
  const riskRe = /Listeriose(?:-Risikos|risikos|risiko)?/i;
  const m = body.match(riskRe);
  const risk = m ? m[0] : null;
  const idx = m?.index ?? -1;
  const before = idx >= 0 ? body.slice(0, idx).trimEnd() : body;
  const after = idx >= 0 ? body.slice(idx + (risk?.length ?? 0)).trimStart() : "";
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      {!!nameLine && (
        <AppText type="p3b" style={{ textAlign: "center" }}>
          {nameLine}
        </AppText>
      )}
      {before ? (
        <AppText type="p3" style={{ textAlign: "center" }}>
          {before}
        </AppText>
      ) : null}
      {risk ? (
        <AppText type="p3b" style={{ textAlign: "center", color: colors.secondary_600 }}>
          {risk}
        </AppText>
      ) : null}
      {after ? (
        <AppText type="p3" style={{ textAlign: "center" }}>
          {after}
        </AppText>
      ) : null}
    </View>
  );
}
