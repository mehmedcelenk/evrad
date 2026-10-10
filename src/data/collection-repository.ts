import { DHIKR_STORE, requestResult, runTransaction } from "./indexed-db";
import type { DevotionalItem } from "../shared/types";

export const DEFAULT_DHIKR: DevotionalItem = {
  id: "hepsini-kapsayan-dua",
  name: "Hepsini Kapsayan Dua",
  arabic: "اَللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ خَيْرِ مَا سَأَلَكَ مِنْهُ نَبِيُّكَ مُحَمَّدٌ، صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ، وَنَعُوذُ بِكَ مِنْ شَرِّ مَا اسْتَعَاذَ مِنْهُ نَبِيُّكَ مُحَمَّدٌ، صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ، وَأَنْتَ الْمُسْتَعَانُ، وَعَلَيْكَ الْبَلَاغُ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ",
  translation: "Allahım! Peygamber’in Muhammed sallallahu aleyhi ve sellem’in senden dilediği hayırları ben de dilerim. Peygamber’in Muhammed sallallahu aleyhi ve sellem’in sana sığındığı şerlerden biz de sana sığınırız.",
  source: "Tirmizî, Daavât 89",
  details: "Sabah ve akşam okunabilecek dualar.",
  targetCount: 1,
  targetUnit: "count",
  contexts: ["general", "morning"],
  inVirds: true,
  inBag: true,
  expandedArabicSize: 2,
  category: "dhikr",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export async function getAllDhikrs(): Promise<DevotionalItem[]> {
  const items = await runTransaction(DHIKR_STORE, "readonly", (tx) => requestResult(tx.objectStore(DHIKR_STORE).getAll()));
  if (!items || items.length === 0) {
    await saveDhikr(DEFAULT_DHIKR);
    return [DEFAULT_DHIKR];
  }
  return items as DevotionalItem[];
}

export async function saveDhikr(item: DevotionalItem): Promise<DevotionalItem> {
  const now = new Date().toISOString();
  const entry: DevotionalItem = {
    ...item,
    updatedAt: now,
    createdAt: item.createdAt || now,
  };
  await runTransaction(DHIKR_STORE, "readwrite", (tx) => tx.objectStore(DHIKR_STORE).put(entry));
  return entry;
}

export async function deleteDhikr(id: string): Promise<void> {
  await runTransaction(DHIKR_STORE, "readwrite", (tx) => tx.objectStore(DHIKR_STORE).delete(id));
}
