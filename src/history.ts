// src/history.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

import { DEMO_BARCODE_OVERRIDES } from "./logic";

const KEY = "recent_products_v1";

export type RecentItem = {
  id: string;                 // z. B. Barcode
  name: string;
  brand?: string | null;
  imageUrl?: string | null;
  suitable?: boolean | null;
  favorite?: boolean | null;
  ts: number;                 // Zeitstempel
};

export type RecentInput = Omit<RecentItem, "ts">;

function mergeDemoOverrides<T extends { id: string; imageUrl?: string | null; suitable?: boolean | null }>(
  item: T
): T {
  const override = DEMO_BARCODE_OVERRIDES[item.id];
  if (!override) return item;

  return {
    ...item,
    imageUrl: override.imageUrl ?? item.imageUrl ?? null,
    suitable: override.suitable ?? (item.suitable ?? null),
  };
}

/** Eintrag hinzufügen/aktualisieren (Dedupe per id) und auf 10 begrenzen */
export async function addRecent(item: RecentInput): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const list: RecentItem[] = raw ? JSON.parse(raw) : [];

    const normalizedInput = mergeDemoOverrides({
      ...item,
      imageUrl: item.imageUrl ?? null,
      suitable: item.suitable ?? null,
    });

    const existing = list.find((x) => x.id === item.id);
    const filtered = list.filter((x) => x.id !== item.id);
    const next: RecentItem[] = [
      {
        ...mergeDemoOverrides({
          ...normalizedInput,
          favorite: normalizedInput.favorite ?? existing?.favorite ?? false,
        }),
        ts: Date.now(),
      },
      ...filtered,
    ].slice(0, 10);

    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch (e) {
    console.warn("addRecent failed", e);
  }
}

/** Liste lesen (neueste zuerst) */
export async function getRecents(): Promise<RecentItem[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const list: RecentItem[] = raw ? JSON.parse(raw) : [];
    const normalized = list.map((entry) =>
      mergeDemoOverrides({
        ...entry,
        imageUrl: entry.imageUrl ?? null,
        suitable: entry.suitable ?? null,
      })
    );
    return normalized.sort((a, b) => b.ts - a.ts);
  } catch (e) {
    console.warn("getRecents failed", e);
    return [];
  }
}

/** Eintrag per id löschen */
export async function removeRecent(id: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const list: RecentItem[] = raw ? JSON.parse(raw) : [];
    const next = list.filter((x) => x.id !== id);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch (e) {
    console.warn("removeRecent failed", e);
  }
}

export async function setFavorite(id: string, favorite: boolean): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const list: RecentItem[] = raw ? JSON.parse(raw) : [];
    const next = list.map((item) => (item.id === id ? { ...item, favorite } : item));
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch (e) {
    console.warn("setFavorite failed", e);
  }
}

/** Alle löschen */
export async function clearRecents(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (e) {
    console.warn("clearRecents failed", e);
  }
}

/* --- Default-Export zusätzlich anbieten (falls irgendwo so importiert wurde) --- */
const History = { addRecent, getRecents, removeRecent, clearRecents, setFavorite };
export default History;
