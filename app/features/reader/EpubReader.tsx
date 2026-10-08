"use client";
import { useEffect, useRef, useState } from "react";
import ePub, { type Book, type Rendition, type Contents } from "epubjs";
import type { Location } from "epubjs/types/rendition";
import { t } from "../../core/i18n";
import type { ReaderAdapterProps } from "./reader-types";
import { protectEpubDocument } from "./epub-content";

export default function EpubReader({ asset, state, active, onReady, onLocation }: ReaderAdapterProps) {
  const host = useRef<HTMLDivElement>(null);
  const rendition = useRef<Rendition | null>(null);
  const latest = useRef({ state, onLocation, active });
  const lastCfi = useRef<string | undefined>(state.location.cfi);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { latest.current = { state, onLocation, active }; }, [state, onLocation, active]);
  useEffect(() => {
    let disposed = false;
    let book: Book | undefined;
    let observer: ResizeObserver | undefined;
    const gestureCleanups: Array<() => void> = [];
    const element = host.current!;
    const fail = () => { if (!disposed) setFailed(true); };
    void asset.blob.arrayBuffer().then(async data => {
      if (disposed) return;
      book = ePub(data, { replacements: "blobUrl", requestMethod: async () => { throw new Error("External EPUB resources disabled"); } });
      book.spine.hooks.content.register(protectEpubDocument);
      book.on("openFailed", fail);
      await book.ready;
      if (disposed) return;
      const view = book.renderTo(element, { width: "100%", height: "100%", spread: "none", flow: "paginated", allowScriptedContent: false });
      rendition.current = view;
      view.hooks.content.register((content: Contents) => {
        let start = { x: 0, y: 0, at: 0 };
        const down = (event: PointerEvent) => { start = { x: event.clientX, y: event.clientY, at: performance.now() }; };
        const up = (event: PointerEvent) => {
          if (!latest.current.active) return;
          const deltaX = event.clientX - start.x;
          const deltaY = event.clientY - start.y;
          const elapsed = performance.now() - start.at;
          if (elapsed < 600 && Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
            void view[deltaX < 0 ? "next" : "prev"]().catch(fail);
          }
        };
        content.document.addEventListener("pointerdown", down, { passive: true });
        content.document.addEventListener("pointerup", up, { passive: true });
        gestureCleanups.push(() => {
          content.document.removeEventListener("pointerdown", down);
          content.document.removeEventListener("pointerup", up);
        });
      });
      view.on("relocated", (location: Location) => {
        if (disposed) return;
        lastCfi.current = location.start.cfi;
        latest.current.onLocation({ cfi: location.start.cfi });
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
    return () => { disposed = true; observer?.disconnect(); gestureCleanups.forEach(cleanup => cleanup()); rendition.current?.destroy(); rendition.current = null; book?.destroy(); element.replaceChildren(); };
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
    const cfi = state.location.cfi;
    if (ready && active && cfi && cfi !== lastCfi.current) {
      lastCfi.current = cfi;
      void rendition.current?.display(cfi).catch(() => setFailed(true));
    }
  }, [ready, active, state.location.cfi]);
  return <>
    {failed ? <div role="alert">{t("reader.error")} <button onClick={() => { setReady(false); setAttempt(a => a + 1); }}>{t("reader.retry")}</button></div> : !ready ? <p role="status">{t("reader.loading")}</p> : null}
    <div className="epub-host" ref={host} />
  </>;
}
