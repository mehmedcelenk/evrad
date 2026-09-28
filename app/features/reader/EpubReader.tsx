"use client";
import { useEffect, useRef, useState } from "react";
import ePub, { type Book, type Rendition, type Contents } from "epubjs";
import type { Location } from "epubjs/types/rendition";
import { t } from "../../core/i18n";
import type { ReaderAdapterProps } from "./reader-types";
import { flattenContents, protectEpubDocument } from "./epub-content";

export default function EpubReader({ asset, state, active, onReady, onLocation, onSelection }: ReaderAdapterProps) {
  const host = useRef<HTMLDivElement>(null);
  const rendition = useRef<Rendition | null>(null);
  const latest = useRef({ state, onLocation, onSelection });
  const lastCfi = useRef<string | undefined>(state.location.cfi);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [contents, setContents] = useState<{ href: string; label: string }[]>([]);
  useEffect(() => { latest.current = { state, onLocation, onSelection }; }, [state, onLocation, onSelection]);
  useEffect(() => {
    let disposed = false;
    let book: Book | undefined;
    let observer: ResizeObserver | undefined;
    const element = host.current!;
    const fail = () => { if (!disposed) setFailed(true); };
    void asset.blob.arrayBuffer().then(async data => {
      if (disposed) return;
      book = ePub(data, { replacements: "blobUrl", requestMethod: async () => { throw new Error("External EPUB resources disabled"); } });
      book.spine.hooks.content.register(protectEpubDocument);
      book.on("openFailed", fail);
      await book.ready;
      if (disposed) return;
      setContents(flattenContents(book.navigation.toc));
      const view = book.renderTo(element, { width: "100%", height: "100%", spread: "none", flow: "paginated", allowScriptedContent: false });
      rendition.current = view;
      view.on("relocated", (location: Location) => {
        if (disposed) return;
        lastCfi.current = location.start.cfi;
        latest.current.onLocation({ cfi: location.start.cfi });
        latest.current.onSelection(null);
      });
      view.on("selected", (cfi: string, content: Contents) => {
        const selected = content.window.getSelection()?.toString() ?? "";
        if (selected.trim()) latest.current.onSelection({ cfi, text: selected });
      });
      view.on("displayError", fail);
      await view.display(latest.current.state.location.cfi);
      if (disposed) return;
      setFailed(false); setReady(true); onReady();
      observer = new ResizeObserver(() => {
        if (element.clientWidth && element.clientHeight) view.resize(element.clientWidth, element.clientHeight);
      });
      observer.observe(element);
    }).catch(fail);
    return () => { disposed = true; observer?.disconnect(); rendition.current?.destroy(); rendition.current = null; book?.destroy(); element.replaceChildren(); };
  }, [asset, attempt, onReady]);
  useEffect(() => {
    const view = rendition.current;
    if (!ready || !view) return;
    const { fontSize, lineHeight, theme } = state.preferences;
    const cfi = lastCfi.current;
    view.themes.default({ body: { color: theme === "dark" ? "#eeece6 !important" : "#202020 !important", background: theme === "dark" ? "#14161b !important" : "#fffdf6 !important", "line-height": `${lineHeight} !important` }, a: { color: "#998b56" } });
    view.themes.fontSize(`${fontSize}%`);
    if (cfi) void view.display(cfi).catch(() => setFailed(true));
  }, [ready, state.preferences]);
  useEffect(() => {
    const view = rendition.current;
    if (!ready || !view) return;
    const annotations = state.annotations.filter(a => a.cfi);
    for (const annotation of annotations) view.annotations.highlight(annotation.cfi!, {}, undefined, "epub-highlight", { fill: "#e9c96b", "fill-opacity": "0.35", "mix-blend-mode": "multiply" });
    return () => { for (const annotation of annotations) view.annotations.remove(annotation.cfi!, "highlight"); };
  }, [ready, state.annotations]);
  useEffect(() => {
    const cfi = state.location.cfi;
    if (ready && active && cfi && cfi !== lastCfi.current) {
      lastCfi.current = cfi;
      void rendition.current?.display(cfi).catch(() => setFailed(true));
    }
  }, [ready, active, state.location.cfi]);
  const move = (direction: "prev" | "next") => { onSelection(null); void rendition.current?.[direction]().catch(() => setFailed(true)); };
  return <>
    <div className="reader-toolbar">
      <button disabled={!ready} onClick={() => move("prev")}>{t("reader.previous")}</button>
      <label><span className="reader-visually-hidden">{t("reader.contents")}</span><select defaultValue="" onChange={e => {
        if (e.target.value) void rendition.current?.display(e.target.value).catch(() => setFailed(true));
      }}><option value="">{t("reader.contents")}</option>{contents.map((item, index) => <option key={`${item.href}:${index}`} value={item.href}>{item.label}</option>)}</select></label>
      <button disabled={!ready} onClick={() => move("next")}>{t("reader.next")}</button>
    </div>
    {failed ? <div role="alert">{t("reader.error")} <button onClick={() => { setReady(false); setAttempt(a => a + 1); }}>{t("reader.retry")}</button></div> : !ready ? <p role="status">{t("reader.loading")}</p> : null}
    <div className="epub-host" ref={host} />
  </>;
}
