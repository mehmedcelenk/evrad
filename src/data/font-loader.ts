import { findArabicFont } from "../shared/arabic-fonts";
import type { ArabicFontId } from "../shared/types";

const loadedFonts = new Set<string>();

export function loadArabicFont(id: ArabicFontId): void {
  if (typeof document === "undefined") return;
  const fontDef = findArabicFont(id);
  if (!fontDef.googleFontFamily || loadedFonts.has(id)) {
    document.documentElement.style.setProperty("--font-arabic", `"${fontDef.fontFamily}", Arial, sans-serif`);
    return;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${fontDef.googleFontFamily}&display=swap`;
  link.onload = () => {
    loadedFonts.add(id);
    document.documentElement.style.setProperty("--font-arabic", `"${fontDef.fontFamily}", Arial, sans-serif`);
  };
  document.head.appendChild(link);
}
