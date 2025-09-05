// src/logic.ts
// Zentrale Logik: Produkt holen (OpenFoodFacts), Nährwerte/Angaben extrahieren,
// Zuckersorten erkennen, Grenzwerte prüfen und verständliche Gründe zurückgeben.

export type Nutrition = {
  kcal?: number;
  fat?: number;     // g / 100 g
  sugars?: number;  // g / 100 g
  salt?: number;    // g / 100 g
};

export type ProductEval = {
  success: boolean;
  suitable: boolean;
  productName?: string;
  brand?: string;
  category?: string;
  categoryPath?: string[];
  description?: string;
  imageUrl?: string;

  nutrition: Nutrition;

  // Analyse/Begründungen
  reasons: string[];                 // Menschlich lesbare Gründe (Deutsch)
  exceeded: Partial<Record<"fat" | "sugars" | "salt", number>>; // tatsächlich gemessene Werte
  limits: Partial<Record<"fat" | "sugars" | "salt", number>>;    // verwendete Grenzwerte
  sugarsFound: string[];             // erkannte Zuckerarten/-synonyme in Zutaten
  ingredientsText?: string;          // Rohtext Zutaten
};

// ==== Grenzwerte (g/100 g) ====
// Hinweis: Diese Schwellen sind pragmatisch gewählt (leicht „streng“).
// Falls du die WHO-NPM-2023-Matrix noch granularer abbilden willst (je nach Kategorie),
// können wir das später verfeinern. Für jetzt: einfache, konsistente Regeln.
const LIMITS = {
  fat: 17.5,     // „viel Fett“ ab ~17.5 g / 100 g
  sugars: 10,    // „viel Zucker“ ab 10 g / 100 g
  salt: 1.5,     // „viel Salz“ ab 1.5 g / 100 g
} as const;

// Häufige Zuckerbegriffe/Synonyme – gern erweiterbar
const SUGAR_TERMS = [
  "zucker", "saccharose", "glukose", "dextrose", "fruktose", "laktose", "maltose",
  "glukosesirup", "glucose-fructose-sirup", "fruktosesirup", "invertzucker",
  "kandiszucker", "rohrzucker", "rohzucker", "traubenzucker", "malzsirup", "honig",
  "agavendicksaft", "kokosblütenzucker", "sirup"
];

function normalizeStr(s?: string) {
  return (s || "").toLowerCase();
}

function detectSugars(ingredients?: string): string[] {
  const hay = normalizeStr(ingredients);
  if (!hay) return [];
  const found = new Set<string>();
  for (const term of SUGAR_TERMS) {
    if (hay.includes(term)) found.add(term);
  }
  return Array.from(found).sort();
}

function numOrUndef(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function extractNutrition(product: any): Nutrition {
  const n = product?.nutriments ?? {};
  // OpenFoodFacts Felder (häufige Varianten)
  const kcal =
    numOrUndef(n["energy-kcal_100g"]) ??
    numOrUndef(n["energy-kcal_value"]) ??
    numOrUndef(n["energy_100g"]); // Fallback (kJ) – wir lassen als Zahl stehen, i.d.R. kommt kcal separat

  const fat = numOrUndef(n["fat_100g"]);
  const sugars = numOrUndef(n["sugars_100g"]);
  const salt = numOrUndef(n["salt_100g"]);

  return { kcal, fat, sugars, salt };
}

export async function fetchProductByBarcode(barcode: string): Promise<ProductEval> {
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const product = data?.product;
    if (!product) {
      return {
        success: false,
        suitable: false,
        nutrition: {},
        reasons: ["Produkt nicht gefunden."],
        exceeded: {},
        limits: {},
        sugarsFound: [],
      };
    }

    const nutrition = extractNutrition(product);
    const productName = product.product_name || product.generic_name || undefined;
    const brand = (product.brands || "").split(",")[0]?.trim() || undefined;

    const categoriesTags: string[] = product.categories_tags || [];
    const categoryPath = categoriesTags.map((t) => t.replace(/^.*?:/, "").replace(/-/g, " "));
    const category = categoryPath[categoryPath.length - 1];

    const description =
      product.generic_name_de ||
      product.product_name_de ||
      product.generic_name ||
      undefined;

    const imageUrl =
      product.image_front_url ||
      product.image_url ||
      (Array.isArray(product.images) ? product.images[0] : undefined);

    const ingredientsText =
      product.ingredients_text_de ||
      product.ingredients_text ||
      undefined;

    const sugarsFound = detectSugars(ingredientsText);

    const evaluation = evaluateProduct({ nutrition, sugarsFound });

    return {
      success: true,
      suitable: evaluation.suitable,
      productName,
      brand,
      category,
      categoryPath,
      description,
      imageUrl,

      nutrition,

      reasons: evaluation.reasons,
      exceeded: evaluation.exceeded,
      limits: evaluation.limits,
      sugarsFound,
      ingredientsText,
    };
  } catch (e: any) {
    return {
      success: false,
      suitable: false,
      nutrition: {},
      reasons: ["Fehler beim Laden der Produktdaten."],
      exceeded: {},
      limits: {},
      sugarsFound: [],
    };
  }
}

// Bewertet anhand LIMITS und gefundener Zuckerbegriffe.
// Rückgabe liefert lesbare Gründe + Rohdaten, damit der Screen exakt anzeigen kann, WAS überschritten ist.
export function evaluateProduct(input: {
  nutrition: Nutrition;
  sugarsFound: string[];
}): {
  suitable: boolean;
  reasons: string[];
  exceeded: Partial<Record<"fat" | "sugars" | "salt", number>>;
  limits: Partial<Record<"fat" | "sugars" | "salt", number>>;
} {
  const { nutrition, sugarsFound } = input;
  const reasons: string[] = [];
  const exceeded: Partial<Record<"fat" | "sugars" | "salt", number>> = {};
  const limits: Partial<Record<"fat" | "sugars" | "salt", number>> = { ...LIMITS };

  // Fett
  if (typeof nutrition.fat === "number" && nutrition.fat > LIMITS.fat) {
    exceeded.fat = nutrition.fat;
    reasons.push(`Fett zu hoch: ${nutrition.fat.toFixed(1)} g/100 g (Grenzwert ${LIMITS.fat} g).`);
  }

  // Zucker
  if (typeof nutrition.sugars === "number" && nutrition.sugars > LIMITS.sugars) {
    exceeded.sugars = nutrition.sugars;
    const base = `Zucker zu hoch: ${nutrition.sugars.toFixed(1)} g/100 g (Grenzwert ${LIMITS.sugars} g).`;
    if (sugarsFound.length > 0) {
      reasons.push(`${base} Enthält: ${sugarsFound.join(", ")}.`);
    } else {
      reasons.push(base);
    }
  } else if (sugarsFound.length > 0) {
    reasons.push(`Enthält zugesetzten Zucker/Zuckersirup: ${sugarsFound.join(", ")}.`);
  }

  // Salz
  if (typeof nutrition.salt === "number" && nutrition.salt > LIMITS.salt) {
    exceeded.salt = nutrition.salt;
    reasons.push(`Salz zu hoch: ${nutrition.salt.toFixed(1)} g/100 g (Grenzwert ${LIMITS.salt} g).`);
  }

  // Geeignet, wenn keine Gründe (Überschreitungen/Zusatz-Zucker) vorhanden
  const suitable = reasons.length === 0;

  if (suitable) {
    reasons.push("Alle geprüften Grenzwerte eingehalten, kein zugesetzter Zucker erkannt.");
  }

  return { suitable, reasons, exceeded, limits };
}