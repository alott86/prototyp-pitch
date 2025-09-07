// app/(tabs)/search.tsx
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { fetchProductByBarcode, ProductEval } from "../../src/logic";
import { colors, radius, spacing, typography } from "../../src/theme";
import AppButton from "../../src/ui/AppButton";
import AppText from "../../src/ui/AppText";

type Screen = "input" | "result";

export default function ManualSearchScreen() {
  const [barcode, setBarcode] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [screen, setScreen] = useState<Screen>("input");
  const [result, setResult] = useState<ProductEval | null>(null);

  async function onSubmit() {
    const value = barcode.trim();
    if (!value) {
      Alert.alert("Hinweis", "Bitte gib einen Barcode ein.");
      return;
    }

    setBusy(true);
    try {
      const r = await fetchProductByBarcode(value);
      if (!r?.success) {
        Alert.alert("Nicht gefunden", "Für diesen Barcode wurde kein Produkt gefunden.");
        return;
      }
      setResult(r);
      setScreen("result");
    } catch (err) {
      Alert.alert("Fehler", "Beim Abrufen der Produktdaten ist ein Fehler aufgetreten.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setResult(null);
    setScreen("input");
  }

  // ---------- Eingabe-Ansicht ----------
  if (screen === "input") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScrollView
          contentContainerStyle={{
            padding: spacing.lg,
            gap: spacing.lg,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <AppText type="h2" style={{ color: colors.text }}>
            Manuelle Produktsuche
          </AppText>
          <AppText type="p2" muted>
            Gib einen Barcode ein (z. B. EAN-13), um das Produkt wie beim Scan auszuwerten.
          </AppText>

          <View
            style={{
              backgroundColor: colors.primary_50,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.lg,
              gap: spacing.md,
            }}
          >
            <AppText type="p3" muted>
              Barcode
            </AppText>
            <TextInput
              value={barcode}
              onChangeText={setBarcode}
              placeholder="z. B. 4006381333931"
              inputMode="numeric"
              keyboardType="number-pad"
              returnKeyType="search"
              onSubmitEditing={onSubmit}
              style={{
                backgroundColor: "#fff",
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: spacing.md,
                paddingVertical: 12,
                fontSize: typography.p1.fontSize,
lineHeight: typography.p1.lineHeight,
                color: colors.text,
              }}
            />

            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <AppButton
                title={busy ? "Suchen…" : "Suchen"}
                onPress={onSubmit}
                disabled={busy}
              />
              <AppButton
                title="Leeren"
                onPress={() => setBarcode("")}
                variant="ghost"
              />
            </View>

            {busy && (
              <View style={{ alignItems: "center", marginTop: spacing.sm }}>
                <ActivityIndicator />
                <AppText type="p3" muted style={{ marginTop: 6 }}>
                  Produktdaten werden geladen…
                </AppText>
              </View>
            )}
          </View>

          <AppText type="p3" muted>
            Tipp: Du kannst hier jeden Barcode manuell prüfen – die Auswertung entspricht exakt der Scan-Auswertung.
          </AppText>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---------- Ergebnis-Ansicht (identisch zur Scanner-Auswertung) ----------
  if (!result) return null;

  const statusColor = result.suitable ? colors.primary_700 : colors.secondary_700;
  const statusIcon = result.suitable ? "✅" : "⛔";
  const statusText = result.suitable ? "Geeignet" : "Nicht geeignet";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        {/* Titelzeile: Produktname · Marke */}
        {(result.productName || result.brand) && (
          <AppText type="h3" style={{ color: colors.text }}>
            {result.productName || "Unbenannt"}{" "}
            {result.brand ? `· ${result.brand}` : ""}
          </AppText>
        )}

        {/* Kategorie */}
        {result.category && (
          <AppText type="p3" muted>
            Kategorie: {result.categoryPath?.join(" – ") || result.category}
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
          {result.imageUrl ? (
            <Image
              source={{ uri: result.imageUrl }}
              style={{ width: "100%", height: 260, resizeMode: "cover" }}
            />
          ) : (
            <View style={{ padding: spacing.xl, alignItems: "center" }}>
              <AppText type="p2" muted>
                Kein Bild verfügbar
              </AppText>
            </View>
          )}
        </View>

        {/* Nährwerte-Zeile */}
        <View
          style={{
            borderRadius: radius.lg,
            backgroundColor: "#FEECE9",
            borderWidth: 1,
            borderColor: colors.border,
            padding: spacing.lg,
            gap: spacing.md,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <NCell label="Kalorien" value={fmt(result.nutrition.kcal, "kcal")} />
            <NCell label="Fett" value={fmtOne(result.nutrition.fat, "g")} />
            <NCell label="Zucker" value={fmtOne(result.nutrition.sugars, "g")} />
            <NCell label="Salz" value={fmtOne(result.nutrition.salt, "g")} />
          </View>
        </View>

        {/* Geeignet / nicht geeignet */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            justifyContent: "center",
            marginTop: spacing.sm,
          }}
        >
          <Text style={{ fontSize: 28 }}>{statusIcon}</Text>
          <AppText type="h2" style={{ color: statusColor }}>
            {statusText}
          </AppText>
        </View>

        {/* WARUM */}
        <View style={{ gap: spacing.sm }}>
          <AppText type="h3">
            Warum {result.suitable ? "geeignet" : "nicht geeignet"}?
          </AppText>
          {result.reasons.map((r, i) => (
            <View key={i} style={{ flexDirection: "row", gap: spacing.sm }}>
              <Text>•</Text>
              <AppText style={{ flex: 1 }}>{r}</AppText>
            </View>
          ))}
        </View>

        {/* Details */}
        <View style={{ gap: spacing.sm }}>
          <AppText type="h3">Details</AppText>
          <AppText type="p2">
            {result.description?.trim() ||
              "Keine Beschreibung verfügbar. Daten stammen von OpenFoodFacts."}
          </AppText>
        </View>

        {/* Zutaten */}
        <View style={{ gap: spacing.sm }}>
          <AppText type="h3">Zutaten</AppText>
          {result.ingredientsText ? (
            <AppText type="p2">{result.ingredientsText}</AppText>
          ) : (
            <AppText type="p2" muted>
              Keine Zutatenliste verfügbar.
            </AppText>
          )}
          {result.sugarsFound.length > 0 && (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginTop: spacing.sm,
              }}
            >
              {result.sugarsFound.map((s) => (
                <View
                  key={s}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    backgroundColor: colors.secondary_50,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ fontSize: 12 }}>{s}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Aktionen */}
        <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.md, justifyContent: "center" }}>
          <AppButton title="Neuen Barcode prüfen" onPress={reset} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Helfer: Nährwert-Zelle */
function NCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ width: "24%" }}>
      <AppText type="p3" muted>
        {label}
      </AppText>
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