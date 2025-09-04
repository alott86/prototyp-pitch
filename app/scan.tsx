import { BarcodeScanningResult, CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, SafeAreaView, View } from "react-native";
import { evaluateProduct, fetchProductByBarcode, ProductEval } from "../src/logic";
import { colors, spacing } from "../src/theme";
import AppButton from "../src/ui/AppButton";
import AppText from "../src/ui/AppText";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ProductEval | null>(null);
  const lockRef = useRef(false);

  useEffect(() => { if (!permission) requestPermission(); }, [permission]);

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, backgroundColor: colors.bg }}>
        <AppText type="p2" style={{ marginBottom: spacing.md }}>Bitte Kamera-Zugriff erlauben.</AppText>
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
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    return (
      <SafeAreaView style={{ flex: 1, padding: spacing.xl, gap: spacing.sm, justifyContent: "center", backgroundColor: colors.bg }}>
        <AppText type="h2" style={{ color: result.ok ? colors.primary_800 : colors.secondary_800 }}>
          {result.ok ? "✅ Geeignet" : "⛔️ Nicht geeignet"}
        </AppText>

        <AppText type="p1b" style={{ marginTop: spacing.sm }}>{result.productName}</AppText>
        {result.category?.label ? <AppText type="p3" muted>Kategorie: {result.category.label}</AppText> : null}

        <View style={{ marginTop: spacing.md }}>
          {result.reasons.map((r: string, i: number) => (
            <AppText key={i} type="p2" style={{ marginBottom: 6 }}>• {r}</AppText>
          ))}
        </View>

        <AppButton
          title="Nochmal scannen"
          onPress={() => { setResult(null); lockRef.current = false; }}
          style={{ marginTop: spacing.xl }}
        />
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <CameraView
        style={{ flex: 1 }}
        mute
        barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_e", "upc_a", "qr"] }}
        onBarcodeScanned={onScan}
      />
      {busy && (
        <View style={{ position: "absolute", bottom: 24, left: 0, right: 0, alignItems: "center", gap: 8 }}>
          <ActivityIndicator />
          <AppText type="p3" style={{ color: "#fff" }}>Produktdaten werden geladen…</AppText>
        </View>
      )}
    </View>
  );
}