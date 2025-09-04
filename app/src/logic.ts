// app/src/logic.ts
import { Category, NON_SUGAR_SWEETENERS, OFF_TAG_TO_WHO, WHO_NPM_2023 } from "./whoNpm2023";

export type OFFProductRaw = {
  code: string;
  product?: {
    product_name?: string;
    brands?: string;
    nutriments?: Record<string, any>;
    ingredients_text?: string;
    categories_tags?: string[];      // OFF Kategorie-Tags
    quantity?: string;               // z.B. "330 ml"
  };
  status?: number;
};

export type ProductEval = {
  ok: boolean;
  productName: string;
  category?: Category;
  reasons: string[];                 // kurze Begründungen
};

const UA = "FoodScanProto/0.2 (deine.email@example.com)"; // <= bitte deine E-Mail setzen

export async function fetchProductByBarcode(code: string) {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`OFF HTTP ${res.status}`);
  const json: OFFProductRaw = await res.json();
  if (json.status !== 1 || !json.product) throw new Error("Produkt nicht gefunden.");
  const p = json.product;

  return {
    code,
    name: p.product_name ?? "Unbenannt",
    brand: p.brands ?? "",
    nutriments: p.nutriments ?? {},
    ingredients: (p.ingredients_text ?? "").toLowerCase(),
    offTags: (p.categories_tags ?? []).map(t => t.toLowerCase()),
  };
}

// --- WHO Auswertung ---

function findCategory(offTags: string[]): Category | undefined {
  // 1) Heuristik über OFF-Tags
  for (const [catId, rx] of OFF_TAG_TO_WHO) {
    if (offTags.some(tag => rx.test(tag))) {
      return WHO_NPM_2023.find(c => c.id === catId);
    }
  }
  // 2) Fallback: keine Zuordnung
  return undefined;
}

function getNutrimentNum(nutriments: Record<string, any>, key: string): number | undefined {
  const v = nutriments?.[key];
  const n = typeof v === "number" ? v : v ? Number(v) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

function sodiumFromNutriments(n: Record<string, any>): number | undefined {
  // OFF liefert entweder sodium_100g (g) oder nur salt_100g (g).
  const sodium = getNutrimentNum(n, "sodium_100g");
  if (sodium !== undefined) return sodium;
  const salt = getNutrimentNum(n, "salt_100g");
  if (salt !== undefined) return salt / 2.5; // 1 g Na = 2.5 g Salz
  return undefined;
}

function containsAddedSugar(ingredients: string): boolean {
  // einfache Heuristik für "added sugars" anhand Zutatenliste
  const sugarWords = [
    "zucker","sugar","glukose","glucose","fruktose","fructose","saccharose","sucrose","dextrose",
    "sirup","syrup","honig","honey","maltose","maltodextrin","invertzucker","reissirup","maissirup",
    "ahornsirup","maple syrup","karamell","caramel","traubenzucker"
  ];
  return sugarWords.some(w => ingredients.includes(w));
}

function containsNSS(ingredients: string): boolean {
  return NON_SUGAR_SWEETENERS.some(s => ingredients.includes(s));
}

export function evaluateProduct(p: {
  code: string; name: string; brand: string;
  nutriments: Record<string, any>; ingredients: string; offTags: string[];
}): ProductEval {
  const reasons: string[] = [];
  let ok = true;

  const cat = findCategory(p.offTags);
  if (!cat) {
    return {
      ok: false,
      productName: [p.name, p.brand].filter(Boolean).join(" · ") || p.code,
      category: undefined,
      reasons: [
        "Kategorie konnte nicht automatisch erkannt werden.",
        "Tipp: In OpenFoodFacts sollte das Produkt passende Kategorien-Tags haben (z. B. „breakfast-cereals“)."
      ]
    };
  }

  const t = cat.thresholds;

  // Werte (pro 100g / 100mL) aus OFF holen
  const totalFat = getNutrimentNum(p.nutriments, "fat_100g");
  const satFat   = getNutrimentNum(p.nutriments, "saturated-fat_100g");
  const sugars   = getNutrimentNum(p.nutriments, "sugars_100g");
  const sodium   = sodiumFromNutriments(p.nutriments);

  // "added sugars" und "non-sugar sweeteners" über Zutatenliste erkennen
  const hasAddedSugars = containsAddedSugar(p.ingredients);
  const hasNSS         = containsNSS(p.ingredients);

  // Check-Helper
  const check = (cond: boolean | undefined, passMsg: string, failMsg: string) => {
    if (cond === undefined) {
      reasons.push(`${failMsg} (kein Wert vorhanden)`);
      ok = false;
    } else if (cond) {
      reasons.push(passMsg);
    } else {
      reasons.push(failMsg);
      ok = false;
    }
  };

  // Grenzwert-Prüfungen je nach vorhandenen Thresholds
  if (t.total_fat_g !== undefined) {
    check(totalFat !== undefined ? totalFat <= t.total_fat_g : undefined,
      `Fett ≤ ${t.total_fat_g} g/100${cat.isDrink ? "mL" : "g"}.`,
      `Fett > ${t.total_fat_g} g/100${cat.isDrink ? "mL" : "g"}.`);
  }
  if (t.sat_fat_g !== undefined) {
    check(satFat !== undefined ? satFat <= t.sat_fat_g : undefined,
      `Gesättigte Fette ≤ ${t.sat_fat_g} g/100${cat.isDrink ? "mL" : "g"}.`,
      `Gesättigte Fette > ${t.sat_fat_g} g/100${cat.isDrink ? "mL" : "g"}.`);
  }
  if (t.total_sugars_g !== undefined) {
    check(sugars !== undefined ? sugars <= t.total_sugars_g : undefined,
      `Zucker gesamt ≤ ${t.total_sugars_g} g/100${cat.isDrink ? "mL" : "g"}.`,
      `Zucker gesamt > ${t.total_sugars_g} g/100${cat.isDrink ? "mL" : "g"}.`);
  }
  if (t.added_sugars_g !== undefined) {
    // added_sugars_g === 0 -> keine zugesetzten Zucker erlaubt
    const pass = !hasAddedSugars;
    check(pass, "Keine zugesetzten Zucker.", "Zugesetzte Zucker enthalten.");
  }
  if (t.nss_g !== undefined) {
    const pass = !hasNSS;
    check(pass, "Keine Süßstoffe (NSS) enthalten.", "Süßstoffe (NSS) enthalten.");
  }
  if (t.sodium_g !== undefined) {
    check(sodium !== undefined ? sodium <= t.sodium_g : undefined,
      `Natrium ≤ ${t.sodium_g} g/100${cat.isDrink ? "mL" : "g"}.`,
      `Natrium > ${t.sodium_g} g/100${cat.isDrink ? "mL" : "g"}.`);
  }
  if (t.energy_kcal !== undefined) {
    const energy = getNutrimentNum(p.nutriments, "energy-kcal_100g");
    check(energy !== undefined ? energy <= t.energy_kcal : undefined,
      `Energie ≤ ${t.energy_kcal} kcal/100${cat.isDrink ? "mL" : "g"}.`,
      `Energie > ${t.energy_kcal} kcal/100${cat.isDrink ? "mL" : "g"}.`);
  }

  const name = [p.name, p.brand].filter(Boolean).join(" · ");
  return { ok, productName: name || p.code, category: cat, reasons };
}