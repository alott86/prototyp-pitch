// app/(tabs)/scan.tsx
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
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

import { addRecent } from "../../src/history";
import { fetchProductByBarcode, ProductEval } from "../../src/logic";
import { colors, radius, spacing } from "../../src/theme";
import AppButton from "../../src/ui/AppButton";
import AppText from "../../src/ui/AppText";
import ProfileHeader from "../../src/ui/ProfileHeader";
import SectionCard from "../../src/ui/SectionCard";
import SettingsButtonOverlay from "../../src/ui/SettingsButtonOverlay";
import { useTabBarPadding } from "../../src/ui/tabBarInset";

type Screen = "scan" | "result";

export default function ScanScreen() {
  const router = useRouter();
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

  const renderSettingsButton = () => (
    <SettingsButtonOverlay onPress={() => router.push("/(tabs)/profile")} />
  );

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
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {renderSettingsButton()}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg }}>
          <AppText type="p2" style={{ textAlign: "center" }}>
            Bitte Kamerazugriff erlauben, um Barcodes scannen zu können.
          </AppText>
        </View>
        <View style={{ alignItems: "center", paddingBottom: bottomPad }}>
          <AppButton title="Zugriff erlauben" onPress={() => requestPermission()} />
        </View>
      </View>
    );
  }

  // Scan-Ansicht
  if (screen === "scan") {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {renderSettingsButton()}
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
      </View>
    );
  }

  // Ergebnis-Ansicht
  if (!result) return null;

  const statusColor = result.suitable ? colors.primary_700 : colors.secondary_700;
  const statusIcon = result.suitable ? "✅" : "⛔";
  const statusText = result.suitable ? "Geeignet" : "Nicht geeignet";
  const reasons = Array.isArray(result.reasons) ? result.reasons : [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xl,
          paddingBottom: bottomPad,
          gap: spacing.xl,
        }}
      >
        <ProfileHeader
          title={result.productName || "Unbekanntes Produkt"}
          subtitle={result.brand || "Marke unbekannt"}
          icon="package"
        />

        <SectionCard
          title="Überblick"
          items={[
            {
              icon: "tag",
              label: "Kategorie",
              description: result.categoryPath?.join(" · ") || result.category || "Keine Angabe",
            },
            {
              icon: "clock",
              label: "Zuletzt gescannt",
              description: new Date().toLocaleDateString(),
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
          {result.imageUrl ? (
            <Image
              source={{ uri: result.imageUrl }}
              style={{ width: "100%", height: 220, resizeMode: "cover" }}
            />
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
                    <NutriCell label="Kalorien" value={fmt(result.nutrition.kcal, "kcal")} />
                    <NutriCell label="Fett" value={fmtOne(result.nutrition.fat, "g")} />
                    <NutriCell label="Zucker" value={fmtOne(result.nutrition.sugars, "g")} />
                    <NutriCell label="Salz" value={fmtOne(result.nutrition.salt, "g")} />
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
                  {result.description?.trim() || "Keine Beschreibung verfügbar. Daten stammen von OpenFoodFacts."}
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
                    const ing = getIngredientsTextFromResult(result);
                    return ing || "Keine Zutatenliste verfügbar.";
                  })()}
                </AppText>
              ),
            },
          ]}
        />

        <SectionCard
          title="Aktionen"
          items={[
            {
              content: (
                <View style={{ gap: spacing.sm }}>
                  <AppButton
                    title="Erneut scannen"
                    onPress={() => {
                      setScreen("scan");
                      setCameraOn(true);
                    }}
                  />
                  <AppButton
                    title="Details öffnen"
                    variant="ghost"
                    onPress={() => router.push(`/product/${encodeURIComponent(result.id ?? "")}`)}
                  />
                </View>
              ),
            },
          ]}
        />
      </ScrollView>
    </View>
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
