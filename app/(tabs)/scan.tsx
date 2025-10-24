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
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { addRecent } from "../../src/history";
import {
  AGE_GROUPS,
  DEFAULT_AGE_GROUP,
  AgeGroupKey,
  fetchProductByBarcode,
  ProductEval,
} from "../../src/logic";
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
  // Kamera-Berechtigung
  const [permission, requestPermission] = useCameraPermissions();

  // UI-State
  const [busy, setBusy] = useState(false);
  const [screen, setScreen] = useState<Screen>("scan");
  const [result, setResult] = useState<ProductEval | null>(null);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeGroupKey>(DEFAULT_AGE_GROUP);

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
      setSelectedAgeGroup(DEFAULT_AGE_GROUP);

      return () => {
        setCameraOn(false);
        lockRef.current = false;
        setBusy(false);
        setTorchOn(false);
      };
    }, [])
  );

  useEffect(() => {
    if (result?.defaultAgeGroup) {
      setSelectedAgeGroup(result.defaultAgeGroup);
    } else if (!result) {
      setSelectedAgeGroup(DEFAULT_AGE_GROUP);
    }
  }, [result]);

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

  // Ergebnis-Ansicht
  if (!result) return null;

  const fallbackEval =
    result.ageEvaluations[result.defaultAgeGroup] ?? result.ageEvaluations[DEFAULT_AGE_GROUP];
  const activeEval =
    result.ageEvaluations[selectedAgeGroup] ?? fallbackEval ?? result.ageEvaluations[DEFAULT_AGE_GROUP];

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
          paddingTop: 0,
          paddingBottom: bottomPad,
          gap: spacing.xl,
        }}
        contentInsetAdjustmentBehavior="never"
      >
        <View style={{ gap: spacing.xs, paddingTop: LOGO_TOP_MARGIN }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: spacing.sm,
              marginTop: BUTTON_TOP_ADJUST,
            }}
          >
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
                width: 40,
                height: 40,
                borderRadius: radius.pill,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="x" size={24} color={colors.text} />
            </TouchableOpacity>
            <SettingsButton onPress={() => router.push("/(tabs)/profile")} />
          </View>

          <View pointerEvents="none" style={{ alignItems: "center" }}>
            <Image
              source={NUMUM_LOGO}
              style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
              resizeMode="contain"
            />
          </View>
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

        {/* Aktionen entfernt auf Wunsch */}
      </ScrollView>
    </View>
  );
}

/* ===== Helpers & UI ===== */

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
