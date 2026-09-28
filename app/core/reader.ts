export type BookFormat = "pdf" | "epub";
export interface BookAsset { id: string; name: string; format: BookFormat; blob: Blob }
export interface ReaderLocation { page?: number; scroll?: number; zoom?: number; cfi?: string }
export interface ReaderPreferences { fontSize: number; lineHeight: number; theme: "dark" | "light" }
export interface PdfRect { x: number; y: number; width: number; height: number }
export interface ReaderAnnotation {
  id: string;
  text: string;
  note: string;
  page?: number;
  rects?: PdfRect[];
  cfi?: string;
}
export interface ReaderState {
  id: string;
  assetId?: string;
  location: ReaderLocation;
  preferences: ReaderPreferences;
  annotations: ReaderAnnotation[];
}
export const defaultReaderState = (id: string, assetId?: string): ReaderState => ({
  id, ...(assetId ? { assetId } : {}), location: {}, preferences: { fontSize: 100, lineHeight: 1.6, theme: "dark" }, annotations: [],
});
export async function detectBookFormat(file: Blob, name: string): Promise<BookFormat> {
  const bytes = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (/\.pdf$/i.test(name) && new TextDecoder().decode(bytes) === "%PDF-") return "pdf";
  if (/\.epub$/i.test(name) && bytes[0] === 80 && bytes[1] === 75) return "epub";
  throw new Error("Unsupported book file");
}
