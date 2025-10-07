// src/nppmInfant.ts
// Stark vereinfachte Grenzwerte aus dem WHO Nutrient and Promotion Profile Model (2022)
// für Lebensmittel, die an Säuglinge und Kleinkinder (6–36 Monate) vermarktet werden.
// Quelle: "Nutrient and promotion profile model: Supporting appropriate promotion of food products for infants and young children 6–36 months" (WHO Regional Office for Europe, 2022).

export const INFANT_MIN_ENERGY_KCAL_PER_100G = 60; // viele Kategorien verlangen ≥60 kcal / 100 g; trockene Cerealien ≥80 kcal
export const INFANT_MIN_ENERGY_KCAL_PER_100G_CEREAL = 80;

export const INFANT_SODIUM_MAX_MG_PER_100KCAL = 50; // allgemeiner Grenzwert
export const INFANT_SODIUM_MAX_MG_PER_100KCAL_CHEESE = 100; // Ausnahmewert, wenn Käse explizit im Produktnamen steht

export const INFANT_SUGAR_HIGH_FLAG_PERCENT_ENERGY = 30; // ab 30 % Energie aus Zucker → WHO verlangt High-sugar-Kennzeichnung
export const INFANT_SUGAR_GOOD_PERCENT_ENERGY = 10; // pragmatischer "grüner" Bereich, deutlich unterhalb der 30 %-Schwelle

export const INFANT_ADDED_SUGAR_TERMS = [
  "sirup",
  "zucker",
  "honig",
  "dicksaft",
  "syrup",
  "fructose",
  "glucose",
  "saccharose",
  "sucrose",
  "dextrose",
  "maltose",
  "invertzucker",
  "agaven",
  "ahorn",
];

export function containsCheeseHint(name?: string | null, ingredients?: string | null): boolean {
  const haystack = `${name ?? ""} ${ingredients ?? ""}`.toLowerCase();
  return /käse|cheese|cheddar|mozzarella|gouda/.test(haystack);
}
