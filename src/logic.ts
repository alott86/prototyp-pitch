import {
  Category,
  NON_SUGAR_SWEETENERS,
  OFF_TAG_TO_WHO,
  WHO_NPM_2023,
} from "./whoNpm2023";

/** ==== Typen ==== */
export type OFFProductRaw = {
  code: string;
  product?: {
    product_name?: string;
    generic_name?: string;
    generic_name_de?: string;
    brands?: string;
    image_url?: string;
    image_front_url?: string;
    nutriments?: Record<string, any>;
    ingredients_text?: string;
    ingredients_text_de?: string;
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
  imageUrl?: string;
  description?: string;
  nutrients: {
    energyKcal100?: number;
    fat100?: number;
    sugars100?: number;
    salt100?: number;
  };
  ingredientsText?: string;
  ingredients?: string[];
};

const UA = "FoodScanProto/0.4 (contact: you@example.com)";

/** ==== Helfer ==== */
function num(v: any): number | undefined {
  const n = typeof v === "number" ? v : v ? Number(v) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

/** nimmt den ersten vorhandenen Key aus der Liste */
function getFirst(n: Record<string, any>, keys: string[]): number | undefined {
  for (const k of keys) {
    const v = num(n?.[k]);
    if (v !== undefined) return v;
  }
  return undefined;
}

function sodiumToSalt(sodiumG: number | undefined): number | undefined {
  return sodiumG === undefined ? undefined : sodiumG * 2.5;
}
function kjToKcal(kj: number | undefined): number | undefined {
  return kj === undefined ? undefined : kj * 0.239006;
}
function splitIngredients(txt?: string): string[] {
  if (!txt) return [];
  return txt
    .split(/[,;•]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** ==== OpenFoodFacts laden & normalisieren ==== */
export async function fetchProductByBarcode(code: string) {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
    code
  )}.json`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`OFF HTTP ${res.status}`);
  const json: OFFProductRaw = await res.json();
  if (json.status !== 1 || !json.product) throw new Error("Produkt nicht gefunden.");

  const p = json.product;
  const name = p.product_name ?? "Unbenannt";
  const brand = p.brands ?? "";
  const imageUrl = p.image_front_url || p.image_url;
  const nutr = p.nutriments ?? {};

  // ---- Energie (kcal/100)
  const energyKcal100 =
    getFirst(nutr, ["energy-kcal_100g", "energy-kcal", "energy-kcal_value"]) ??
    kjToKcal(getFirst(nutr, ["energy-kj_100g", "energy-kj", "energy-kj_value"])) ??
    // manche tragen nur "energy_100g" (=kJ)
    kjToKcal(getFirst(nutr, ["energy_100g", "energy"]));

  // ---- Fett/Zucker/Salz (g/100)
  const fat100 = getFirst(nutr, ["fat_100g", "fat", "fat_value"]);
  const sugars100 = getFirst(nutr, ["sugars_100g", "sugars", "sugars_value"]);
  const salt100 =
    getFirst(nutr, ["salt_100g", "salt", "salt_value"]) ??
    sodiumToSalt(getFirst(nutr, ["sodium_100g", "sodium", "sodium_value"]));

  const ingredientsText =
    p.ingredients_text_de || p.ingredients_text || undefined;

  const offTags = (p.categories_tags ?? []).map((t: string) => t.toLowerCase());

  return {
    code,
    name,
    brand,
    nutriments: nutr,
    ingredients: (ingredientsText ?? "").toLowerCase(),
    ingredientsDisplay: ingredientsText,
    offTags,
    imageUrl,
    energyKcal100,
    fat100,
    sugars100,
    salt100,
    description: p.generic_name_de || p.generic_name || undefined,
  };
}

/** ==== Mapping OFF-Kategorien → WHO NPM Kategorie ==== */
function findCategory(offTags: string[]): Category | undefined {
  for (const [catId, rx] of OFF_TAG_TO_WHO) {
    if (offTags.some((tag: string) => rx.test(tag))) {
      return WHO_NPM_2023.find((c) => c.id === catId);
    }
  }
  return undefined;
}

function sodiumFromNutriments(n: Record<string, any>): number | undefined {
  const sodium =
    getFirst(n, ["sodium_100g", "sodium", "sodium_value"]) ??
    // manche tragen 100mg → g umrechnen (selten)
    (num(n["sodium_100mg"]) !== undefined ? num(n["sodium_100mg"])! / 100 : undefined);
  if (sodium !== undefined) return sodium;
  const salt = getFirst(n, ["salt_100g", "salt", "salt_value"]);
  if (salt !== undefined) return salt / 2.5;
  return undefined;
}

function containsAddedSugar(ingredients: string): boolean {
  const sugarWords = [
    "zucker","sugar","glukose","glucose","fruktose","fructose","saccharose","sucrose","dextrose",
    "sirup","syrup","honig","honey","maltose","maltodextrin","invertzucker","reissirup","maissirup",
    "ahornsirup","maple syrup","karamell","caramel","traubenzucker",
  ];
  return sugarWords.some((w) => ingredients.includes(w));
}
function containsNSS(ingredients: string): boolean {
  return NON_SUGAR_SWEETENERS.some((s) => ingredients.includes(s));
}

/** ==== Bewertung ==== */
export function evaluateProduct(p: {
  code: string;
  name: string;
  brand: string;
  nutriments: Record<string, any>;
  ingredients: string;
  ingredientsDisplay?: string;
  offTags: string[];
  imageUrl?: string;
  energyKcal100?: number;
  fat100?: number;
  sugars100?: number;
  salt100?: number;
  description?: string;
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
      imageUrl: p.imageUrl,
      description: p.description,
      nutrients: {
        energyKcal100: p.energyKcal100,
        fat100: p.fat100,
        sugars100: p.sugars100,
        salt100: p.salt100,
      },
      ingredientsText: p.ingredientsDisplay,
      ingredients: splitIngredients(p.ingredientsDisplay),
    };
  }

  const t = cat.thresholds;
  const unit = cat.isDrink ? "mL" : "g";

  // robust nachziehen, falls oben nicht geliefert
  const totalFat = p.fat100 ?? getFirst(p.nutriments, ["fat_100g", "fat", "fat_value"]);
  const satFat = getFirst(p.nutriments, ["saturated-fat_100g", "saturated-fat"]);
  const sugars = p.sugars100 ?? getFirst(p.nutriments, ["sugars_100g", "sugars", "sugars_value"]);
  const sodiumVia = sodiumFromNutriments(p.nutriments);
  const saltCalc =
    p.salt100 ??
    getFirst(p.nutriments, ["salt_100g", "salt", "salt_value"]) ??
    (sodiumVia !== undefined ? sodiumVia * 2.5 : undefined);

  const energy =
    p.energyKcal100 ??
    getFirst(p.nutriments, ["energy-kcal_100g", "energy-kcal", "energy-kcal_value"]) ??
    kjToKcal(getFirst(p.nutriments, ["energy-kj_100g", "energy-kj", "energy-kj_value"])) ??
    kjToKcal(getFirst(p.nutriments, ["energy_100g", "energy"]));

  const hasAddedSugars = containsAddedSugar(p.ingredients);
  const hasNSS = containsNSS(p.ingredients);

  const check = (cond: boolean | undefined, passMsg: string, failMsg: string) => {
    if (cond === undefined) {
      reasons.push(`${failMsg} (kein Wert)`);
      ok = false;
    } else if (cond) {
      reasons.push(passMsg);
    } else {
      reasons.push(failMsg);
      ok = false;
    }
  };

  if (t.total_fat_g !== undefined) {
    check(
      totalFat !== undefined ? totalFat <= t.total_fat_g : undefined,
      `Fett ≤ ${t.total_fat_g} g/100${unit}.`,
      `Fett > ${t.total_fat_g} g/100${unit}.`
    );
  }
  if (t.sat_fat_g !== undefined) {
    check(
      satFat !== undefined ? satFat <= t.sat_fat_g : undefined,
      `Gesättigte Fette ≤ ${t.sat_fat_g} g/100${unit}.`,
      `Gesättigte Fette > ${t.sat_fat_g} g/100${unit}.`
    );
  }
  if (t.total_sugars_g !== undefined) {
    check(
      sugars !== undefined ? sugars <= t.total_sugars_g : undefined,
      `Zucker gesamt ≤ ${t.total_sugars_g} g/100${unit}.`,
      `Zucker gesamt > ${t.total_sugars_g} g/100${unit}.`
    );
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
    check(
      sodiumVia !== undefined ? sodiumVia <= t.sodium_g : undefined,
      `Natrium ≤ ${t.sodium_g} g/100${unit}.`,
      `Natrium > ${t.sodium_g} g/100${unit}.`
    );
  }
  if (t.energy_kcal !== undefined) {
    check(
      energy !== undefined ? energy <= t.energy_kcal : undefined,
      `Energie ≤ ${t.energy_kcal} kcal/100${unit}.`,
      `Energie > ${t.energy_kcal} kcal/100${unit}.`
    );
  }

  const name = [p.name, p.brand].filter(Boolean).join(" · ");

  return {
    ok,
    productName: name || p.code,
    category: cat,
    reasons,
    imageUrl: p.imageUrl,
    description: p.description,
    nutrients: {
      energyKcal100: energy,
      fat100: totalFat,
      sugars100: sugars,
      salt100: saltCalc,
    },
    ingredientsText: p.ingredientsDisplay,
    ingredients: splitIngredients(p.ingredientsDisplay),
  };
}