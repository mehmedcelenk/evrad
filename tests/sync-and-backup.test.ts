import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";
import { parseBackupFile } from "../app/features/backup/backup-file";
import { restoreBackupPayload } from "../app/data/backup-repository";
import {
  generateSyncKey,
  getSupabaseConfig,
  saveSupabaseConfig,
} from "../app/data/supabase/supabase-config";
import { testSupabaseConnection } from "../app/data/supabase/supabase-client";
import type { BackupPayload } from "../app/core/backup";

test("generateSyncKey generates clean EVR- format keys", () => {
  const key = generateSyncKey();
  assert.match(key, /^EVR-[A-Z0-9]{6}$/);
});

test("parseBackupFile rejects invalid format or missing payload", async () => {
  await assert.rejects(
    () => parseBackupFile(JSON.stringify({ format: "wrong", payload: {} })),
    /Invalid backup file format/,
  );
  await assert.rejects(
    () => parseBackupFile(JSON.stringify({ format: "zikirlerim-backup" })),
    /Invalid backup file format/,
  );
  await assert.rejects(
    () => parseBackupFile("not json"),
    /SyntaxError/,
  );
});

test("parseBackupFile succeeds for valid envelope", async () => {
  const envelope = {
    format: "zikirlerim-backup",
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    checksum: "dummy",
    payload: {
      entities: { dhikr: [], prayers: [], memorization: [], books: [], poetry: [] },
      completions: [],
    },
  };
  const parsed = await parseBackupFile(JSON.stringify(envelope));
  assert.equal(parsed.format, "zikirlerim-backup");
  assert.ok(parsed.payload.entities);
});

test("restoreBackupPayload restores entities and completions into IndexedDB", async () => {
  const testPayload: BackupPayload = {
    entities: {
      dhikr: [
        {
          id: "test-dhikr-1",
          name: "Test Zikir",
          arabic: "سبحان الله",
          translation: "Allah eksikliklerden münezzehtir",
          details: "",
          source: "",
          targetCount: 33,
          targetUnit: "count",
          targetUnitLabel: null,
          listDisplay: "name",
          expandedArabicSize: 2,
          contexts: [],
          sortOrder: 1,
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
          inVirds: true,
          liked: true,
        },
      ],
      prayers: [
        {
          id: "test-prayer-1",
          name: "Test Dua",
          arabic: "",
          translation: "",
          details: "",
          source: "",
          targetCount: null,
          targetUnit: "count",
          targetUnitLabel: null,
          listDisplay: "name",
          expandedArabicSize: 2,
          contexts: [],
          sortOrder: 2,
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
          inVirds: false,
          liked: true,
        },
      ],
      memorization: [],
      books: [],
      poetry: [],
    },
    completions: [
      {
        key: "test-dhikr-1:2026-10-02",
        itemId: "test-dhikr-1",
        itemType: "dhikr",
        localDate: "2026-10-02",
        completedAt: new Date().toISOString(),
      },
    ],
  };

  const result = await restoreBackupPayload(testPayload);
  assert.equal(result.restoredEntities, 2);
  assert.equal(result.restoredCompletions, 1);
});

test("saveSupabaseConfig and getSupabaseConfig store and retrieve settings", () => {
  const original = getSupabaseConfig();
  try {
    saveSupabaseConfig({
      url: "https://example.supabase.co",
      anonKey: "test-anon-key",
      syncKey: "EVR-TEST01",
      autoSync: true,
    });

    const updated = getSupabaseConfig();
    assert.equal(updated.url, "https://example.supabase.co");
    assert.equal(updated.anonKey, "test-anon-key");
    assert.equal(updated.syncKey, "EVR-TEST01");
    assert.equal(updated.autoSync, true);
  } finally {
    saveSupabaseConfig(original);
  }
});

test("testSupabaseConnection returns failure when credentials are missing", async () => {
  const original = getSupabaseConfig();
  try {
    saveSupabaseConfig({ url: "", anonKey: "" });
    const res = await testSupabaseConnection();
    assert.equal(res.ok, false);
    assert.match(res.message, /eksik/);
  } finally {
    saveSupabaseConfig(original);
  }
});
