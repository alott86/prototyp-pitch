import { BarcodeScanningResult, CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, SafeAreaView, Text, View } from "react-native";
import { evaluateProduct, fetchProductByBarcode, ProductEval } from "./src/logic";

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
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#fff" }}>
        <Text style={{ fontSize: 16, marginBottom: 12, color: "#111" }}>Bitte Kamera-Zugriff erlauben.</Text>
        <Pressable onPress={requestPermission} style={{ padding: 12, backgroundColor: "#111", borderRadius: 8 }}>
          <Text style={{ color: "white" }}>Erlauben</Text>
        </Pressable>
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
      // Kamera bleibt gelockt, bis Nutzer „Nochmal scannen“ drückt
    }
  };

  if (result) {
    return (
      <SafeAreaView style={{ flex: 1, padding: 20, gap: 12, justifyContent: "center", backgroundColor: "#fff" }}>
        <Text style={{ fontSize: 24, fontWeight: "800", color: result.ok ? "#1e7d32" : "#c62828" }}>
          {result.ok ? "✅ Geeignet" : "⛔️ Nicht geeignet"}
        </Text>

        {/* Produktname */}
        <Text style={{ fontSize: 18, fontWeight: "600", color: "#111" }}>
          {result.productName}
        </Text>

        {/* Kategorie, falls erkannt */}
        {result.category?.label ? (
          <Text style={{ fontSize: 14, color: "#444" }}>
            Kategorie: {result.category.label}
          </Text>
        ) : null}

        {/* Begründungen */}
        <View style={{ marginTop: 8 }}>
          {result.reasons.map((r: string, i: number) => (
            <Text key={i} style={{ fontSize: 14, color: "#111", marginBottom: 4 }}>
              • {r}
            </Text>
          ))}
        </View>

        <Pressable
          onPress={() => { setResult(null); lockRef.current = false; }}
          style={{ marginTop: 16, padding: 12, backgroundColor: "#111", borderRadius: 8, alignSelf: "flex-start" }}
        >
          <Text style={{ color: "white" }}>Nochmal scannen</Text>
        </Pressable>
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
          <Text style={{ color: "white" }}>Produktdaten werden geladen…</Text>
        </View>
      )}
    </View>
  );
}