import { ENTITY_STORES, COMPLETION_STORE, runTransaction } from "./indexed-db";
import type { DevotionalItem } from "../core/types";

export const V1_SINGLE_PRAYER: DevotionalItem = {
  id: "hepsini-kapsayan-dua",
  name: "Hepsini Kapsayan Dua",
  arabic: "اَللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ خَيْرِ مَا سَأَلَكَ مِنْهُ نَبِيُّكَ مُحَمَّدٌ، صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ، وَنَعُوذُ بِكَ مِنْ شَرِّ مَا اسْتَعَاذَ مِنْهُ نَبِيُّكَ مُحَمَّدٌ، صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ، وَأَنْتَ الْمُسْتَعَانُ، وَعَلَيْكَ الْبَلَاغُ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ",
  translation: "Allahım! Peygamber’in Muhammed sallallahu aleyhi ve sellem’in senden dilediği hayırları ben de dilerim. Peygamber’in Muhammed sallallahu aleyhi ve sellem’in sana sığındığı şerlerden biz de sana sığınırız. Yardım ancak senden beklenir. İnsanı dünya ve âhirette muradına ulaştıracak sensin. Günahtan kaçacak güç, ibadet edecek kuvvet ancak Allah’ın yardımıyla kazanılabilir.",
  source: "Tirmizî, Daavât 89",
  details: null,
  targetCount: null,
  targetUnit: "count",
  targetUnitLabel: null,
  listDisplay: "name",
  expandedArabicSize: 2,
  contexts: ["general"],
  bagCategories: ["prayers"],
  inVirds: true,
  liked: true,
  sortOrder: 0,
  virdSortOrder: 0,
  createdAt: "2026-10-04T00:00:00.000Z",
  updatedAt: "2026-10-04T00:00:00.000Z",
};

const V1_INIT_FLAG = "evrad_v1_single_prayer_init_done";

export function isV1CleanSeeded(): boolean {
  if (typeof localStorage === "undefined") return true;
  return localStorage.getItem(V1_INIT_FLAG) === "true";
}

export async function resetAndSeedV1SinglePrayer(): Promise<void> {
  const allStores = [...Object.values(ENTITY_STORES), COMPLETION_STORE];
  await runTransaction(allStores, "readwrite", (transaction) => {
    for (const storeName of Object.values(ENTITY_STORES)) {
      transaction.objectStore(storeName).clear();
    }
    transaction.objectStore(COMPLETION_STORE).clear();
    transaction.objectStore(ENTITY_STORES.prayers).add(V1_SINGLE_PRAYER);
  });
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(V1_INIT_FLAG, "true");
  }
}

