// app/(tabs)/scan.tsx
import { useFocusEffect } from "@react-navigation/native";
import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";

import { addRecent } from "../../src/history";
import { fetchProductByBarcode, ProductEval } from "../../src/logic";
import { colors, radius, spacing, typography } from "../../src/theme";
import AppButton from "../../src/ui/AppButton";
import AppText from "../../src/ui/AppText";

type Screen = "scan" | "result";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [screen, setScreen] = useState<Screen>("scan");
  const [result, setResult] = useState<ProductEval | null>(null);

  const lockRef = useRef(false);
  const lastScanTsRef = useRef<number>(0);
  const lastCodeRef = useRef<string | null>(null);

  useEffect(() => {
    if (permission && !permission.granted) requestPermission();
  }, [permission]);

  // Beim (Wieder-)Fokussieren des Tabs: immer auf Scanner zurücksetzen
  useFocusEffect(
    useCallback(() => {
      setResult(null);
      setScreen("scan");
      setBusy(false);
      lockRef.current = false;

      return () => {
        lockRef.current = false;
        setBusy(false);
      };
    }, [])
  );

  function resetScan() {
    setResult(null);
    setScreen("scan");
    lockRef.current = false;
    setBusy(false);
  }

  async function onScan(e: BarcodeScanningResult) {
    if (busy || lockRef.current) return;
    const code = e.data?.trim();
    if (!code) return;

    const now = Date.now();
    if (code === lastCodeRef.current && now - lastScanTsRef.current < 2000) return;
    lastCodeRef.current = code;
    lastScanTsRef.current = now;

    lockRef.current = true;
    setBusy(true);

    let ok = false;
    try {
      const evalData = await fetchProductByBarcode(code);

      if (!evalData) {
        Alert.alert("Nicht gefunden", "Für diesen Barcode wurden keine Produktdaten gefunden.", [
          { text: "OK", onPress: () => resetScan() },
        ]);
        return;
      }

      await addRecent({
        id: code,
        name: evalData.productName ?? "Unbenannt",
        brand: evalData.brand ?? null,
        imageUrl: evalData.imageUrl ?? null,
      });

      setResult(evalData);
      setScreen("result");
      ok = true;
    } catch (err: any) {
      console.warn("SCAN ERROR:", err);
      Alert.alert(
        "Fehler",
        `Beim Abrufen der Produktdaten ist ein Fehler aufgetreten.\n\n${String(
          err?.message || err
        )}`,
        [{ text: "OK", onPress: () => resetScan() }]
      );
    } finally {
      if (!ok) {
        setBusy(false);
        lockRef.current = false;
      }
    }
  }

  if (!permission?.granted) {
    return (
      <SafeAreaView
        style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg }}
      >
        <AppText type="p2" style={{ textAlign: "center" }}>
          Bitte Kamerazugriff erlauben, um Barcodes scannen zu können.
        </AppText>
        <View style={{ height: spacing.md }} />
        <AppButton title="Zugriff erlauben" onPress={() => requestPermission()} />
      </SafeAreaView>
    );
  }

  if (screen === "scan") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <CameraView
          style={{ flex: 1 }}
          barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_e", "upc_a", "qr"] }}
          onBarcodeScanned={onScan}
        />
        {busy && (
          <View style={{ position: "absolute", bottom: 24, left: 0, right: 0, alignItems: "center" }}>
            <ActivityIndicator />
            <AppText type="p3" muted style={{ marginTop: 6 }}>
              Produktdaten werden geladen…
            </AppText>
          </View>
        )}
      </SafeAreaView>
    );
  }

  if (!result) return null;

  const statusColor = result.suitable ? colors.primary_700 : colors.secondary_700;
  const statusIcon = result.suitable ? "✅" : "⛔";
  const statusText = result.suitable ? "Geeignet" : "Nicht geeignet";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        {(result.productName || result.brand) && (
          <AppText type="h3" style={{ color: colors.text }}>
            {result.productName || "Unbenannt"} {result.brand ? `· ${result.brand}` : ""}
          </AppText>
        )}

        {result.category && (
          <AppText type="p3" muted>
            Kategorie: {result.categoryPath?.join(" – ") || result.category}
          </AppText>
        )}

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
              <AppText type="p2" muted>Kein Bild verfügbar</AppText>
            </View>
          )}
        </View>

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

        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, justifyContent: "center", marginTop: spacing.sm }}>
          <Text style={{ fontSize: 28 }}>{statusIcon}</Text>
          <AppText type="h2" style={{ color: statusColor }}>{statusText}</AppText>
        </View>

        <View style={{ gap: spacing.sm }}>
          <AppText type="h3">Warum {result.suitable ? "geeignet" : "nicht geeignet"}?</AppText>
          {result.reasons.map((r, i) => (
            <View key={i} style={{ flexDirection: "row", gap: spacing.sm }}>
              <Text>•</Text>
              <AppText style={{ flex: 1 }}>{r}</AppText>
            </View>
          ))}
        </View>

        <View style={{ gap: spacing.sm }}>
          <AppText type="h3">Details</AppText>
          <AppText type="p2">
            {result.description?.trim() || "Keine Beschreibung verfügbar. Daten stammen von OpenFoodFacts."}
          </AppText>
        </View>

        <View style={{ gap: spacing.sm }}>
          <AppText type="h3">Zutaten</AppText>
          {result.ingredientsText ? (
            <AppText type="p2">{result.ingredientsText}</AppText>
          ) : (
            <AppText type="p2" muted>Keine Zutatenliste verfügbar.</AppText>
          )}
          {result.sugarsFound.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: spacing.sm }}>
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

        <View style={{ alignItems: "center", marginTop: spacing.md }}>
          <AppButton title="Erneut scannen" onPress={resetScan} variant="ghost" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Helfer: Nährwert-Zelle */
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