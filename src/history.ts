// src/history.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "recent_products_v1";

export type RecentItem = {
  id: string;                 // z. B. Barcode
  name: string;
  brand?: string | null;
  imageUrl?: string | null;
  ts: number;                 // Zeitstempel
};

export type RecentInput = Omit<RecentItem, "ts">;

/** Eintrag hinzufügen/aktualisieren (Dedupe per id) und auf 10 begrenzen */
export async function addRecent(item: RecentInput): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const list: RecentItem[] = raw ? JSON.parse(raw) : [];

    const filtered = list.filter((x) => x.id !== item.id);
    const next: RecentItem[] = [{ ...item, ts: Date.now() }, ...filtered].slice(0, 10);

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
    return list.sort((a, b) => b.ts - a.ts);
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

/** Alle löschen */
export async function clearRecents(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (e) {
    console.warn("clearRecents failed", e);
  }
}

/* --- Default-Export zusätzlich anbieten (falls irgendwo so importiert wurde) --- */
const History = { addRecent, getRecents, removeRecent, clearRecents };
export default History;