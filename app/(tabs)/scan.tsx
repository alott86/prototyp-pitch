// app/(tabs)/scan.tsx
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, View, TouchableOpacity, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { addRecent } from "../../src/history";
import { fetchProductByBarcode, ProductEval } from "../../src/logic";
import { colors, radius, spacing } from "../../src/theme";
import AppButton from "../../src/ui/AppButton";
import AppText from "../../src/ui/AppText";
import ProfileHeader from "../../src/ui/ProfileHeader";
import SectionCard from "../../src/ui/SectionCard";
import SettingsButton from "../../src/ui/SettingsButton";
import { useTabBarPadding } from "../../src/ui/tabBarInset";

const NUMUM_LOGO = require("../../assets/images/NuMum_Logo Kopie.png");
const LOGO_SIZE = 120;
const LOGO_TOP_MARGIN = spacing.lg;
const BUTTON_TOP_MARGIN = LOGO_TOP_MARGIN + spacing.xs;
const BUTTON_TOP_ADJUST = BUTTON_TOP_MARGIN - LOGO_TOP_MARGIN;

type Screen = "scan" | "result";

export default function ScanScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // Kamera-Berechtigung
  const [permission, requestPermission] = useCameraPermissions();

  // UI-State
  const [busy, setBusy] = useState(false);
  const [screen, setScreen] = useState<Screen>("scan");
  const [result, setResult] = useState<ProductEval | null>(null);
  // Kamera steuern
  const [cameraOn, setCameraOn] = useState(true);
  const [torchOn, setTorchOn] = useState(false);

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
      setTorchOn(false);
      lockRef.current = false;

      return () => {
        setCameraOn(false);
        lockRef.current = false;
        setBusy(false);
        setTorchOn(false);
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
    // Kamera weiter anzeigen, aber Ergebnis als Overlay zeigen

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
        suitable: candidate!.suitable ?? null,
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

  const topControls = (withTorch: boolean) => (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: BUTTON_TOP_MARGIN,
        paddingHorizontal: spacing.lg,
      }}
    >
      {withTorch ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={torchOn ? "Taschenlampe ausschalten" : "Taschenlampe einschalten"}
          onPress={() => setTorchOn((prev) => !prev)}
          style={{
            width: 40,
            height: 40,
            borderRadius: radius.pill,
            backgroundColor: torchOn ? colors.primary : "rgba(0,0,0,0.4)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name="zap" size={20} color="#fff" />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 40, height: 40 }} />
      )}
      <SettingsButton onPress={() => router.push("/(tabs)/profile")} />
    </View>
  );

  // Keine Kamera-Erlaubnis
  if (!permission?.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {topControls(false)}
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
        {topControls(true)}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            alignItems: "center",
            zIndex: 25,
            paddingTop: LOGO_TOP_MARGIN,
          }}
        >
          <Image
            source={NUMUM_LOGO}
            style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
            resizeMode="contain"
          />
        </View>
        {cameraOn && (
          <CameraView
            style={{ flex: 1 }}
            barcodeScannerSettings={{
              barcodeTypes: ["ean13", "ean8", "upc_e", "upc_a", "qr"],
            }}
            enableTorch={torchOn}
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

  // Ergebnis-Ansicht (als Overlay über der Kamera)
  if (!result) {
    return null;
  }

  const statusColor = result.suitable ? colors.primary_700 : colors.secondary_700;
  const statusText = result.suitable ? "Geeignet" : "Nicht geeignet";
  const statusBg = result.suitable ? colors.primary_100 : colors.secondary_100;
  const statusIcon: React.ComponentProps<typeof Feather>["name"] = result.suitable ? "check-circle" : "x-circle";
  const reasons = result.reasons ?? [];

  // Mindestgröße, damit die Eignung immer sichtbar werden kann
  const overlayTop = Math.max(insets.top + spacing.md, spacing.lg);
  const available = Math.max(0, height - overlayTop - bottomPad);
  const overlayMinHeight = 480; // genug Platz für Logo + Header + Bewertung
  const overlayHeight = Math.max(overlayMinHeight, available);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Kamera im Hintergrund sichtbar lassen, aber ohne Scan-Callback */}
      {permission?.granted ? (
        <CameraView style={{ flex: 1 }} enableTorch={false} />
      ) : (
        <View style={{ flex: 1, backgroundColor: "#000" }} />
      )}

      {/* Overlay-Card über dem Scanner */}
      <View
        style={{
          position: "absolute",
          left: spacing.lg,
          right: spacing.lg,
          top: overlayTop,
          height: overlayHeight,
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
        {/* Close button (kein Einstellungs-Button auf dem Overlay) */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Auswertung schließen"
          onPress={() => {
            setResult(null);
            setScreen("scan");
            setCameraOn(true);
            setTorchOn(false);
            setBusy(false);
            lockRef.current = false;
          }}
          hitSlop={8}
          style={{
            position: "absolute",
            top: spacing.md,
            right: spacing.md,
            zIndex: 10,
            width: 36,
            height: 36,
            borderRadius: radius.pill,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name="x" size={24} color={colors.text} />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingTop: LOGO_TOP_MARGIN,
            paddingBottom: spacing.lg,
            gap: spacing.xl,
          }}
          contentInsetAdjustmentBehavior="never"
        >
          <View pointerEvents="none" style={{ alignItems: "center" }}>
            <Image source={NUMUM_LOGO} style={{ width: LOGO_SIZE, height: LOGO_SIZE }} resizeMode="contain" />
          </View>

          <ProfileHeader
            title={result.productName || "Unbekanntes Produkt"}
            subtitle={result.brand || "Marke unbekannt"}
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
            {result.imageUrl ? (
              <Image source={{ uri: result.imageUrl }} style={{ width: "100%", height: 220 }} resizeMode="contain" />
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
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: radius.pill,
                        backgroundColor: statusBg,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
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

          {!result.suitable && reasons.length ? (
            <SectionCard
              title="Warum diese Bewertung?"
              items={reasons.map((reason, idx) => ({
                content: renderWhyBlock(reason, result.productName ?? null),
              }))}
            />
          ) : null}

          <SectionCard
            title="Nährwerte je 100g"
            items={[
              {
                content: <NutritionRow items={buildNutritionItems(result.nutrition)} />,
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
        </ScrollView>
      </View>
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
  // Body ohne erste Zeile
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
