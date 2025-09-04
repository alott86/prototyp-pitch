import { Category, NON_SUGAR_SWEETENERS, OFF_TAG_TO_WHO, WHO_NPM_2023 } from "./whoNpm2023";

export type OFFProductRaw = {
  code: string;
  product?: {
    product_name?: string;
    brands?: string;
    nutriments?: Record<string, any>;
    ingredients_text?: string;
    categories_tags?: string[];
    quantity?: string;
  };
  status?: number;
};

export type ProductEval = {
  ok: boolean;
  productName: string;
  category?: Category;
  reasons: string[];
};

const UA = "FoodScanProto/0.2 (deine.email@example.com)";

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
    offTags: (p.categories_tags ?? []).map((t: string) => t.toLowerCase()),
  };
}

function findCategory(offTags: string[]): Category | undefined {
  for (const [catId, rx] of OFF_TAG_TO_WHO) {
    if (offTags.some((tag: string) => rx.test(tag))) {
      return WHO_NPM_2023.find((c) => c.id === catId);
    }
  }
  return undefined;
}

function getNutrimentNum(nutriments: Record<string, any>, key: string): number | undefined {
  const v = nutriments?.[key];
  const n = typeof v === "number" ? v : v ? Number(v) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

function sodiumFromNutriments(n: Record<string, any>): number | undefined {
  const sodium = getNutrimentNum(n, "sodium_100g");
  if (sodium !== undefined) return sodium;
  const salt = getNutrimentNum(n, "salt_100g");
  if (salt !== undefined) return salt / 2.5;
  return undefined;
}

function containsAddedSugar(ingredients: string): boolean {
  const sugarWords = [
    "zucker","sugar","glukose","glucose","fruktose","fructose","saccharose","sucrose","dextrose",
    "sirup","syrup","honig","honey","maltose","maltodextrin","invertzucker","reissirup","maissirup",
    "ahornsirup","maple syrup","karamell","caramel","traubenzucker",
  ];
  return sugarWords.some((w: string) => ingredients.includes(w));
}

function containsNSS(ingredients: string): boolean {
  return NON_SUGAR_SWEETENERS.some((s: string) => ingredients.includes(s));
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
        "Tipp: In OpenFoodFacts passende Kategorien-Tags pflegen (z. B. „breakfast-cereals“).",
      ],
    };
  }

  const t = cat.thresholds;
  const unit = cat.isDrink ? "mL" : "g";

  const totalFat = getNutrimentNum(p.nutriments, "fat_100g");
  const satFat   = getNutrimentNum(p.nutriments, "saturated-fat_100g");
  const sugars   = getNutrimentNum(p.nutriments, "sugars_100g");
  const sodium   = sodiumFromNutriments(p.nutriments);

  const hasAddedSugars = containsAddedSugar(p.ingredients);
  const hasNSS         = containsNSS(p.ingredients);

  const check = (cond: boolean | undefined, passMsg: string, failMsg: string) => {
    if (cond === undefined) { reasons.push(`${failMsg} (kein Wert)`); ok = false; }
    else if (cond) { reasons.push(passMsg); }
    else { reasons.push(failMsg); ok = false; }
  };

  if (t.total_fat_g !== undefined) {
    check(totalFat !== undefined ? totalFat <= t.total_fat_g : undefined,
      `Fett ≤ ${t.total_fat_g} g/100${unit}.`,
      `Fett > ${t.total_fat_g} g/100${unit}.`);
  }
  if (t.sat_fat_g !== undefined) {
    check(satFat !== undefined ? satFat <= t.sat_fat_g : undefined,
      `Gesättigte Fette ≤ ${t.sat_fat_g} g/100${unit}.`,
      `Gesättigte Fette > ${t.sat_fat_g} g/100${unit}.`);
  }
  if (t.total_sugars_g !== undefined) {
    check(sugars !== undefined ? sugars <= t.total_sugars_g : undefined,
      `Zucker gesamt ≤ ${t.total_sugars_g} g/100${unit}.`,
      `Zucker gesamt > ${t.total_sugars_g} g/100${unit}.`);
  }
  if (t.added_sugars_g !== undefined) {
    const pass = !hasAddedSugars;
    check(pass, "Keine zugesetzten Zucker.", "Zugesetzte Zucker enthalten.");
  }
  if (t.nss_g !== undefined) {
    const pass = !hasNSS;
    check(pass, "Keine Süßstoffe (NSS) enthalten.", "Süßstoffe (NSS) enthalten.");
  }
  if (t.sodium_g !== undefined) {
    check(sodium !== undefined ? sodium <= t.sodium_g : undefined,
      `Natrium ≤ ${t.sodium_g} g/100${unit}.`,
      `Natrium > ${t.sodium_g} g/100${unit}.`);
  }
  if (t.energy_kcal !== undefined) {
    const energy = getNutrimentNum(p.nutriments, "energy-kcal_100g");
    check(energy !== undefined ? energy <= t.energy_kcal : undefined,
      `Energie ≤ ${t.energy_kcal} kcal/100${unit}.`,
      `Energie > ${t.energy_kcal} kcal/100${unit}.`);
  }

  const name = [p.name, p.brand].filter(Boolean).join(" · ");
  return { ok, productName: name || p.code, category: cat, reasons };
}