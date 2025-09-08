// app/(tabs)/search.tsx
import React, { useRef, useState } from "react";
import { ActivityIndicator, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { addRecent } from "../../src/history";
import { fetchProductByBarcode, ProductEval } from "../../src/logic";
import { colors, radius, spacing, typography } from "../../src/theme";
import AppButton from "../../src/ui/AppButton";
import AppText from "../../src/ui/AppText";
import { useTabBarPadding } from "../../src/ui/tabBarInset";

export default function ManualSearchScreen() {
  const [barcode, setBarcode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ProductEval | null>(null);
  const bottomPad = useTabBarPadding(spacing.lg);
  const inputRef = useRef<TextInput>(null);

  async function onSubmit() {
    const code = barcode.trim();
    if (!code || busy) return;

    setBusy(true);
    setResult(null);
    try {
      const data = await fetchProductByBarcode(code);
      if (!data) {
        setResult(null);
        return;
      }
      await addRecent({
        id: code,
        name: data.productName ?? "Unbenannt",
        brand: data.brand ?? null,
        imageUrl: data.imageUrl ?? null,
      });
      setResult(data);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: bottomPad,
          gap: spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <AppText type="h2" style={{ color: colors.text }}>Suche</AppText>

        <View style={{ gap: spacing.xs }}>
          <AppText type="p3" muted>Barcode</AppText>
          <TextInput
            ref={inputRef}
            value={barcode}
            onChangeText={setBarcode}
            placeholder="z. B. 4006381333931"
            inputMode="numeric"
            keyboardType="number-pad"
            returnKeyType="search"
            onSubmitEditing={onSubmit}
            editable={!busy}
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
        </View>

        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <AppButton title={busy ? "Suchen…" : "Suchen"} onPress={onSubmit} disabled={busy} />
          <AppButton title="Leeren" onPress={() => setBarcode("")} variant="ghost" disabled={busy} />
        </View>

        {busy && (
          <View style={{ alignItems: "center", marginTop: spacing.sm }}>
            <ActivityIndicator />
            <AppText type="p3" muted style={{ marginTop: 6 }}>
              Produktdaten werden geladen…
            </AppText>
          </View>
        )}

        {result && (
          <View
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: spacing.lg,
              backgroundColor: colors.primary_50,
            }}
          >
            <AppText type="p2" style={{ color: colors.text }}>
              {result.productName || "Unbenannt"}{result.brand ? ` · ${result.brand}` : ""}
            </AppText>
            <AppText type="p3" muted>
              Bewertung: {result.suitable ? "Geeignet" : "Nicht geeignet"}
            </AppText>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}