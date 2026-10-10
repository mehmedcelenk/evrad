import type { ArabicFontId } from "./types";

export interface ArabicFontDefinition {
  id: ArabicFontId;
  name: string;
  styleCategory: string;
  fontFamily: string;
  googleFontFamily?: string;
}

export const ARABIC_FONT_SAMPLE = "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ";

export const ARABIC_FONTS: ArabicFontDefinition[] = [
  {
    id: "noto",
    name: "Noto Naskh Arabic",
    styleCategory: "Geleneksel · Nesih",
    fontFamily: "Noto Naskh Arabic",
    googleFontFamily: "Noto+Naskh+Arabic:wght@400;700",
  },
  {
    id: "readex",
    name: "Readex Pro",
    styleCategory: "Modern · Yuvarlak",
    fontFamily: "Readex Pro",
    googleFontFamily: "Readex+Pro:wght@400;600",
  },
  {
    id: "almarai",
    name: "Almarai",
    styleCategory: "Yumuşak · Minimal",
    fontFamily: "Almarai",
    googleFontFamily: "Almarai:wght@400;700",
  },
  {
    id: "amiri",
    name: "Amiri",
    styleCategory: "Klasik · Klasik Baskı",
    fontFamily: "Amiri",
    googleFontFamily: "Amiri:wght@400;700",
  },
  {
    id: "scheherazade",
    name: "Scheherazade New",
    styleCategory: "Akıcı · Geleneksel",
    fontFamily: "Scheherazade New",
    googleFontFamily: "Scheherazade+New:wght@400;700",
  },
];

const ARABIC_DIACRITICS_REGEX = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;

export function formatArabicDiacritics(text: string, showDiacritics: boolean): string {
  if (!text) return "";
  if (showDiacritics) return text;
  return text.replace(ARABIC_DIACRITICS_REGEX, "");
}

export function findArabicFont(id: ArabicFontId): ArabicFontDefinition {
  return ARABIC_FONTS.find((font) => font.id === id) ?? ARABIC_FONTS[0];
}
