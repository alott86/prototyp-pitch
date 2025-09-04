// app/src/whoNpm2023.ts
// WHO Europe Nutrient Profile Model 2023 – stark vereinfachte, maschinenlesbare Schwellen.
// Alle Werte gelten pro 100 g (Food) bzw. 100 mL (Drinks). 0 bedeutet: muss 0 sein (kein Zusatz).

export type Thresholds = Partial<{
  total_fat_g: number;          // g/100g (food) bzw. g/100mL (drink)
  sat_fat_g: number;            // g/100g bzw. g/100mL
  total_sugars_g: number;       // g/100g bzw. g/100mL
  added_sugars_g: number;       // immer 0, wenn gesetzt
  nss_g: number;                // non-sugar sweeteners (0 = nicht erlaubt)
  sodium_g: number;             // g/100g bzw. g/100mL
  energy_kcal: number;          // nur bei Category 9
}>;

export type CategoryId =
  | "1_choc_sugar_confectionery"
  | "2_cakes_biscuits_pastries"
  | "3_savoury_snacks"
  | "4_1_juices"
  | "4_2_dairy_milk_drinks"
  | "4_3_plant_milk_drinks"
  | "4_4_energy_drinks"
  | "4_5_soft_drinks_waters_other"
  | "5_edible_ices"
  | "6_breakfast_cereals"
  | "7_yogurt_sour_milk_cream"
  | "8_cheese"
  | "9_ready_convenience_composite"
  | "10_fats_oils"
  | "11_bread_and_crispbreads"
  | "12_pasta_rice_grains"
  | "13_fresh_meat_poultry_fish"
  | "14_processed_meat_fish"
  | "15_fresh_frozen_fruit_veg_legumes"
  | "16_processed_fruit_veg"
  | "17_savoury_plant_meat_analogues"
  | "18_sauces_dips_dressings";

export type Category = {
  id: CategoryId;
  label: string;
  isDrink?: boolean;            // true = 100 mL, false/undefined = 100 g
  thresholds: Thresholds;
};

// NOTE: Diese Tabelle deckt die Kategorien aus der publizierten WHO-Tabelle ab.
// Einige Kategorien haben keine Angabe für bestimmte Felder -> dann fehlt der Key.
// Wir erweitern das später gern um die restlichen Subdetails.
export const WHO_NPM_2023: Category[] = [
  { id: "1_choc_sugar_confectionery", label: "Chocolate & sugar confectionery / energy bars / sweet toppings & desserts",
    thresholds: { added_sugars_g: 0, nss_g: 0 } },

  { id: "2_cakes_biscuits_pastries", label: "Cakes, sweet biscuits, pastries & dry mixes",
    thresholds: { total_fat_g: 3, added_sugars_g: 0, nss_g: 0, sodium_g: 0.1 } },

  { id: "3_savoury_snacks", label: "Savoury snacks",
    thresholds: { added_sugars_g: 0, nss_g: 0, sodium_g: 0.1 } },

  { id: "4_1_juices", label: "Beverages – Juices", isDrink: true,
    thresholds: { added_sugars_g: 0, nss_g: 0 } },

  { id: "4_2_dairy_milk_drinks", label: "Beverages – Dairy milk drinks", isDrink: true,
    thresholds: { total_fat_g: 3, added_sugars_g: 0, nss_g: 0 } },

  { id: "4_3_plant_milk_drinks", label: "Beverages – Plant-based milk drinks", isDrink: true,
    thresholds: { total_fat_g: 3, added_sugars_g: 0, nss_g: 0 } },

  { id: "4_4_energy_drinks", label: "Beverages – Energy drinks", isDrink: true,
    thresholds: { added_sugars_g: 0, nss_g: 0 } },

  { id: "4_5_soft_drinks_waters_other", label: "Beverages – Soft drinks, bottled waters & other drinks", isDrink: true,
    thresholds: { added_sugars_g: 0, nss_g: 0 } },

  { id: "5_edible_ices", label: "Edible ices",
    thresholds: { total_fat_g: 3, added_sugars_g: 0, nss_g: 0, sodium_g: 0.1 } },

  { id: "6_breakfast_cereals", label: "Breakfast cereals",
    thresholds: { total_fat_g: 17, sat_fat_g: 6, total_sugars_g: 12.5, sodium_g: 0.5 } },

  { id: "7_yogurt_sour_milk_cream", label: "Yogurt, sour milk, cream and similar",
    thresholds: { total_fat_g: 3, sat_fat_g: 1, total_sugars_g: 12.5, nss_g: 0, sodium_g: 0.1 } },

  { id: "8_cheese", label: "Cheese",
    thresholds: { total_fat_g: 17, sodium_g: 0.5 } },

  { id: "9_ready_convenience_composite", label: "Ready-made & convenience foods and composite dishes",
    thresholds: { total_fat_g: 17, sat_fat_g: 6, total_sugars_g: 12.5, sodium_g: 0.5, energy_kcal: 225 } },

  { id: "10_fats_oils", label: "Butter, other fats and oils",
    thresholds: { total_fat_g: 21, sodium_g: 0.5 } },

  { id: "11_bread_and_crispbreads", label: "Bread, bread products & crisp breads",
    thresholds: { total_fat_g: 17, total_sugars_g: 12.5, sodium_g: 0.5 } },

  { id: "12_pasta_rice_grains", label: "Fresh or dried pasta, rice and grains",
    thresholds: { total_fat_g: 17, total_sugars_g: 12.5, sodium_g: 0.5 } },

  { id: "13_fresh_meat_poultry_fish", label: "Fresh & frozen meat, poultry, fish and similar",
    thresholds: { total_fat_g: 17 } },

  { id: "14_processed_meat_fish", label: "Processed meat, poultry, fish and similar",
    thresholds: { total_fat_g: 17, sodium_g: 0.5 } },

  { id: "15_fresh_frozen_fruit_veg_legumes", label: "Fresh & frozen fruit, vegetables and legumes",
    thresholds: { /* explizit erlaubt; keine Grenzwerte */ } },

  { id: "16_processed_fruit_veg", label: "Processed fruit & vegetables",
    thresholds: { total_fat_g: 3, total_sugars_g: 12.5, added_sugars_g: 0, sodium_g: 0.5 } },

  { id: "17_savoury_plant_meat_analogues", label: "Savoury plant-based foods / meat analogues",
    thresholds: { total_fat_g: 17, added_sugars_g: 0, nss_g: 0, sodium_g: 0.5 } },

  { id: "18_sauces_dips_dressings", label: "Sauces, dips & dressings",
    thresholds: { total_fat_g: 17, added_sugars_g: 0, nss_g: 0, sodium_g: 0.5 } },
];

