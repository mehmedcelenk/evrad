import assert from "node:assert/strict";
import test from "node:test";
import {
  ARABIC_FONTS,
  ARABIC_FONT_SAMPLE,
  formatArabicDiacritics,
  findArabicFont,
} from "../src/shared/arabic-fonts";

test("arabic fonts set contains defined typography options", () => {
  assert.equal(ARABIC_FONTS.length, 5);

  const expectedNames = [
    "Noto Naskh Arabic",
    "Readex Pro",
    "Almarai",
    "Amiri",
    "Scheherazade New",
  ];

  for (const name of expectedNames) {
    const found = ARABIC_FONTS.find((font) => font.name === name);
    assert.ok(found, `Expected font ${name} not found in ARABIC_FONTS`);
  }
});

test("formatArabicDiacritics respects showDiacritics toggle boolean", () => {
  const text = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
  assert.equal(formatArabicDiacritics(text, true), text);
  assert.equal(formatArabicDiacritics(text, false), "بسم الله الرحمن الرحيم");
});

test("findArabicFont falls back to default font when given unknown id", () => {
  const fallback = findArabicFont("unknown-id" as any);
  assert.equal(fallback.id, "noto");
});
