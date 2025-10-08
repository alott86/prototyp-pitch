// src/manualCatalog.ts
// Kategoriestruktur für die manuelle Produktsuche (basierend auf WHO-Kategorien)

import type { Nutrition } from "./logic";

export type ManualProduct = {
  id: string;
  name: string;
  brand?: string;
  nutrition: Nutrition;
  description?: string;
  ingredients?: string;
  imageUrl?: string;
};

export type ManualCategory = {
  id: string;
  title: string;
  icon: string;
  children?: ManualCategory[];
  products?: ManualProduct[];
};

const createProduct = (
  id: string,
  name: string,
  nutrition: Nutrition,
  options: Partial<Omit<ManualProduct, "id" | "name" | "nutrition">> = {}
): ManualProduct => ({
  id,
  name,
  nutrition,
  ...options,
});

const catalog: ManualCategory[] = [
  {
    id: "aufstriche",
    title: "Aufstriche & Süßcremes",
    icon: "🍫",
    products: [
      createProduct(
        "haselnusscreme",
        "Haselnuss-Schoko-Creme",
        { kcal: 550, sugars: 57, fat: 34, salt: 0.1 },
        {
          brand: "Sweet&Spread",
          ingredients: "Zucker, Palmöl, Haselnüsse (13 %), fettarmer Kakao, Magermilchpulver",
        }
      ),
      createProduct(
        "bluetenhonig",
        "Blütenhonig flüssig",
        { kcal: 304, sugars: 82, fat: 0, salt: 0.02 },
        {
          brand: "Imkerei Sonnental",
          ingredients: "100 % Honig",
        }
      ),
    ],
  },
  {
    id: "backwaren-suess",
    title: "Backwaren süß",
    icon: "🧁",
    products: [
      createProduct(
        "butterkeks",
        "Butterkeks klassisch",
        { kcal: 470, sugars: 21, fat: 17, salt: 0.6 },
        {
          brand: "Kekswerk",
          ingredients: "Weizenmehl, Zucker, Butter (12 %), Eier, Backtriebmittel",
        }
      ),
      createProduct(
        "marmorkuchen",
        "Marmorkuchen",
        { kcal: 380, sugars: 28, fat: 16, salt: 0.5 },
        {
          brand: "Bäckerei Sonntag",
          ingredients: "Weizenmehl, Zucker, Eier, Butter, Kakaopulver",
        }
      ),
    ],
  },
  {
    id: "brot-herzhaft",
    title: "Brot & herzhaftes Gebäck",
    icon: "🥖",
    products: [
      createProduct(
        "vollkornbrot",
        "Roggenvollkornbrot",
        { kcal: 210, sugars: 3.5, fat: 1.6, salt: 1.2 },
        {
          brand: "Landkruste",
          ingredients: "Roggenvollkornmehl, Wasser, Sauerteig, Salz",
        }
      ),
      createProduct(
        "laugenbrezel",
        "Laugenbrezel",
        { kcal: 290, sugars: 3, fat: 4, salt: 2.5 },
        {
          brand: "Brezelhaus",
          ingredients: "Weizenmehl, Wasser, Hefe, Salz, Backnatron",
        }
      ),
    ],
  },
  {
    id: "eis",
    title: "Eis & Tiefkühl-Süßes",
    icon: "🍨",
    products: [
      createProduct(
        "vanilleeis",
        "Vanilleeis",
        { kcal: 210, sugars: 22, fat: 9, salt: 0.2 },
        {
          brand: "Eisatelier",
          ingredients: "Milch, Sahne, Zucker, Eigelb, Vanilleextrakt",
        }
      ),
      createProduct(
        "fruchteis",
        "Fruchteis Erdbeere",
        { kcal: 110, sugars: 24, fat: 0.2, salt: 0.05 },
        {
          brand: "FrozenJoy",
          ingredients: "Wasser, Erdbeeren (35 %), Zucker, Zitronensaft",
        }
      ),
    ],
  },
  {
    id: "fertiggerichte",
    title: "Fertiggerichte",
    icon: "🍽️",
    children: [
      {
        id: "fertig-pizza",
        title: "Pizza & Snacks",
        icon: "🍕",
        products: [
          createProduct(
            "pizza-salami",
            "TK-Pizza Salami",
            { kcal: 260, sugars: 3.2, fat: 11, salt: 1.8 },
            {
              brand: "Ofenliebe",
              ingredients: "Weizenmehl, Tomatensauce, Käse, Salami, Pflanzenöl",
            }
          ),
          createProduct(
            "chicken-nuggets",
            "Chicken Nuggets",
            { kcal: 250, sugars: 1.5, fat: 13, salt: 1.4 },
            {
              brand: "SnackQuick",
              ingredients: "Hähnchenfleisch (60 %), Panade, Pflanzenöl, Salz",
            }
          ),
        ],
      },
      {
        id: "fertig-suppe",
        title: "Suppen & Eintöpfe",
        icon: "🥣",
        products: [
          createProduct(
            "linsensuppe",
            "Linsensuppe im Glas",
            { kcal: 70, sugars: 2.3, fat: 1.2, salt: 1.0 },
            {
              brand: "Suppenmeister",
              ingredients: "Wasser, Linsen (25 %), Karotten, Sellerie, Gewürze, Salz",
            }
          ),
          createProduct(
            "chili",
            "Chili con Carne",
            { kcal: 120, sugars: 4.5, fat: 4.2, salt: 1.4 },
            {
              brand: "Feuerkessel",
              ingredients: "Rindfleisch (18 %), Kidneybohnen, Tomaten, Mais, Gewürze, Salz",
            }
          ),
        ],
      },
    ],
  },
  {
    id: "fette",
    title: "Fette & Öle",
    icon: "🧈",
    products: [
      createProduct(
        "butter",
        "Süßrahmbutter",
        { kcal: 742, sugars: 0.6, fat: 82, salt: 0.02 },
        {
          brand: "Alpenmilch",
          ingredients: "Butter",
        }
      ),
      createProduct(
        "rapsoel",
        "Rapsöl kaltgepresst",
        { kcal: 884, sugars: 0, fat: 100, salt: 0 },
        {
          brand: "Ölmühle Nord",
          ingredients: "100 % Rapsöl",
        }
      ),
    ],
  },
  {
    id: "fleisch-frisch",
    title: "Fleisch & Fisch (frisch)",
    icon: "🥩",
    products: [
      createProduct(
        "haehnchenfilet",
        "Hähnchenbrustfilet",
        { kcal: 110, sugars: 0, fat: 2, salt: 0.2 },
        {
          brand: "Geflügelhof",
          ingredients: "100 % Hähnchenfleisch",
        }
      ),
      createProduct(
        "lachsfilet",
        "Lachsfilet",
        { kcal: 208, sugars: 0, fat: 13, salt: 0.1 },
        {
          brand: "Nordmeer",
          ingredients: "Lachs",
        }
      ),
    ],
  },
  {
    id: "fleisch-verarbeitet",
    title: "Fleisch & Fisch (verarbeitet)",
    icon: "🥪",
    products: [
      createProduct(
        "pizzasalami",
        "Pizzasalami",
        { kcal: 340, sugars: 1.2, fat: 28, salt: 4.2 },
        {
          brand: "Wurstspezial",
          ingredients: "Schweinefleisch, Rindfleisch, Speck, Salz, Gewürze",
        }
      ),
      createProduct(
        "fischstaebchen",
        "Fischstäbchen",
        { kcal: 220, sugars: 0.9, fat: 11, salt: 1.1 },
        {
          brand: "Meeresbiss",
          ingredients: "Polar-Dorsch (63 %), Panade, Pflanzenöl, Salz",
        }
      ),
    ],
  },
  {
    id: "fruehstueckscerealien",
    title: "Frühstückscerealien",
    icon: "🥣",
    products: [
      createProduct(
        "haferflocken",
        "Feine Haferflocken",
        { kcal: 370, sugars: 1.1, fat: 7.1, salt: 0.02 },
        {
          brand: "Kornquelle",
          ingredients: "Haferflocken",
        }
      ),
      createProduct(
        "choco-flakes",
        "Schoko-Flakes",
        { kcal: 410, sugars: 30, fat: 5.6, salt: 0.9 },
        {
          brand: "CrunchStar",
          ingredients: "Maisgrieß, Zucker, Kakao, Salz, Aroma",
        }
      ),
    ],
  },
  {
    id: "getraenke",
    title: "Getränke",
    icon: "🥤",
    children: [
      {
        id: "getraenke-saefte",
        title: "Frucht- & Gemüsesäfte",
        icon: "🍎",
        products: [
          createProduct(
            "apfelsaft",
            "Apfelsaft 100 %",
            { kcal: 46, sugars: 10.5, fat: 0.2, salt: 0.02 },
            {
              brand: "Saftwerk",
              ingredients: "100 % Apfelsaft",
            }
          ),
          createProduct(
            "smoothie",
            "Smoothie Mango-Maracuja",
            { kcal: 60, sugars: 12.8, fat: 0.5, salt: 0.03 },
            {
              brand: "Fruchtmix",
              ingredients: "Mango (40 %), Maracuja (20 %), Apfel, Banane",
            }
          ),
        ],
      },
      {
        id: "getraenke-milch",
        title: "Milchgetränke",
        icon: "🥛",
        products: [
          createProduct(
            "vollmilch",
            "Vollmilch 3,5 %",
            { kcal: 64, sugars: 4.6, fat: 3.5, salt: 0.1 },
            {
              brand: "Hofquelle",
              ingredients: "Milch",
            }
          ),
          createProduct(
            "kakaomilch",
            "Schokoladenmilch",
            { kcal: 82, sugars: 11.5, fat: 2.5, salt: 0.15 },
            {
              brand: "Milchbar",
              ingredients: "Milch, Zucker, Kakao, Stabilisator",
            }
          ),
        ],
      },
      {
        id: "getraenke-pflanzlich",
        title: "Pflanzendrinks",
        icon: "🌱",
        products: [
          createProduct(
            "haferdrink",
            "Haferdrink",
            { kcal: 45, sugars: 3.5, fat: 1.5, salt: 0.08 },
            {
              brand: "GreenCup",
              ingredients: "Wasser, Hafer (10 %), Sonnenblumenöl, Salz",
            }
          ),
          createProduct(
            "sojadrink",
            "Sojadrink Calcium",
            { kcal: 38, sugars: 2.0, fat: 1.9, salt: 0.14 },
            {
              brand: "SoyLife",
              ingredients: "Wasser, Sojabohnen (7 %), Calciumcarbonat, Salz",
            }
          ),
        ],
      },
      {
        id: "getraenke-energie",
        title: "Energiegetränke",
        icon: "⚡",
        products: [
          createProduct(
            "energy",
            "Energy Drink Classic",
            { kcal: 45, sugars: 11, fat: 0, salt: 0.2 },
            {
              brand: "PowerBoost",
              ingredients: "Wasser, Zucker, Glukose, Kohlensäure, Koffein, Taurin",
            }
          ),
        ],
      },
      {
        id: "getraenke-softdrinks",
        title: "Erfrischungsgetränke",
        icon: "🥤",
        products: [
          createProduct(
            "cola",
            "Cola mit Zucker",
            { kcal: 42, sugars: 10.6, fat: 0, salt: 0.02 },
            {
              brand: "FizzUp",
              ingredients: "Wasser, Zucker, Kohlensäure, Farbstoff, Aroma",
            }
          ),
          createProduct(
            "mineralwasser",
            "Mineralwasser still",
            { kcal: 0, sugars: 0, fat: 0, salt: 0.02 },
            {
              brand: "Quellklar",
              ingredients: "Natürliches Mineralwasser",
            }
          ),
        ],
      },
    ],
  },
  {
    id: "joghurt-creme",
    title: "Joghurt & Cremes",
    icon: "🍶",
    products: [
      createProduct(
        "naturjoghurt",
        "Naturjoghurt 3,8 %",
        { kcal: 63, sugars: 4.5, fat: 3.8, salt: 0.12 },
        {
          brand: "Milchhof",
          ingredients: "Milch, Joghurtkulturen",
        }
      ),
      createProduct(
        "fruchtjoghurt",
        "Fruchtjoghurt Erdbeere",
        { kcal: 110, sugars: 15.5, fat: 3.2, salt: 0.15 },
        {
          brand: "Fruchtglück",
          ingredients: "Joghurt, Erdbeeren (8 %), Zucker, Erdbeeraroma",
        }
      ),
    ],
  },
  {
    id: "kaese",
    title: "Käse",
    icon: "🧀",
    products: [
      createProduct(
        "emmentaler",
        "Emmentaler 45 % F.i.Tr",
        { kcal: 380, sugars: 0, fat: 28, salt: 0.7 },
        {
          brand: "Alpenkrone",
          ingredients: "Kuhmilch, Salz, Lab, Milchsäurekulturen",
        }
      ),
      createProduct(
        "frischkaese",
        "Frischkäse natur",
        { kcal: 250, sugars: 3.5, fat: 23, salt: 1.0 },
        {
          brand: "Cremefein",
          ingredients: "Pasteurisierte Milch, Sahne, Salz",
        }
      ),
    ],
  },
  {
    id: "obst-gemuese-frisch",
    title: "Obst & Gemüse (frisch)",
    icon: "🥦",
    products: [
      createProduct(
        "apfel",
        "Apfel",
        { kcal: 52, sugars: 10.4, fat: 0.2, salt: 0.01 },
        {
          brand: "Obsthof",
          ingredients: "Apfel",
        }
      ),
      createProduct(
        "karotte",
        "Karotten",
        { kcal: 41, sugars: 6.7, fat: 0.2, salt: 0.08 },
        {
          brand: "Gemüsegarten",
          ingredients: "Karotten",
        }
      ),
    ],
  },
  {
    id: "obst-gemuese-verarbeitet",
    title: "Obst & Gemüse (verarbeitet)",
    icon: "🥫",
    products: [
      createProduct(
        "apfelmus",
        "Apfelmus gezuckert",
        { kcal: 85, sugars: 20, fat: 0.2, salt: 0.02 },
        {
          brand: "Fruchtkeller",
          ingredients: "Äpfel (80 %), Zucker, Zitronensaft",
        }
      ),
      createProduct(
        "saure-gurken",
        "Saure Gurken",
        { kcal: 30, sugars: 3.5, fat: 0.2, salt: 1.7 },
        {
          brand: "EinmachLiebe",
          ingredients: "Gurken, Wasser, Branntweinessig, Zucker, Salz, Gewürze",
        }
      ),
    ],
  },
  {
    id: "pasta-reis",
    title: "Pasta, Reis & Getreide",
    icon: "🍝",
    products: [
      createProduct(
        "spaghetti",
        "Spaghetti Hartweizen",
        { kcal: 350, sugars: 3, fat: 1.5, salt: 0.03 },
        {
          brand: "PastaMondo",
          ingredients: "Hartweizengrieß, Wasser",
        }
      ),
      createProduct(
        "basmati",
        "Basmatireis",
        { kcal: 348, sugars: 0.5, fat: 0.6, salt: 0.03 },
        {
          brand: "Reisquelle",
          ingredients: "Reis",
        }
      ),
    ],
  },
  {
    id: "pflanzliche-alternativen",
    title: "Pflanzliche Alternativen",
    icon: "🥗",
    products: [
      createProduct(
        "tofu",
        "Natur-Tofu",
        { kcal: 120, sugars: 1.0, fat: 6.5, salt: 0.02 },
        {
          brand: "VeggieHaus",
          ingredients: "Sojabohnen, Wasser, Nigari",
        }
      ),
      createProduct(
        "veg-burger",
        "Veggie-Burger Patty",
        { kcal: 200, sugars: 2.5, fat: 9, salt: 1.3 },
        {
          brand: "GreenBite",
          ingredients: "Erbsenprotein, Sonnenblumenöl, Wasser, Gewürze, Salz",
        }
      ),
    ],
  },
  {
    id: "saucen-dips",
    title: "Saucen & Dips",
    icon: "🥫",
    products: [
      createProduct(
        "ketchup",
        "Tomatenketchup",
        { kcal: 110, sugars: 23, fat: 0.2, salt: 1.8 },
        {
          brand: "SauceCo",
          ingredients: "Tomatenmark, Zucker, Branntweinessig, Salz, Gewürze",
        }
      ),
      createProduct(
        "pestogrün",
        "Pesto Verde",
        { kcal: 450, sugars: 4, fat: 42, salt: 2.2 },
        {
          brand: "Genova",
          ingredients: "Basilikum, Sonnenblumenöl, Käse, Pinienkerne, Salz",
        }
      ),
    ],
  },
  {
    id: "snacks",
    title: "Herzhafte Snacks",
    icon: "🥨",
    products: [
      createProduct(
        "chips-paprika",
        "Kartoffelchips Paprika",
        { kcal: 530, sugars: 3.5, fat: 33, salt: 1.3 },
        {
          brand: "Knusperlust",
          ingredients: "Kartoffeln, Pflanzenöl, Paprikagewürz, Salz",
        }
      ),
      createProduct(
        "nussmix",
        "Nussmix geröstet",
        { kcal: 620, sugars: 6, fat: 52, salt: 0.9 },
        {
          brand: "Nusskiste",
          ingredients: "Erdnüsse, Cashews, Mandeln, Salz",
        }
      ),
    ],
  },
  {
    id: "tiefkuehl-snacks",
    title: "Tiefgekühlte Snacks",
    icon: "🥟",
    products: [
      createProduct(
        "gemuesetaschen",
        "Gemüsetaschen",
        { kcal: 220, sugars: 3, fat: 9, salt: 1.3 },
        {
          brand: "FreezerFix",
          ingredients: "Weizenmehl, Gemüsefüllung (Karotten, Erbsen), Pflanzenöl, Salz",
        }
      ),
      createProduct(
        "mozzarellasticks",
        "Mozzarella-Sticks",
        { kcal: 310, sugars: 2, fat: 19, salt: 1.6 },
        {
          brand: "SnackBox",
          ingredients: "Mozzarella (60 %), Panade, Pflanzenöl, Salz",
        }
      ),
    ],
  },
  {
    id: "verarbeitet-suesse",
    title: "Süßwaren",
    icon: "🍬",
    products: [
      createProduct(
        "gummibaerchen",
        "Fruchtgummi",
        { kcal: 340, sugars: 76, fat: 0.2, salt: 0.02 },
        {
          brand: "Sweets&Co",
          ingredients: "Zucker, Glukosesirup, Gelatine, Fruchtsaftkonzentrat",
        }
      ),
      createProduct(
        "riegel",
        "Müsliriegel Schoko",
        { kcal: 420, sugars: 28, fat: 15, salt: 0.4 },
        {
          brand: "Energize",
          ingredients: "Haferflocken, Glukosesirup, Schokolade, Mandeln",
        }
      ),
    ],
  },
];

const sortCategories = (items: ManualCategory[]): ManualCategory[] =>
  items
    .map((item) => ({
      ...item,
      children: item.children ? sortCategories(item.children) : undefined,
    }))
    .sort((a, b) => a.title.localeCompare(b.title, "de"));

export const MANUAL_CATALOG: ManualCategory[] = sortCategories(catalog);
