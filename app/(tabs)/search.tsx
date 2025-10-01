// app/(tabs)/search.tsx
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { ActivityIndicator, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { addRecent } from "../../src/history";
import { fetchProductByBarcode, ProductEval } from "../../src/logic";
import { colors, radius, spacing, typography } from "../../src/theme";
import AppButton from "../../src/ui/AppButton";
import AppText from "../../src/ui/AppText";
import ProfileHeader from "../../src/ui/ProfileHeader";
import SectionCard from "../../src/ui/SectionCard";
import SettingsButton from "../../src/ui/SettingsButton";
import { useTabBarPadding } from "../../src/ui/tabBarInset";

export default function ManualSearchScreen() {
  const router = useRouter();
  const [barcode, setBarcode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ProductEval | null>(null);
  const bottomPad = useTabBarPadding(spacing.lg);
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();

  const topPadding = Math.max(insets.top + spacing.xs, spacing.md);

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
        suitable: data.suitable ?? null,
      });
      setResult(data);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: topPadding,
          paddingBottom: bottomPad,
          gap: spacing.xl,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: "flex-end" }}>
          <SettingsButton onPress={() => router.push("/(tabs)/profile")} />
        </View>

        <ProfileHeader
          title="Manuelle Suche"
          subtitle="Gib den Barcode ein, wenn du nicht scannen kannst."
          icon="search"
        />

        <SectionCard
          title="Barcode-Eingabe"
          items={[
            {
              content: (
                <View style={{ gap: spacing.sm }}>
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

                  {busy ? (
                    <View style={{ alignItems: "center" }}>
                      <ActivityIndicator />
                      <AppText type="p3" muted style={{ marginTop: 6 }}>
                        Produktdaten werden geladen…
                      </AppText>
                    </View>
                  ) : null}
                </View>
              ),
            },
          ]}
        />

        {result && (
          <SectionCard
            title="Letztes Ergebnis"
            items={[
              {
                content: (
                  <View style={{ gap: spacing.xs }}>
                    <AppText type="p2" style={{ color: colors.text }}>
                      {result.productName || "Unbenannt"}
                      {result.brand ? ` · ${result.brand}` : ""}
                    </AppText>
                    <AppText type="p3" muted>
                      Bewertung: {result.suitable ? "Geeignet" : "Nicht geeignet"}
                    </AppText>
                  </View>
                ),
              },
            ]}
          />
        )}
      </ScrollView>
    </View>
  );
}