// Hilfsdaten zur Erkennung von Süßstoffen über Zutatenliste (nicht abschließend)
export const NON_SUGAR_SWEETENERS = [
  // gängige Namen
  "aspartam", "acesulfam", "sucralose", "saccharin", "zyklamat", "cyclamat", "neotam", "advantam",
  "stevia", "steviolglycoside", "thaumatin", "alitame", "erythrit", "xylit", "sorbit", "mannit", "isomalt", "maltit", "laktit",
  // INS/E-Nummern
  "e950","e951","e952","e953","e954","e955","e957","e958","e959","e960","e961","e962","e963","e965","e966","e967","e968"
];

// Heuristische Zuordnung von OpenFoodFacts-Kategorien zu WHO-Kategorien.
// Wir erweitern das iterativ, wenn nötig.
export const OFF_TAG_TO_WHO: Array<[CategoryId, RegExp]> = [
  ["6_breakfast_cereals", /breakfast-?cereal|muesli|granola/i],
  ["4_5_soft_drinks_waters_other", /soft-?drinks|sodas?|limonade|cola|iced-?tea|water/i],
  ["4_1_juices", /juices?|smoothies?/i],
  ["4_2_dairy_milk_drinks", /\bmilk(s)?\b|milchgetränk|kakao-?drink/i],
  ["4_3_plant_milk_drinks", /soy|soja|oat|hafer|almond|mandel|coconut|kokos.*(drink|milk)/i],
  ["7_yogurt_sour_milk_cream", /yogurt|joghur|kefir|buttermilk/i],
  ["8_cheese", /cheese|käse/i],
  ["3_savoury_snacks", /chips|crisps|snacks?|cracker|pretzel|popcorn/i],
  ["5_edible_ices", /ice-?cream|gelato|sorbet|eis/i],
  ["9_ready_convenience_composite", /ready-?meal|fertiggericht|pizza|soup|sauce.*meal|wrap|burger|sandwich/i],
  ["11_bread_and_crispbreads", /bread|brot|baguette|flatbread|tortilla/i],
  ["12_pasta_rice_grains", /pasta|noodles?|rice|reis|quinoa|bulgur|couscous/i],
  ["14_processed_meat_fish", /ham|schinken|sausage|würst|bacon|salami|smoked|tinned tuna|fish finger/i],
  ["13_fresh_meat_poultry_fish", /fresh.*(meat|fish|poultry)|rohes? (fleisch|fisch)/i],
  ["16_processed_fruit_veg", /canned|tinned|pickled|eingelegt|kompott|gemüse.*(dose|glas)/i],
  ["17_savoury_plant_meat_analogues", /tofu|tempeh|seitan|veggie.*(burger|meat)|pflanzen( ?-)?hack/i],
  ["18_sauces_dips_dressings", /ketchup|mayo|mayonnaise|sauce|dressing|dip|pesto|sojasauce/i],
  ["1_choc_sugar_confectionery", /chocolate|praline|confectionery|bonbon|gummi|marzipan|nut butter|honig|honey/i],
  ["2_cakes_biscuits_pastries", /cake|kuchen|biscuit|keks|waffle|croissant|pastry|muffin|pancake|waffel/i],
  ["10_fats_oils", /butter|margarine|öl|olive oil|sunflower oil|rapsöl|plant oil/i],
  ["15_fresh_frozen_fruit_veg_legumes", /fresh.*(fruit|vegetable)|frozen.*(fruit|vegetable)|legumes/i],
];