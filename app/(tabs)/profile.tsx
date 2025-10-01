import React from "react";
import { ScrollView, View } from "react-native";

import { colors, spacing } from "../../src/theme";
import ProfileHeader from "../../src/ui/ProfileHeader";
import SectionCard, { SectionCardItem } from "../../src/ui/SectionCard";
import { useTabBarPadding } from "../../src/ui/tabBarInset";

const sections: Array<{ title: string; items: SectionCardItem[] }> = [
  {
    title: "Profil",
    items: [
      { icon: "user", label: "Persönliche Daten", description: "Name, Geburtstag, Kinder" },
      { icon: "bell", label: "Benachrichtigungen" },
    ],
  },
  {
    title: "App-Einstellungen",
    items: [
      { icon: "sliders", label: "Präferenzen", description: "Scans, Ernährungskategorien" },
      { icon: "globe", label: "Sprache & Region" },
    ],
  },
  {
    title: "Kontodetails",
    items: [
      { icon: "credit-card", label: "Abonnement", description: "Status & Verlängerung" },
      { icon: "lock", label: "Passwort & Sicherheit" },
    ],
  },
  {
    title: "Support",
    items: [
      { icon: "help-circle", label: "Hilfe & FAQ" },
      { icon: "mail", label: "Kontakt" },
    ],
  },
  {
    title: "Unternehmensinfos",
    items: [
      { icon: "info", label: "Über FoodScan" },
      { icon: "file-text", label: "Datenschutz & Richtlinien" },
      { icon: "log-out", label: "Abmelden", tone: "danger" },
    ],
  },
];

export default function ProfileScreen() {
  const bottomPad = useTabBarPadding(spacing.lg);

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
          title="Max Mustermann"
          subtitle="FoodScan Kids Mitglied seit 2024"
          icon="user"
          accent="star"
        />

        {sections.map((section) => (
          <SectionCard key={section.title} title={section.title} items={section.items} />
        ))}
      </ScrollView>
    </View>
  );
}
