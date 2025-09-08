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
import { colors, radius, spacing, typography } from "../../src/theme";
import AppText from "../../src/ui/AppText";
import { useTabBarPadding } from "../../src/ui/tabBarInset";

type Screen = "scan" | "result";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  const [busy, setBusy] = useState(false);
  const [screen, setScreen] = useState<Screen>("scan");
  const [result, setResult] = useState<ProductEval | null>(null);

  // NEU: Kamera explizit steuern
  const [cameraOn, setCameraOn] = useState(true);

  const bottomPad = useTabBarPadding(spacing.lg);

  const lockRef = useRef(false);
  const lastScanTsRef = useRef<number>(0);
  const lastCodeRef = useRef<string | null>(null);

  useEffect(() => {
    if (permission && !permission.granted) requestPermission();
  }, [permission]);

  // Beim (Wieder-)Fokussieren des Tabs zurück in den Scan-Modus
  useFocusEffect(
    useCallback(() => {
      setResult(null);
      setScreen("scan");
      setBusy(false);
      setCameraOn(true);        // << Kamera wieder aktivieren
      lockRef.current = false;

      return () => {
        // Beim Verlassen des Tabs Kamera sicher deaktivieren
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

    // Doppelscan-Guard
    const now = Date.now();
    if (code === lastCodeRef.current && now - lastScanTsRef.current < 2000) return;
    lastCodeRef.current = code;
    lastScanTsRef.current = now;

    lockRef.current = true;
    setBusy(true);

    // *** WICHTIG: Kamera sofort ausschalten, damit sie garantiert stoppt ***
    setCameraOn(false);

    let ok = false;
    try {
      const evalData = await fetchProductByBarcode(code);
      if (!evalData) {
        Alert.alert("Nicht gefunden", "Für diesen Barcode wurden keine Produktdaten gefunden.", [
          { text: "OK", onPress: () => {
              // zurück in Scan-Modus, Kamera wieder an
              setScreen("scan");
              setCameraOn(true);
              setBusy(false);
              lockRef.current = false;
            } },
        ]);
        return;
      }

      // Verlauf aktualisieren
      await addRecent({
        id: code,
        name: evalData.productName ?? "Unbenannt",
        brand: evalData.brand ?? null,
        imageUrl: evalData.imageUrl ?? null,
      });

      setResult(evalData);
      setScreen("result"); // Kamera bleibt aus
      ok = true;
    } catch {
      Alert.alert("Fehler", "Beim Abrufen der Produktdaten ist ein Fehler aufgetreten.", [
        { text: "OK", onPress: () => {
            // bei Fehler zurück in Scan-Modus und Kamera wieder an
            setScreen("scan");
            setCameraOn(true);
            setBusy(false);
            lockRef.current = false;
          } },
      ]);
    } finally {
      if (!ok) {
        // falls kein Erfolg, Busy im OK-Handler oben zurückgesetzt
      } else {
        setBusy(false); // Ergebnis wird angezeigt, Kamera bleibt AUS
      }
    }
  }

  // Kameraerlaubnis
  if (!permission?.granted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg }}>
          <AppText type="p2" style={{ textAlign: "center" }}>
            Bitte Kamerazugriff erlauben, um Barcodes scannen zu können.
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  // Scan-Modus
  if (screen === "scan") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
        {/* CameraView wird NUR gerendert, wenn cameraOn == true */}
        {cameraOn && (
          <CameraView
            style={{ flex: 1 }}
            barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_e", "upc_a", "qr"] }}
            onBarcodeScanned={onScan}
          />
        )}

        {busy && (
          <View
            style={{
              position: "absolute",
              bottom: 24,
              left: 0,
              right: 0,
              alignItems: "center",
            }}
          >
            <ActivityIndicator />
            <AppText type="p3" muted style={{ marginTop: 6 }}>
              Produktdaten werden geladen…
            </AppText>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // Ergebnis-Modus (Kamera ist AUS)
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
            <Image source={{ uri: result.imageUrl }} style={{ width: "100%", height: 260, resizeMode: "cover" }} />
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
            {result.description?.trim() ||
              "Keine Beschreibung verfügbar. Daten stammen von OpenFoodFacts."}
          </AppText>
        </View>

        {/* zusätzlicher Spacer, damit nichts unter der Tab-Bar verschwindet */}
        <View style={{ height: bottomPad }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/** Helfer-Komponenten & Formatter */
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