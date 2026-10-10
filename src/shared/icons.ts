import { raw, type RawHtml } from "./safe-html";

export function svgIcon(pathD: string, size = 16, strokeWidth = 1.8, extraAttr = ""): RawHtml {
  return raw(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true" ${extraAttr}>
      ${pathD}
    </svg>
  `.trim());
}

export const icons = {
  check: (size = 14, strokeWidth = 2.5) => svgIcon('<path d="M20 6 9 17l-5-5"/>', size, strokeWidth),
  plus: (size = 16, strokeWidth = 1.8) => svgIcon('<path d="M5 12h14"/><path d="M12 5v14"/>', size, strokeWidth),
  minus: (size = 16, strokeWidth = 1.8) => svgIcon('<path d="M5 12h14"/>', size, strokeWidth),
  volume: (size = 16, strokeWidth = 1.8) => svgIcon(
    '<path d="M11 4.702a.705.705 0 0 0-1.203-.498L5.413 8.587H2.5A1.5 1.5 0 0 0 1 10.087v3.826a1.5 1.5 0 0 0 1.5 1.5h2.913l4.384 4.383A.705.705 0 0 0 11 19.298V4.702z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.07 6.93a10 10 0 0 1 0 10.14"/>',
    size, strokeWidth
  ),
  pencil: (size = 16, strokeWidth = 1.8) => svgIcon(
    '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>',
    size, strokeWidth
  ),
  trash: (size = 16, strokeWidth = 1.8) => svgIcon(
    '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    size, strokeWidth
  ),
  settings: (size = 18, strokeWidth = 1.8) => svgIcon(
    '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    size, strokeWidth
  ),
  chevronDown: (size = 18, strokeWidth = 1.8) => svgIcon('<path d="m6 9 6 6 6-6"/>', size, strokeWidth),
  sliders: (size = 18, strokeWidth = 1.8) => svgIcon(
    '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
    size, strokeWidth
  ),
  virds: (size = 18, strokeWidth = 1.8) => svgIcon(
    '<circle cx="12" cy="12" r="8"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/>',
    size, strokeWidth
  ),
};
