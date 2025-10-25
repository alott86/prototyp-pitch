// src/logic.ts

import {
  INFANT_ADDED_SUGAR_TERMS,
  INFANT_MIN_ENERGY_KCAL_PER_100G,
  INFANT_MIN_ENERGY_KCAL_PER_100G_CEREAL,
  INFANT_SODIUM_MAX_MG_PER_100KCAL,
  INFANT_SODIUM_MAX_MG_PER_100KCAL_CHEESE,
  INFANT_SUGAR_HIGH_FLAG_PERCENT_ENERGY,
  containsCheeseHint,
} from "./nppmInfant";

export type Nutrition = {
  kcal?: number;
  fat?: number;
  sugars?: number;
  salt?: number;
};

type AgeGroupKey = "infant" | "older";

type AgeGroupEvaluation = {
  suitable: boolean;
  reasons: string[];
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

    return evaluateManualProduct({
      productName: productName ?? undefined,
      brand: brand ?? undefined,
      imageUrl: imageUrl ?? undefined,
      category: category ?? undefined,
      categoryPath: catPath ?? undefined,
      nutrition,
      description: description ?? undefined,
      ingredientsText: ingredientsText ?? undefined,
      sugarsFound,
    });
  } catch (err) {
    console.warn("fetchProductByBarcode error:", err);
    return null;
  }
}

type AgeRules = {
  sugarGood: number;
  sugarWarn: number;
  saltWarn: number;
};

const AGE_RULES_OLDER: AgeRules = { sugarGood: 5, sugarWarn: 15, saltWarn: 1.2 };

type EvaluationContext = {
  nutrition: Nutrition;
  energyKcalPer100g?: number;
  sugarsFound: string[];
  productName?: string | null;
  ingredientsText?: string | null;
};

type PregnancyContext = {
  nutrition: Nutrition;
  productName?: string | null;
  ingredientsText?: string | null;
  category?: string | null;
  categoryPath?: string[] | null;
};

function buildAgeEvaluations(ctx: EvaluationContext): Record<AgeGroupKey, AgeGroupEvaluation> {
  return {
    infant: evaluateInfant(ctx),
    older: evaluateOlder(ctx.nutrition),
  };
}

function evaluateOlder(nutrition: Nutrition): AgeGroupEvaluation {
  const reasons: string[] = [];
  let suitable = true;

  if (isNumber(nutrition.sugars)) {
    const sugar = nutrition.sugars as number;
    if (sugar <= AGE_RULES_OLDER.sugarGood) {
      reasons.push(`Zuckergehalt ≤ ${formatThreshold(AGE_RULES_OLDER.sugarGood)} g / 100 g`);
    } else if (sugar > AGE_RULES_OLDER.sugarWarn) {
      suitable = false;
      reasons.push(`Zuckergehalt > ${formatThreshold(AGE_RULES_OLDER.sugarWarn)} g / 100 g`);
    } else {
      reasons.push("Moderater Zuckergehalt");
    }
  } else {
    reasons.push("Kein Zuckergehalt angegeben");
  }

  if (isNumber(nutrition.salt)) {
    const salt = nutrition.salt as number;
    if (salt > AGE_RULES_OLDER.saltWarn) {
      suitable = false;
      reasons.push(`Hoher Salzgehalt (> ${formatThreshold(AGE_RULES_OLDER.saltWarn)} g / 100 g)`);
    }
  }

  return { suitable, reasons };
}

function evaluateInfant(ctx: EvaluationContext): AgeGroupEvaluation {
  const { nutrition, energyKcalPer100g, productName, ingredientsText } = ctx;
  const failureReasons: string[] = [];
  let suitable = true;

  if (isNumber(energyKcalPer100g)) {
    const energy = energyKcalPer100g as number;
    const minEnergy = isLikelyDryCereal(productName, ingredientsText)
      ? INFANT_MIN_ENERGY_KCAL_PER_100G_CEREAL
      : INFANT_MIN_ENERGY_KCAL_PER_100G;
    if (energy >= minEnergy) {
      // ausreichend hohe Energiedichte → kein Hinweis nötig
    } else {
      suitable = false;
      failureReasons.push(
        `Energiedichte < ${formatNumber(minEnergy)} kcal / 100 g (WHO NPPM fordert ausreichende Energie für 6–36 Monate)`
      );
    }
  }

  if (isNumber(nutrition.sugars) && isNumber(energyKcalPer100g) && (energyKcalPer100g as number) > 0) {
    const sugar = nutrition.sugars as number;
    const energy = energyKcalPer100g as number;
    const sugarEnergyPct = (sugar * 4) / energy * 100;

    if (sugarEnergyPct >= INFANT_SUGAR_HIGH_FLAG_PERCENT_ENERGY) {
      suitable = false;
      failureReasons.push(
        `≈ ${formatPercent(sugarEnergyPct)} der Energie stammen aus Zucker (WHO-NPPM fordert High-sugar-Kennzeichnung ab 30 %)`
      );
    }
  }

  if (isNumber(nutrition.salt) && isNumber(energyKcalPer100g) && (energyKcalPer100g as number) > 0) {
    const energy = energyKcalPer100g as number;
    const salt = nutrition.salt as number;
    const sodiumMgPer100g = salt * 0.4 * 1000;
    const sodiumMgPer100kcal = (sodiumMgPer100g / energy) * 100;
    const cheese = containsCheeseHint(productName ?? undefined, ingredientsText ?? undefined);
    const sodiumLimit = cheese
      ? INFANT_SODIUM_MAX_MG_PER_100KCAL_CHEESE
      : INFANT_SODIUM_MAX_MG_PER_100KCAL;

    if (sodiumMgPer100kcal > sodiumLimit) {
      suitable = false;
      failureReasons.push(
        `Natrium ≈ ${formatNumber(sodiumMgPer100kcal)} mg / 100 kcal (Grenzwert laut WHO NPPM: ≤ ${formatNumber(sodiumLimit)} mg)`
      );
    }
  }

  if (ingredientsText) {
    const addedSugarHit = INFANT_ADDED_SUGAR_TERMS.find((term) =>
      ingredientsText.toLowerCase().includes(term)
    );
    if (addedSugarHit) {
      suitable = false;
      failureReasons.push(
        `Zutatenliste enthält '${cap(addedSugarHit)}' → WHO NPPM untersagt zugesetzte freie Zucker bei 6–36 Monaten`
      );
    }
  }

  return { suitable, reasons: failureReasons };
}

