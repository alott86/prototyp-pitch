// app/(tabs)/home.tsx
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radius, spacing } from "../../src/theme";
import AppButton from "../../src/ui/AppButton";
import AppText from "../../src/ui/AppText";
import { useTabBarPadding } from "../../src/ui/tabBarInset";

export default function HomeScreen() {
  const router = useRouter();
  const bottomPad = useTabBarPadding(spacing.lg);

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
        {/* Block 1 – Begrüßung & Mission */}
        <View>
          <AppText type="h1" style={{ color: colors.text }}>FoodScan Kids</AppText>
          <AppText type="p2" muted>
            Gesunde Ernährung für Kinder von 3–6 – einfach, alltagstauglich und wissenschaftlich fundiert.
          </AppText>
        </View>

        {/* Block 2 – Warum Ernährung wichtig ist */}
        <Card>
          <AppText type="h3" style={{ color: colors.text }}>Warum das wichtig ist</AppText>
          <AppText type="p2" style={{ marginTop: 6 }}>
            Zwischen 3 und 6 Jahren prägen sich Essgewohnheiten fürs Leben. Eine gute Auswahl fördert Konzentration,
            Wachstum und das Immunsystem.
          </AppText>
        </Card>

        {/* Block 3 – Wissenschaftliche Grundlage (WHO) */}
        <Card tone="primary">
          <AppText type="h3" style={{ color: colors.text }}>Wissenschaftliche Basis</AppText>
          <Bullets
            items={[
              "Bewertung nach WHO Nutrient Profile Model (2023)",
              "Klarer Blick auf Zucker, Fett, Salz & Süßstoffe",
              "Regelbasiert statt Bauchgefühl",
            ]}
          />
          <AppText type="p3" muted style={{ marginTop: spacing.xs }}>
            Quelle: WHO NPM 2023. Wir übertragen die Kriterien transparent in unsere Auswertung.
          </AppText>
        </Card>

        {/* Block 4 – Was die App bietet */}
        <Card>
          <AppText type="h3" style={{ color: colors.text }}>Was du mit der App bekommst</AppText>
          <Bullets
            items={[
              "Lebensmittel in Echtzeit scannen",
              "Sofort: Geeignet / Nicht geeignet",
              "Zucker-, Salz- & Fettwerte auf einen Blick",
              "Unbegrenzte Favoriten & Suche",
            ]}
          />
        </Card>

        {/* Block 5 – Für wen */}
        <Card>
          <AppText type="h3" style={{ color: colors.text }}>Für wen ist FoodScan Kids?</AppText>
          <AppText type="p2" style={{ marginTop: 6 }}>
            Für Eltern – vor allem Mütter –, die gesunde Entscheidungen treffen möchten, ohne Nährwerttabellen zu studieren.
          </AppText>
        </Card>

        {/* Block 6 – Vertrauen & Datenquellen */}
        <Card tone="soft">
          <AppText type="h3" style={{ color: colors.text }}>Transparent & unabhängig</AppText>
          <Bullets
            items={[
              "Datenbasis: OpenFoodFacts",
              "Auswertung nach WHO-Kriterien",
              "Keine versteckte Werbung",
            ]}
          />
        </Card>

        {/* Block 7 – Call to Action */}
        <View style={{ alignItems: "center", marginTop: spacing.sm }}>
          <AppButton
            title="Jetzt Lebensmittel scannen"
            onPress={() => router.push("/scan")}
            style={{ width: "100%" }}
          />
        </View>

        {/* Zusätzlicher Abstand, falls Inhalte sehr lang werden */}
        <View style={{ height: spacing.md }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- Hilfs-Komponenten ---------- */

function Card({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "primary" | "soft";
}) {
  const bg =
    tone === "primary"
      ? colors.primary_50
      : tone === "soft"
      ? "#F4F7F5"
      : "#FFFFFF";

  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: radius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {children}
    </View>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
      {items.map((t, i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
          <Feather
            name="check-circle"
            size={18}
            color={colors.primary_700}
            style={{ marginTop: 2 }}
          />
          <AppText type="p2" style={{ flex: 1, color: colors.text }}>
            {t}
          </AppText>
        </View>
      ))}
    </View>
  );
}