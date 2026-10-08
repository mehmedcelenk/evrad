"use client";
import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { loadReader, setLastBook } from "../../data/reader-repository";
import { useRecordLibrary } from "../../hooks/useRecordLibrary";
import { ReaderContext } from "./useReader";
import { ReaderErrorBoundary } from "./ReaderErrorBoundary";
import { getSectionRoute } from "../../core/module-registry";
import { t } from "../../core/i18n";

const ReaderSession = lazy(() => import("./ReaderSession"));
type LoadedBook = NonNullable<Awaited<ReturnType<typeof loadReader>>>;
export function ReaderProvider({ children, navigation }: { children: ReactNode; navigation: ReactNode }) {
  const library = useRecordLibrary();
  const [book, setBook] = useState<LoadedBook | null>(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const current = useRef<LoadedBook | null>(null);
  const request = useRef(0);
  const lastRequest = useRef<string | undefined>(undefined);
  const flush = useRef<() => Promise<boolean>>(async () => true);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeWaiters = useRef<Array<() => void>>([]);
  const openStarted = useRef(0);
  const returnFocus = useRef<HTMLElement | null>(null);
  const open = useCallback(async (id?: string) => {
    openStarted.current = performance.now();
    returnFocus.current = document.activeElement as HTMLElement;
    setVisible(true);
    lastRequest.current = id;
    const cached = current.current;
    const record = library.entries.find(entry => entry.moduleId === "books" && entry.itemId === (id ?? cached?.book.id));
    if (cached && (!id || cached.book.id === id) && record?.moduleId === "books" && record.item.assetId === cached.asset.id) {
      setFailed(false); setLoading(false);
      requestAnimationFrame(() => { if (dialogRef.current) dialogRef.current.dataset.resumeMs = (performance.now() - openStarted.current).toFixed(1); });
      return;
    }
    const token = ++request.current;
    setLoading(true); setFailed(false);
    try {
      if (!await flush.current()) throw new Error("Reader save failed");
      const loaded = await loadReader(id);
      if (request.current !== token) return;
      if (loaded) await setLastBook(loaded.book.id);
      if (request.current !== token) return;
      current.current = loaded; setBook(loaded);
    } catch { if (request.current === token) setFailed(true); }
    finally { if (request.current === token) setLoading(false); }
  }, [library.entries]);
  const close = useCallback(async () => {
    if (!await flush.current()) return false;
    ++request.current; setLoading(false);
    await new Promise<void>(resolve => {
      closeWaiters.current.push(resolve);
      setVisible(false);
    });
    return true;
  }, []);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!visible) {
      dialog.close();
      returnFocus.current?.focus({ preventScroll: true });
      closeWaiters.current.splice(0).forEach(resolve => resolve());
      return;
    }
    dialog.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; dialog.close(); };
  }, [visible, close]);
  const onReady = useCallback(() => {
    if (dialogRef.current) dialogRef.current.dataset.loadMs = (performance.now() - openStarted.current).toFixed(1);
  }, []);
  return <ReaderContext.Provider value={{ open, close, active: visible }}>
    <div inert={visible} aria-hidden={visible || undefined}>{children}{visible ? null : navigation}</div>
    <dialog ref={dialogRef} onCancel={event => { event.preventDefault(); void close(); }} className="reader-shell" data-visible={visible} inert={!visible} aria-hidden={!visible} aria-modal={visible || undefined} aria-label={t("reader.menu")}>
      {loading ? <p role="status">{t("reader.loading")}</p> : failed ? <div role="alert"><p>{t("reader.error")}</p><button onClick={() => void open(lastRequest.current)}>{t("reader.retry")}</button></div> : null}
      {!book && !loading && !failed ? <div className="reader-empty"><p>{t("reader.empty")}</p><a href={getSectionRoute("virds")}>{t("reader.browse")}</a></div> : null}
      {book ? <ReaderErrorBoundary key={book.asset.id}><Suspense fallback={<p>{t("reader.loading")}</p>}><ReaderSession key={book.asset.id} loaded={book} onReady={onReady} active={visible && !loading && !failed} registerFlushRef={flush} /></Suspense></ReaderErrorBoundary> : null}
      {visible ? navigation : null}
    </dialog>
  </ReaderContext.Provider>;
}
