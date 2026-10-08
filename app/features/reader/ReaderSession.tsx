"use client";
import { lazy, Suspense, useCallback, useEffect, type RefObject } from "react";
import type { loadReader } from "../../data/reader-repository";
import type { ReaderLocation } from "../../core/reader";
import { t } from "../../core/i18n";
import { useReaderPersistence } from "./useReaderPersistence";
const PdfReader = lazy(() => import("./PdfReader"));
const EpubReader = lazy(() => import("./EpubReader"));
export default function ReaderSession({ loaded, active, onReady, registerFlushRef }: {
  loaded: NonNullable<Awaited<ReturnType<typeof loadReader>>>;
  onReady: () => void; active: boolean; registerFlushRef: RefObject<() => Promise<boolean>>;
}) {
  const { state, update, flush, failed } = useReaderPersistence(loaded.state);
  useEffect(() => { registerFlushRef.current = flush; return () => { registerFlushRef.current = async () => true; }; }, [flush, registerFlushRef]);
  const onLocation = useCallback((location: ReaderLocation) => update(current => ({ ...current, location: { ...current.location, ...location } })), [update]);
  const Reader = loaded.asset.format === "pdf" ? PdfReader : EpubReader;
  return <div className="reader-session" data-theme={state.preferences.theme}>
    {failed ? <div role="alert">{t("reader.saveError")} <button onClick={() => void flush()}>{t("reader.retry")}</button></div> : null}
    <Suspense fallback={<p>{t("reader.loading")}</p>}><Reader onReady={onReady} asset={loaded.asset} state={state} active={active} onLocation={onLocation} /></Suspense>
  </div>;
}
