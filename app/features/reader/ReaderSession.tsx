"use client";
import { lazy, Suspense, useCallback, useEffect, useState, type RefObject } from "react";
import type { loadReader } from "../../data/reader-repository";
import type { ReaderAnnotation, ReaderLocation } from "../../core/reader";
import { t } from "../../core/i18n";
import { useReaderPersistence } from "./useReaderPersistence";
const PdfReader = lazy(() => import("./PdfReader"));
const EpubReader = lazy(() => import("./EpubReader"));
export default function ReaderSession({ loaded, active, onReady, registerFlushRef }: {
  loaded: NonNullable<Awaited<ReturnType<typeof loadReader>>>;
  onReady: () => void; active: boolean; registerFlushRef: RefObject<() => Promise<boolean>>;
}) {
  const { state, update, flush, failed } = useReaderPersistence(loaded.state);
  const [selection, setSelection] = useState<Omit<ReaderAnnotation, "id" | "note"> | null>(null);
  const [note, setNote] = useState("");
  useEffect(() => { registerFlushRef.current = flush; return () => { registerFlushRef.current = async () => true; }; }, [flush, registerFlushRef]);
  const onLocation = useCallback((location: ReaderLocation) => update(current => ({ ...current, location: { ...current.location, ...location } })), [update]);
  const Reader = loaded.asset.format === "pdf" ? PdfReader : EpubReader;
  return <div className="reader-session" data-theme={state.preferences.theme}>
    {failed ? <div role="alert">{t("reader.saveError")} <button onClick={() => void flush()}>{t("reader.retry")}</button></div> : null}
    {loaded.asset.format === "epub" ? <div className="reader-toolbar">
      <label>{t("reader.fontSize")}<input type="range" min="75" max="200" step="5" value={state.preferences.fontSize} onChange={e => update(s => ({ ...s, preferences: { ...s.preferences, fontSize: Number(e.target.value) } }))} /></label>
      <label>{t("reader.lineHeight")}<input type="range" min="1.2" max="2.4" step="0.1" value={state.preferences.lineHeight} onChange={e => update(s => ({ ...s, preferences: { ...s.preferences, lineHeight: Number(e.target.value) } }))} /></label>
      <label>{t("reader.theme")}<select value={state.preferences.theme} onChange={e => update(s => ({ ...s, preferences: { ...s.preferences, theme: e.target.value as "dark" | "light" } }))}><option value="dark">{t("reader.dark")}</option><option value="light">{t("reader.light")}</option></select></label>
    </div> : null}
    <Suspense fallback={<p>{t("reader.loading")}</p>}><Reader onReady={onReady} asset={loaded.asset} state={state} active={active} onLocation={onLocation} onSelection={setSelection} /></Suspense>
    <details className="reader-notes" open={selection ? true : undefined}>
      <summary>{t("reader.notes")} ({state.annotations.length})</summary>
      {selection ? <div><p>{selection.text.slice(0, 200)}</p><input aria-label={t("reader.note")} placeholder={t("reader.note")} value={note} onChange={e => setNote(e.target.value)} /><button onClick={() => {
        update(s => ({ ...s, annotations: [...s.annotations, { ...selection, id: crypto.randomUUID(), note }] })); setSelection(null); setNote("");
      }}>{t("reader.highlight")}</button></div> : <p>{t("reader.selection")}</p>}
      {state.annotations.map(annotation => <div key={annotation.id} className="reader-note"><button onClick={() => onLocation(annotation.cfi ? { cfi: annotation.cfi } : { page: annotation.page, scroll: annotation.rects?.[0]?.y ?? 0 })}>{annotation.text}</button><p>{annotation.note}</p><button aria-label={t("action.delete")} onClick={() => update(s => ({ ...s, annotations: s.annotations.filter(a => a.id !== annotation.id) }))}>×</button></div>)}
    </details>
  </div>;
}
