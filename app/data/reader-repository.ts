import type { BookItem } from "../core/types";
import { defaultReaderState, detectBookFormat, type BookAsset, type ReaderState } from "../core/reader";
import { requestResult, runTransaction } from "./indexed-db";

export const READER_STORES = ["readerStates", "readerSettings"];
export async function saveBookWithAsset(item: BookItem, file?: File) {
  const format = file ? await detectBookFormat(file, file.name) : item.format;
  if (file && (!item.assetId || item.format !== format)) throw new Error("Missing asset identity");
  await runTransaction(["books", "bookAssets", "readerStates"], "readwrite", async (tx) => {
    const previous = await requestResult(tx.objectStore("books").get(item.id)) as BookItem | undefined;
    tx.objectStore("books").put(item);
    if (file) {
      tx.objectStore("bookAssets").put({ id: item.assetId, name: file.name, format, blob: file });
      if (previous?.assetId && previous.assetId !== item.assetId) {
        tx.objectStore("bookAssets").delete(previous.assetId);
        tx.objectStore("readerStates").delete(item.id);
      }
    }
  });
}
export async function loadReader(bookId?: string) {
  return runTransaction(["books", "bookAssets", ...READER_STORES], "readonly", async (tx) => {
    const last = await requestResult(tx.objectStore("readerSettings").get("lastBook"));
    const id = bookId ?? last?.bookId;
    if (!id) return null;
    const book = await requestResult(tx.objectStore("books").get(id)) as BookItem | undefined;
    if (!book?.assetId) throw new Error("Book file missing");
    const asset = await requestResult(tx.objectStore("bookAssets").get(book.assetId)) as BookAsset | undefined;
    if (!asset) throw new Error("Book file missing");
    const state = await requestResult(tx.objectStore("readerStates").get(id)) as ReaderState | undefined;
    return { book, asset, state: state ?? defaultReaderState(id, asset.id) };
  });
}
export function saveReaderState(state: ReaderState) {
  return runTransaction(["books", "readerStates"], "readwrite", async tx => {
    const book = await requestResult(tx.objectStore("books").get(state.id)) as BookItem | undefined;
    if (!book || state.assetId && book.assetId !== state.assetId) return;
    tx.objectStore("readerStates").put(state);
  });
}
export function setLastBook(bookId: string) {
  return runTransaction("readerSettings", "readwrite", tx => { tx.objectStore("readerSettings").put({ id: "lastBook", bookId }); });
}
export async function downloadBook(assetId: string) {
  const asset = await runTransaction("bookAssets", "readonly", tx => requestResult(tx.objectStore("bookAssets").get(assetId))) as BookAsset;
  if (!asset) throw new Error("Book file missing");
  const url = URL.createObjectURL(asset.blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = asset.name; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}
