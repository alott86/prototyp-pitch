import {
  evaluateProduct,
  fetchProductByBarcode,
  ProductEval,
} from "@/src/logic";
import { colors, radius, spacing } from "@/src/theme";
import AppButton from "@/src/ui/AppButton";
import AppText from "@/src/ui/AppText";
import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  View,
} from "react-native";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ProductEval | null>(null);
  const lockRef = useRef(false);

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: spacing.xl,
          backgroundColor: colors.bg,
        }}
      >
        <AppText type="p2" style={{ marginBottom: spacing.md }}>
          Bitte Kamera-Zugriff erlauben.
        </AppText>
        <AppButton title="Erlauben" onPress={requestPermission} />
      </SafeAreaView>
    );
  }

  const onScan = async ({ data }: BarcodeScanningResult) => {
    if (lockRef.current || !data) return;
    lockRef.current = true;
    setBusy(true);
    try {
      const product = await fetchProductByBarcode(data);
      const evalResult = evaluateProduct(product);
      setResult(evalResult);
    } catch (e: any) {
      Alert.alert("Fehler", e?.message ?? "Unerwarteter Fehler beim Abrufen.");
      lockRef.current = false;
    } finally {
      setBusy(false);
    }
  };

  const resetScan = () => {
    setResult(null);
    lockRef.current = false;
  };

  if (result) {
    // ❗ robust gegen fehlende Felder
    const n = (result as any).nutrients ?? {};
    const fmt = (v?: number, unit = "") =>
      v === undefined ? "–" : `${Math.round(v)}${unit}`;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}
        >
          {/* Ergebnis-Header */}
          <View style={{ gap: spacing.xs }}>
            <AppText
              type="h2"
              style={{ color: result.ok ? colors.primary_800 : colors.secondary_800 }}
            >
              {result.ok ? "✅ Geeignet" : "⛔️ Nicht geeignet"}
            </AppText>
            <AppText type="p1b">{result.productName}</AppText>
            {result.category?.label ? (
              <AppText type="p3" muted>
                Kategorie: {result.category.label}
              </AppText>
            ) : null}
          </View>

          {/* Card */}
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: radius.lg,
              padding: spacing.xl,
              gap: spacing.lg,
              shadowColor: "#000",
              shadowOpacity: 0.06,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              elevation: 2,
            }}
          >
            {/* Produktbild */}
            <View style={{ alignItems: "center" }}>
              {result.imageUrl ? (
                <Image
                  source={{ uri: result.imageUrl }}
                  style={{ width: 180, height: 180, borderRadius: radius.lg }}
                  resizeMode="contain"
                />
              ) : (
                <View
                  style={{
                    width: 180,
                    height: 120,
                    borderRadius: radius.lg,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.primary_50 ?? "#F4F9F3",
                  }}
                >
                  <AppText type="p3" muted>Kein Bild verfügbar</AppText>
                </View>
              )}
            </View>

            {/* Nährwerte-Zeile */}
            <View
              style={{
                backgroundColor: "#FFF5F3",
                borderRadius: radius.lg,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.lg,
                flexDirection: "row",
                justifyContent: "space-between",
                gap: spacing.md,
              }}
            >
              {[
                { label: "Calories", value: fmt(n.energyKcal100, " kcal") },
                { label: "Fat", value: fmt(n.fat100, "g") },
                { label: "Sugar", value: fmt(n.sugars100, "g") },
                { label: "Salt", value: fmt(n.salt100, "g") },
              ].map((it, idx) => (
                <View key={idx} style={{ alignItems: "center", flex: 1 }}>
                  <AppText type="p3" muted>{it.label}</AppText>
                  <AppText type="p1b" style={{ color: colors.secondary_700 }}>
                    {it.value}
                  </AppText>
                </View>
              ))}
            </View>

            {/* Details */}
            <View style={{ gap: spacing.xs }}>
              <AppText type="h4">Details</AppText>
              <AppText type="p2" muted>
                {result.description ??
                  "Keine Beschreibung verfügbar. Daten stammen von OpenFoodFacts."}
              </AppText>
            </View>

            {/* Zutaten */}
            <View style={{ gap: spacing.sm }}>
              <AppText type="h4">Ingredients</AppText>
              {result.ingredientsText ? (
                <AppText type="p2" muted>{result.ingredientsText}</AppText>
              ) : (
                <AppText type="p2" muted>Keine Zutatenliste verfügbar.</AppText>
              )}
            </View>

            {/* Aktion */}
            <View style={{ gap: spacing.md, alignItems: "center" }}>
              <AppButton title="Scan Again" onPress={resetScan} variant="ghost" />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Scanner-Ansicht
  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <CameraView
        style={{ flex: 1 }}
        mute
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_e", "upc_a", "qr"],
        }}
        onBarcodeScanned={onScan}
      />
      {busy && (
        <View
          style={{
            position: "absolute",
            bottom: 24,
            left: 0,
            right: 0,
            alignItems: "center",
            gap: 8,
          }}
        >
          <ActivityIndicator />
          <AppText type="p3" style={{ color: "#fff" }}>
            Produktdaten werden geladen…
          </AppText>
        </View>
      )}
    </View>
  );
}