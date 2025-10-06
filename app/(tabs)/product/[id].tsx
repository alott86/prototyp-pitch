// app/(tabs)/product/[id].tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AGE_GROUPS,
  DEFAULT_AGE_GROUP,
  AgeGroupKey,
  fetchProductByBarcode,
  ProductEval,
} from "../../../src/logic";
import { colors, radius, spacing } from "../../../src/theme";
import AppText from "../../../src/ui/AppText";
import ProfileHeader from "../../../src/ui/ProfileHeader";
import SectionCard from "../../../src/ui/SectionCard";
import SettingsButton from "../../../src/ui/SettingsButton";
import { useTabBarPadding } from "../../../src/ui/tabBarInset";

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id, source } = useLocalSearchParams<{ id: string; source?: string }>();
  const [busy, setBusy] = useState(true);
  const [data, setData] = useState<ProductEval | null>(null);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeGroupKey>(DEFAULT_AGE_GROUP);
  const bottomPad = useTabBarPadding(spacing.lg);
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top + spacing.xs, spacing.md);

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

  useEffect(() => {
    if (data?.defaultAgeGroup) {
      setSelectedAgeGroup(data.defaultAgeGroup);
    } else if (!data) {
      setSelectedAgeGroup(DEFAULT_AGE_GROUP);
    }
  }, [data]);

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

  const fallbackEval =
    data.ageEvaluations[data.defaultAgeGroup] ?? data.ageEvaluations[DEFAULT_AGE_GROUP];
  const activeEval =
    data.ageEvaluations[selectedAgeGroup] ?? fallbackEval ?? data.ageEvaluations[DEFAULT_AGE_GROUP];

  const statusColor = activeEval?.suitable ? colors.primary_700 : colors.secondary_700;
  const statusText = activeEval?.suitable ? "Geeignet" : "Nicht geeignet";
  const statusBg = activeEval?.suitable ? colors.primary_100 : colors.secondary_100;
  const statusIcon: React.ComponentProps<typeof Feather>["name"] =
    activeEval?.suitable === false ? "x-circle" : activeEval?.suitable === true ? "check-circle" : "help-circle";
  const reasons = activeEval?.reasons ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: topPadding,
          gap: spacing.xl,
          paddingBottom: bottomPad,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: spacing.sm,
          }}
        >
          <SettingsButton onPress={() => router.push("/(tabs)/profile")} />

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
            style={{
              width: 40,
              height: 40,
              borderRadius: radius.pill,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="x" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ProfileHeader
          title={data.productName || "Unbekanntes Produkt"}
          subtitle={data.brand || "Marke unbekannt"}
          icon="package"
          showAvatar={false}
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

        <AgeGroupSegment value={selectedAgeGroup} onChange={setSelectedAgeGroup} />

        <SectionCard
          title="Bewertung"
          items={[
            {
              content: (
                <View style={{ alignItems: "center", gap: spacing.sm }}>
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: radius.pill,
                      backgroundColor: statusBg,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name={statusIcon} size={28} color={statusColor} />
                  </View>
                  <AppText type="h2" style={{ color: statusColor }}>
                    {statusText}
                  </AppText>
                </View>
              ),
            },
          ]}
        />

        {activeEval?.suitable === false && reasons.length ? (
          <SectionCard
            title="Warum diese Bewertung?"
            items={reasons.map((reason) => ({ content: <AppText type="p3">• {reason}</AppText> }))}
          />
        ) : null}

        <SectionCard
          title="Nährwerte je 100g"
          items={[
            {
              content: <NutritionRow items={buildNutritionItems(data.nutrition)} />,
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

type AgeGroupSegmentProps = {
  value: AgeGroupKey;
  onChange: (next: AgeGroupKey) => void;
};

function AgeGroupSegment({ value, onChange }: AgeGroupSegmentProps) {
  const options = Object.entries(AGE_GROUPS) as Array<[AgeGroupKey, { label: string }]>;

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.primary_50,
        borderRadius: radius.pill,
        padding: 4,
        alignSelf: "stretch",
      }}
    >
      {options.map(([key, meta]) => {
        const isActive = key === value;
        return (
          <TouchableOpacity
            key={key}
            accessibilityRole="button"
            accessibilityLabel={`Bewertung für ${meta.label}`}
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(key)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: radius.pill,
              backgroundColor: isActive ? colors.primary : "transparent",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppText
              type="p3"
              style={{
                color: isActive ? "#fff" : colors.textMuted,
                fontWeight: "600",
              }}
            >
              {meta.label}
            </AppText>
          </TouchableOpacity>
        );
      })}
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
  const sugar = nutrition.sugars;
  const salt = nutrition.salt;

  const sugarTone: NutritionTone =
    typeof sugar === "number"
      ? sugar > 15
        ? "warn"
        : sugar <= 5
        ? "good"
        : "neutral"
      : "neutral";

  const saltTone: NutritionTone =
    typeof salt === "number" ? (salt > 1.2 ? "warn" : "good") : "neutral";

  return [
    { label: "Kalorien", value: fmt(nutrition.kcal, "kcal"), tone: "neutral" },
    { label: "Fett", value: fmtOne(nutrition.fat, "g"), tone: "neutral" },
    { label: "Zucker", value: fmtOne(nutrition.sugars, "g"), tone: sugarTone },
    { label: "Salz", value: fmtOne(nutrition.salt, "g"), tone: saltTone },
  ];
}