type ManualProductInput = {
  productName?: string;
  brand?: string;
  category?: string;
  categoryPath?: string[];
  imageUrl?: string;
  nutrition: Nutrition;
  description?: string;
  ingredientsText?: string;
  sugarsFound?: string[];
};

export function evaluateManualProduct(input: ManualProductInput): ProductEval {
  const {
    productName,
    brand,
    category,
    categoryPath,
    imageUrl,
    nutrition,
    description,
    ingredientsText,
  } = input;

  const sugarsFound = input.sugarsFound ?? extractSugarSynonyms(ingredientsText ?? "");

  const pregnancy = evaluateForPregnancy({
    nutrition,
    productName,
    ingredientsText,
    category,
    categoryPath,
  });

  return {
    productName: productName ?? null,
    brand: brand ?? null,
    imageUrl: imageUrl ?? null,
    category: category ?? null,
    categoryPath: categoryPath ?? null,
    nutrition,
    suitable: pregnancy.suitable,
    reasons: pregnancy.reasons,
    description: description ?? null,
    ingredientsText: ingredientsText ?? null,
    sugarsFound,
  };
}

function evaluateForPregnancy(ctx: PregnancyContext): { suitable: boolean; reasons: string[] } {
  // Build a single lowercased text to search in (name + ingredients + categories)
  const reasons: string[] = [];
  const { productName, ingredientsText, category, categoryPath } = ctx;
  const lc = (
    [productName, ingredientsText, category, ...(categoryPath ?? [])]
      .filter(Boolean)
      .join(" \u2022 ")
      .toLowerCase()
  );

  const match = (re: RegExp) => re.test(lc);

  // Preparation/processing markers (positive/safe indicators)
  const isPasteurized = match(/pasteuri[sz]iert|uht|ultra\s*hoch(erhitz|erhitz)t|esl|sterili[sz]iert|heat[- ]treated|fully\s*cooked/);
  const isCooked = match(/durchgegart|voll( )?ständig\s*gegart|gekocht|gebraten|gegrillt|gebacken|erhitzt|erw(a|ä)rmt|simmered|boiled|baked|fried|grilled|fully\s*cooked/);
  const isHotSmoked = match(/hei(ß|ss)[- ]ger(a|ä)uchert|hot[- ]smoked/);
  const isCannedOrSterile = match(/konserve|dose|tinned|canned|sterili[sz]iert|autoklaviert/);
  const caffeineFree = match(/entkoffeiniert|koffeinfrei|decaf/);
  const alcoholFree = match(/alkoholfrei|alcohol[- ]?free|0\.?0\s*%/);

  // 1) Alcohol (unless explicitly alcohol-free)
  if (!alcoholFree) {
    const alcoholTerms = [
      /\balcohol\b|\bethanol\b/, /\bwein\b|\bwine\b/, /\bbier\b|\bbeer\b/, /\brum\b/, /\bvodka\b/,
      /\bwhisk(e)?y\b/, /\blik[öo]r\b|\bliqueur\b/, /\bcider\b/, /\bschnaps\b/, /\bsake\b/,
      /\bprosecco\b|\bchampagne\b/, /\bport\b|\bsherry\b/
    ];
    if (alcoholTerms.some(match) || match(/alkoholisch|alcoholic\s+beverage/)) {
      reasons.push("Enthält Alkohol (während der Schwangerschaft nicht empfohlen)");
    }
  }

  // 2) Energy drinks / high caffeine (unless explicitly caffeine-free)
  if (!caffeineFree && match(/energy\s*drink|energydrink|guarana|taurine|taurin|high\s*caffeine|\bkoffein\b/)) {
    reasons.push("Energy-Drink/hoher Koffeingehalt nicht empfohlen");
  }

  // 3) Unpasteurized dairy
  const mentionsRawMilk = match(/roh(-)?milch|lait\s*cru|raw\s*milk|unpasteurisiert|unpasteurized/);
  if (mentionsRawMilk && !isPasteurized) {
    reasons.push("Unpasteurisierte Milch/Rohmilch (Listeriose-Risiko)");
  }

  // 4) Soft/blue cheeses – allow if pasteurized or clearly cooked
  const softBlueCheese = match(/\bbrie\b|\bcamembert\b|weichk(a|ä)se|schimmelk(a|ä)se|blue\s*cheese|gorgonzola|roquefort|bleu/);
  if (softBlueCheese && !(isPasteurized || isCooked)) {
    reasons.push("Weich-/Blauschimmelkäse (Listeriose-Risiko)");
  }

  // 5) Raw/cured meats & ready-to-eat deli meats (safe if label signals cooked/erhitz)
  const rawCuredMeat = match(/salami|mettwurst|teewurst|prosciutto|serrano|parma\s*schinken|schinken\s*(roh|luftgetrocknet)|carpaccio|tartar(e)?/);
  if (rawCuredMeat && !(isCooked || isCannedOrSterile)) {
    reasons.push("Rohwurst/ungegartes Aufschnitt-Fleisch (Listeriose/Toxoplasmose-Risiko)");
  }

  // 6) Raw/cold-smoked fish, sushi etc. (safe if hot-smoked/canned or cooked)
  const rawOrSmokedFish = match(/r(ä|a)ucher(lachs|fisch)|cold[- ]smoked|smoked\s*salmon|smoked\s*fish|sushi|sashimi|gravl(ax|aks)/);
  if (rawOrSmokedFish && !(isHotSmoked || isCooked || isCannedOrSterile)) {
    reasons.push("Roher/geräucherter Fisch (Listeriose/Parasiten-Risiko)");
  }

  // 7) High‑mercury fish (always avoid)
  if (match(/swordfish|schwertfisch|marlin|\bhai\b|\bshark\b|king\s*mackerel|tilefish|gro(ß|ss)augen(-)?thun(fisch)?|bigeye\s*tuna/)) {
    reasons.push("Fisch mit hohem Quecksilbergehalt");
  }

  // 8) Liver products (regardless of cooking)
  if (match(/\bleber\b|\bliver\b|foie\s*gras|leberwurst|leberpastete|cod\s*liver\s*oil/)) {
    reasons.push("Leber/Leberprodukte (hoher Vitamin-A-Gehalt)");
  }

  // 9) Raw eggs (safe if pasteurised egg or clearly fully cooked)
  const mentionsRawEgg = match(/ro(h|he)\s*ei(er)?|raw\s*egg(s)?|ungekochte\s*ei(er)?/);
  const pasteurizedEgg = isPasteurized || match(/pasteuri[sz]ierte?\s*ei(er)?|egg\s*powder|eipulver|albumen\s*powder/);
  if (mentionsRawEgg && !(pasteurizedEgg || isCooked)) {
    reasons.push("Rohe/ungekochte Eier (Salmonellen-Risiko)");
  }

  // 10) Raw sprouts (safe if canned/sterilised or cooked)
  if (match(/sprossen|keimlinge|sprouts|alfalfa/) && !(isCooked || isCannedOrSterile)) {
    reasons.push("Rohe Sprossen/Keimlinge (Keimrisiko)");
  }

  // 11) High glycyrrhizin (licorice)
  if (match(/lakritz|salmiak|glycyrrhizin|glycyrrhizins(ä|a)ure|ammoniumchlorid/)) {
    reasons.push("Lakritz/Salmiak (hoher Glycyrrhizin-Gehalt)");
  }

  const suitable = reasons.length === 0;
  return { suitable, reasons };
}

function formatThreshold(value: number): string {
  return Number.isInteger(value) ? `${value}` : value.toString().replace(".", ",");
}

function formatNumber(value: number, digits = 1): string {
  const scaled = Number.parseFloat(value.toFixed(digits));
  return scaled.toString().replace(".", ",");
}

function formatPercent(value: number, digits = 0): string {
  return `${formatNumber(value, digits)} %`;
}

function isLikelyDryCereal(name?: string | null, ingredients?: string | null): boolean {
  const text = `${name ?? ""} ${ingredients ?? ""}`.toLowerCase();
  return /cereal|porridge|gr(i|ie)s|getreide|m(ü|u)sli|hafer|oat|baby rice|milchbrei|instantbrei|pasta/.test(text);
}

/* ----------------- Helfer ----------------- */
function num(v: any): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
function isNumber(v: any): v is number {
  return typeof v === "number" && Number.isFinite(v);
}
export function extractSugarSynonyms(text: string): string[] {
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
