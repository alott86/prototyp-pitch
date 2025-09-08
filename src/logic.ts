// src/logic.ts

export type Nutrition = {
  kcal?: number;
  fat?: number;
  sugars?: number;
  salt?: number;
};

export type ProductEval = {
  productName?: string | null;
  brand?: string | null;
  imageUrl?: string | null;
  category?: string | null;
  categoryPath?: string[] | null;
  nutrition: Nutrition;
  suitable: boolean;
  reasons: string[];
  description?: string | null;
  ingredientsText?: string | null;
  sugarsFound: string[];
};

/**
 * Holt ein Produkt per Barcode von OpenFoodFacts.
 * Gibt entweder ein ProductEval zurück oder null (bei Nichtfund/Fehler).
 * Wirft KEINE Exceptions nach außen.
 */
export async function fetchProductByBarcode(barcode: string): Promise<ProductEval | null> {
  const code = (barcode || "").trim();
  if (!code) return null;

  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`;

    // Manche OFF-Instanzen reagieren sensibler ohne User-Agent
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        // Trage gern deine echte Kontaktadresse ein
        "User-Agent": "NuMumApp/1.0 (contact: support@numum.example)",
      },
    });

    if (!res.ok) {
      // HTTP-Fehler wie 403/429/500 → behandle als „nicht gefunden“
      console.warn("OFF HTTP error:", res.status, res.statusText);
      return null;
    }

    let json: any = null;
    try {
      json = await res.json();
    } catch (e) {
      console.warn("OFF JSON parse error:", e);
      return null;
    }

    if (!json || json.status !== 1 || !json.product) {
      return null;
    }

    const p = json.product || {};

    const productName: string | null =
      p.product_name_de || p.product_name || p.generic_name_de || p.generic_name || null;

    const brand: string | null =
      (typeof p.brands === "string" && p.brands.length > 0
        ? p.brands.split(",")[0].trim()
        : null) || null;

    const imageUrl: string | null = p.image_front_url || p.image_url || null;

    const catPath: string[] | null =
      Array.isArray(p.categories_hierarchy) && p.categories_hierarchy.length
        ? (p.categories_hierarchy as string[]).map((s) =>
            s.replace(/^[a-z]{2}:/, "")
          )
        : null;

    const category: string | null =
      (catPath && catPath.length ? catPath[catPath.length - 1] : null) ||
      (typeof p.categories === "string" && p.categories.length
        ? p.categories.split(",").pop()?.trim() ?? null
        : null);

    const nutr = p.nutriments || {};
    const nutrition: Nutrition = {
      kcal: num(nutr["energy-kcal_100g"] ?? nutr["energy-kcal_serving"]),
      fat: num(nutr["fat_100g"] ?? nutr["fat_serving"]),
      sugars: num(nutr["sugars_100g"] ?? nutr["sugars_serving"]),
      salt: num(nutr["salt_100g"] ?? nutr["salt_serving"]),
    };

    const ingredientsText: string | null = p.ingredients_text_de || p.ingredients_text || null;
    const description: string | null = p.generic_name_de || p.generic_name || null;
    const sugarsFound = extractSugarSynonyms(ingredientsText || "");

    // simple Platzhalter-Regeln – kannst du jederzeit anpassen
    const reasons: string[] = [];
    let suitable = true;

    if (isNumber(nutrition.sugars)) {
      if (nutrition.sugars! <= 5) {
        reasons.push("Zuckergehalt ≤ 5 g / 100 g");
      } else if (nutrition.sugars! > 15) {
        suitable = false;
        reasons.push("Zuckergehalt > 15 g / 100 g");
      } else {
        reasons.push("Moderater Zuckergehalt");
      }
    } else {
      reasons.push("Kein Zuckergehalt angegeben");
    }

    if (isNumber(nutrition.salt) && nutrition.salt! > 1.2) {
      suitable = false;
      reasons.push("Hoher Salzgehalt (> 1,2 g / 100 g)");
    }

    const evalObj: ProductEval = {
      productName,
      brand,
      imageUrl,
      category,
      categoryPath: catPath,
      nutrition,
      suitable,
      reasons,
      description,
      ingredientsText,
      sugarsFound,
    };

    return evalObj;
  } catch (err) {
    console.warn("fetchProductByBarcode error:", err);
    return null;
  }
}

/* ----------------- Helfer ----------------- */
function num(v: any): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
function isNumber(v: any): v is number {
  return typeof v === "number" && Number.isFinite(v);
}
function extractSugarSynonyms(text: string): string[] {
  if (!text) return [];
  const lowered = text.toLowerCase();
  const terms = [
    "zucker","glukose","glucose","fruktose","fructose","saccharose",
    "dextrose","maltose","laktose","sirup","honig","agavendicksaft",
    "ahornsirup","invertzucker","glukosesirup","fruktosesirup"
  ];
  const found = new Set<string>();
  for (const t of terms) if (lowered.includes(t)) found.add(cap(t));
  return Array.from(found);
}
function cap(s: string){ return s ? s[0].toUpperCase()+s.slice(1) : s; }