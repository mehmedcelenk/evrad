import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";
import { resetAndSeedV1SinglePrayer, isV1CleanSeeded } from "../app/data/v1-init";
import { collectionRepository } from "../app/data/collection-repository";
import { getActiveUsername, setActiveUsername, clearActiveUsername } from "../app/data/user-session";
import { getSupabaseConfig } from "../app/data/supabase/supabase-config";

test("V1 clean seed resets database and leaves only the single prayer", async () => {
  // Clear any existing flag
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("evrad_v1_single_prayer_init_done");
  }

  await resetAndSeedV1SinglePrayer();

  const entries = await collectionRepository.load();
  assert.equal(entries.length, 1, "Should have exactly 1 record");
  
  const single = entries[0];
  assert.equal(single.id, "prayers:hepsini-kapsayan-dua");
  assert.ok("name" in single.item);
  const devotional = single.item;
  assert.equal(devotional.name, "Hepsini Kapsayan Dua");
  assert.equal(devotional.arabic, "اَللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ خَيْرِ مَا سَأَلَكَ مِنْهُ نَبِيُّكَ مُحَمَّدٌ، صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ، وَنَعُوذُ بِكَ مِنْ شَرِّ مَا اسْتَعَاذَ مِنْهُ نَبِيُّكَ مُحَمَّدٌ، صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ، وَأَنْتَ الْمُسْتَعَانُ، وَعَلَيْكَ الْبَلَاغُ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ");
  assert.equal(devotional.translation, "Allahım! Peygamber’in Muhammed sallallahu aleyhi ve sellem’in senden dilediği hayırları ben de dilerim. Peygamber’in Muhammed sallallahu aleyhi ve sellem’in sana sığındığı şerlerden biz de sana sığınırız. Yardım ancak senden beklenir. İnsanı dünya ve âhirette muradına ulaştıracak sensin. Günahtan kaçacak güç, ibadet edecek kuvvet ancak Allah’ın yardımıyla kazanılabilir.");
  assert.equal(devotional.source, "Tirmizî, Daavât 89");
  assert.equal(devotional.inVirds, true);
  assert.deepEqual(devotional.bagCategories, ["prayers"]);
  assert.ok(isV1CleanSeeded());
});

test("setActiveUsername sets active user and configures Supabase syncKey", () => {
  clearActiveUsername();
  assert.equal(getActiveUsername(), null);

  let notifiedUser: string | null = null;
  const listener = (event: Event) => {
    notifiedUser = (event as CustomEvent<string | null>).detail;
  };
  // Node'da global olay hedefi yok; testte EventTarget ile taklit edilir.
  const target = new EventTarget();
  const globals = globalThis as unknown as Record<string, unknown>;
  const previous = { add: globals.addEventListener, remove: globals.removeEventListener, dispatch: globals.dispatchEvent };
  globals.addEventListener = target.addEventListener.bind(target);
  globals.removeEventListener = target.removeEventListener.bind(target);
  globals.dispatchEvent = target.dispatchEvent.bind(target);
  globalThis.addEventListener("evrad:user-changed", listener);

  try {
    setActiveUsername("emin");
    assert.equal(getActiveUsername(), "emin");
    assert.equal(notifiedUser, "emin");

    const config = getSupabaseConfig();
    assert.equal(config.syncKey, "emin");
    assert.equal(config.autoSync, true);

    clearActiveUsername();
    assert.equal(getActiveUsername(), null);
    assert.equal(notifiedUser, null);
  } finally {
    globalThis.removeEventListener("evrad:user-changed", listener);
    globals.addEventListener = previous.add;
    globals.removeEventListener = previous.remove;
    globals.dispatchEvent = previous.dispatch;
  }
});
