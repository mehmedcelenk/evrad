import assert from "node:assert/strict";
import test from "node:test";
import { getResetDateKey } from "../src/shared/date";

test("getResetDateKey defaults to midnight reset correctly", () => {
  const dateAt1AM = new Date(2026, 8, 23, 1, 30);
  assert.equal(getResetDateKey(dateAt1AM, "00:00"), "2026-09-23");

  const dateAt11PM = new Date(2026, 8, 23, 23, 30);
  assert.equal(getResetDateKey(dateAt11PM, "00:00"), "2026-09-23");
});

test("getResetDateKey respects custom reset time (e.g. 04:00)", () => {
  const beforeReset = new Date(2026, 8, 23, 2, 45);
  assert.equal(getResetDateKey(beforeReset, "04:00"), "2026-09-22");

  const justBeforeReset = new Date(2026, 8, 23, 3, 59);
  assert.equal(getResetDateKey(justBeforeReset, "04:00"), "2026-09-22");

  const atReset = new Date(2026, 8, 23, 4, 0);
  assert.equal(getResetDateKey(atReset, "04:00"), "2026-09-23");

  const afternoon = new Date(2026, 8, 23, 14, 15);
  assert.equal(getResetDateKey(afternoon, "04:00"), "2026-09-23");
});
