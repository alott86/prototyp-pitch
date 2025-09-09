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
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { addRecent } from "../../src/history";
import { fetchProductByBarcode, ProductEval } from "../../src/logic";
import { colors, radius, spacing } from "../../src/theme";
import AppButton from "../../src/ui/AppButton";
import AppText from "../../src/ui/AppText";
import { useTabBarPadding } from "../../src/ui/tabBarInset";

type Screen = "scan" | "result";

export default function ScanScreen() {
  // Kamera-Berechtigung
  const [permission, requestPermission] = useCameraPermissions();

  // UI-State
  const [busy, setBusy] = useState(false);
  const [screen, setScreen] = useState<Screen>("scan");
  const [result, setResult] = useState<ProductEval | null>(null);

  // Kamera steuern
  const [cameraOn, setCameraOn] = useState(true);

  // Abstand unten, damit die Tab-Bar nichts verdeckt
  const bottomPad = useTabBarPadding(spacing.lg);

  // Guards gegen Doppelscan
  const lockRef = useRef(false);
  const lastScanTsRef = useRef<number>(0);
  const lastCodeRef = useRef<string | null>(null);

  // Berechtigung nachfragen
  useEffect(() => {
    if (permission && !permission.granted) requestPermission();
  }, [permission]);

  // Bei Tab-Fokus immer in den Scan-Modus zurück
  useFocusEffect(
    useCallback(() => {
      setResult(null);
      setScreen("scan");
      setBusy(false);
      setCameraOn(true);
      lockRef.current = false;

      return () => {
        setCameraOn(false);
        lockRef.current = false;
        setBusy(false);
      };
    }, [])
  );

  async function onScan(e: BarcodeScanningResult) {
    if (busy || lockRef.current) return;

    const code = e.data?.trim();
    if (!code) return;

    // Doppelscan 2s blocken
    const now = Date.now();
    if (code === lastCodeRef.current && now - lastScanTsRef.current < 2000) return;
    lastCodeRef.current = code;
    lastScanTsRef.current = now;

    lockRef.current = true;
    setBusy(true);
    setCameraOn(false); // Kamera sofort stoppen

    try {
      const r = (await fetchProductByBarcode(code)) as any;

      // Kandidat vereinheitlichen: direkt ProductEval ODER aus { success, product }
      const candidate: ProductEval | undefined =
        r && ("product" in r ? (r.product as ProductEval) : (r as ProductEval));

      // Erfolg nur, wenn Call ok UND Kandidat vorhanden
      const isOk: boolean =
        !!r && (("success" in r ? r.success : true) === true) && !!candidate;

      if (!isOk) {
        Alert.alert(
          "Nicht gefunden",
          "Für diesen Barcode wurden keine Produktdaten gefunden.",
          [
            {
              text: "OK",
              onPress: () => {
                setScreen("scan");
                setCameraOn(true);
                setBusy(false);
                lockRef.current = false;
              },
            },
          ]
        );
        return;
      }

      // Verlauf aktualisieren
      await addRecent({
        id: code,
        name: candidate!.productName ?? "Unbenannt",
        brand: candidate!.brand ?? null,
        imageUrl: candidate!.imageUrl ?? null,
      });

      // Ergebnis anzeigen
      setResult(candidate!);
      setScreen("result"); // Kamera bleibt aus
    } catch {
      Alert.alert("Fehler", "Beim Abrufen der Produktdaten ist ein Fehler aufgetreten.", [
        {
          text: "OK",
          onPress: () => {
            setScreen("scan");
            setCameraOn(true);
            setBusy(false);
            lockRef.current = false;
          },
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  // Keine Kamera-Erlaubnis
  if (!permission?.granted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg }}>
          <AppText type="p2" style={{ textAlign: "center" }}>
            Bitte Kamerazugriff erlauben, um Barcodes scannen zu können.
          </AppText>
        </View>
        <View style={{ alignItems: "center", paddingBottom: bottomPad }}>
          <AppButton title="Zugriff erlauben" onPress={() => requestPermission()} />
        </View>
      </SafeAreaView>
    );
  }

  // Scan-Ansicht
  if (screen === "scan") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
        {cameraOn && (
          <CameraView
            style={{ flex: 1 }}
            barcodeScannerSettings={{
              barcodeTypes: ["ean13", "ean8", "upc_e", "upc_a", "qr"],
            }}
            onBarcodeScanned={onScan}
          />
        )}

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

  // Ergebnis-Ansicht
  if (!result) return null;

  const statusColor = result.suitable ? colors.primary_700 : colors.secondary_700;
  const statusIcon = result.suitable ? "✅" : "⛔";
  const statusText = result.suitable ? "Geeignet" : "Nicht geeignet";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{
          padding: spacing.lg,
          gap: spacing.lg,
          paddingBottom: bottomPad,
        }}
      >
        {/* Produktname (h2) + Marke (p2) */}
        {(result.productName || result.brand) && (
          <View style={{ gap: 4 }}>
            {result.productName ? <AppText type="h2">{result.productName}</AppText> : null}
            {result.brand ? <AppText type="p2">{result.brand}</AppText> : null}
          </View>
        )}

        {/* Kategorie (optional) */}
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
            <Image source={{ uri: result.imageUrl }} style={{ width: "100%", height: 260, resizeMode: "cover" }} />
          ) : (
            <View style={{ padding: spacing.xl, alignItems: "center" }}>
              <AppText type="p2" muted>Kein Bild verfügbar</AppText>
            </View>
          )}
        </View>

        {/* Nährwerte – Box-Design (#FFFAF0 / #FF8473) */}
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
            <NutriCell label="Kalorien" value={fmt(result.nutrition.kcal, "kcal")} />
            <NutriCell label="Fett" value={fmtOne(result.nutrition.fat, "g")} />
            <NutriCell label="Zucker" value={fmtOne(result.nutrition.sugars, "g")} />
            <NutriCell label="Salz" value={fmtOne(result.nutrition.salt, "g")} />
          </View>
        </View>

        {/* Status */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, justifyContent: "center", marginTop: spacing.sm }}>
          <Text style={{ fontSize: 28 }}>{statusIcon}</Text>
          <AppText type="h2" style={{ color: statusColor }}>{statusText}</AppText>
        </View>

        {/* Warum */}
        <View style={{ gap: spacing.xs }}>
          <AppText type="h4">Warum {result.suitable ? "geeignet" : "nicht geeignet"}?</AppText>
          {result.reasons.map((r, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 8 }}>
              <Text>•</Text>
              <AppText type="p3" style={{ flex: 1 }}>{r}</AppText>
            </View>
          ))}
        </View>

        {/* Details */}
        <View style={{ gap: spacing.xs }}>
          <AppText type="h4">Details</AppText>
          <AppText type="p3">
            {result.description?.trim() || "Keine Beschreibung verfügbar. Daten stammen von OpenFoodFacts."}
          </AppText>
        </View>

        {/* Zutaten (robust, deutsch bevorzugt) */}
        <View style={{ gap: spacing.xs }}>
          <AppText type="h4">Zutaten</AppText>
          {(() => {
            const ing = getIngredientsTextFromResult(result);
            if (ing) return <AppText type="p3">{ing}</AppText>;
            return <AppText type="p3">Keine Zutatenliste verfügbar.</AppText>;
          })()}
        </View>

        <View style={{ height: bottomPad }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ===== Helpers & UI ===== */

function fmt(v?: number, unit?: string): string {
  if (typeof v !== "number" || !Number.isFinite(v)) return "–";
  const n = Math.round(v);
  return unit ? `${n} ${unit}` : String(n);
}
function fmtOne(v?: number, unit?: string): string {
  if (typeof v !== "number" || !Number.isFinite(v)) return "–";
  const n = v.toFixed(1).replace(".", ",");
  return unit ? `${n} ${unit}` : n;
}

function getIngredientsTextFromResult(x: any): string | null {
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

function NutriCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <AppText type="p3" style={{ color: "#FF8473", marginBottom: 4 }}>
        {label}
      </AppText>
      <AppText style={{ fontSize: 18, fontWeight: "600", color: "#FF8473" }}>
        {value}
      </AppText>
    </View>
  );
}