"use client";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { getDocument, GlobalWorkerOptions, TextLayer, type PDFDocumentProxy } from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";
import { t } from "../../core/i18n";
import type { ReaderAdapterProps } from "./reader-types";
GlobalWorkerOptions.workerSrc = "/pdfjs/build/pdf.worker.min.mjs";

export default function PdfReader({ asset, state, active, onReady, onLocation }: ReaderAdapterProps) {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [width, setWidth] = useState(320);
  const scroller = useRef<HTMLDivElement>(null);
  const pageElement = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const text = useRef<HTMLDivElement>(null);
  const position = useRef(state.location.scroll ?? 0);
  const restoring = useRef(false);
  const gesture = useRef({ x: 0, y: 0, startedAt: 0 });
  const page = Math.max(1, Math.min(document?.numPages ?? Infinity, state.location.page ?? 1));
  const zoom = 1;
  useEffect(() => {
    let disposed = false;
    if (navigator.serviceWorker?.controller) {
      void fetch("/pdfjs/manifest.json").then(response => response.json()).then(urls => {
        navigator.serviceWorker.controller?.postMessage({ type: "CACHE_URLS", urls });
      }).catch(() => undefined);
    }
    let task: ReturnType<typeof getDocument> | undefined;
    void asset.blob.arrayBuffer().then(data => {
      if (disposed) return;
      task = getDocument({ data, cMapUrl: "/pdfjs/cmaps/", cMapPacked: true, standardFontDataUrl: "/pdfjs/standard_fonts/", wasmUrl: "/pdfjs/wasm/" });
      return task.promise.then(pdf => { if (!disposed) { setDocument(pdf); setFailed(false); } });
    }).catch(() => { if (!disposed) setFailed(true); });
    return () => { disposed = true; void task?.destroy(); };
  }, [asset, attempt]);
  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const observer = new ResizeObserver(() => { if (element.clientWidth) setWidth(element.clientWidth); });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!document || !canvas.current || !text.current || !pageElement.current) return;
    let disposed = false;
    let render: ReturnType<Awaited<ReturnType<PDFDocumentProxy["getPage"]>>["render"]> | undefined;
    let layer: TextLayer | undefined;
    restoring.current = true;
    void document.getPage(page).then(async pdfPage => {
      if (disposed) return;
      const viewport = pdfPage.getViewport({ scale: Math.max(0.2, (width - 16) / pdfPage.getViewport({ scale: 1 }).width) * zoom });
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const element = canvas.current!;
      element.width = Math.ceil(viewport.width * ratio); element.height = Math.ceil(viewport.height * ratio);
      pageElement.current!.style.width = `${viewport.width}px`;
      pageElement.current!.style.height = `${viewport.height}px`;
      text.current!.replaceChildren();
      text.current!.style.setProperty("--scale-factor", String(viewport.scale));
      text.current!.style.setProperty("--total-scale-factor", String(viewport.scale));
      render = pdfPage.render({ canvas: element, viewport, transform: [ratio, 0, 0, ratio, 0, 0] });
      await render.promise;
      if (disposed) return;
      layer = new TextLayer({ textContentSource: await pdfPage.getTextContent(), container: text.current!, viewport });
      await layer.render();
      if (disposed) return;
      const el = scroller.current!;
      el.scrollTop = position.current * Math.max(0, el.scrollHeight - el.clientHeight);
      restoring.current = false;
      setFailed(false);
      onReady();
      // Warm only immediate neighbors; canvases are reserved for the visible page.
      for (const neighbor of [page - 1, page + 1]) if (neighbor > 0 && neighbor <= document.numPages) void document.getPage(neighbor).catch(() => undefined);
    }).catch(error => { if (!disposed && error?.name !== "RenderingCancelledException") { setFailed(true); restoring.current = false; } });
    return () => { disposed = true; render?.cancel(); layer?.cancel(); };
  }, [document, page, zoom, width, onReady]);
  useEffect(() => {
    position.current = state.location.scroll ?? 0;
    if (!restoring.current && scroller.current) scroller.current.scrollTop = position.current * Math.max(0, scroller.current.scrollHeight - scroller.current.clientHeight);
  }, [state.location.scroll]);
  const startGesture = (event: ReactPointerEvent) => { gesture.current = { x: event.clientX, y: event.clientY, startedAt: performance.now() }; };
  const finishGesture = (event: ReactPointerEvent) => {
    if (!active) return;
    const deltaX = event.clientX - gesture.current.x;
    const deltaY = event.clientY - gesture.current.y;
    const elapsed = performance.now() - gesture.current.startedAt;
    if (elapsed < 600 && Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      const nextPage = Math.max(1, Math.min(document?.numPages ?? 1, page + (deltaX < 0 ? 1 : -1)));
      if (nextPage !== page) { position.current = 0; onLocation({ page: nextPage, scroll: 0, zoom: 1 }); }
      return;
    }
  };
  return <>
    {failed ? <div role="alert">{t("reader.error")} <button onClick={() => setAttempt(a => a + 1)}>{t("reader.retry")}</button></div> : null}
    {!document && !failed ? <p role="status">{t("reader.loading")}</p> : null}
    <div role="region" aria-label={t("reader.menu")} className="pdf-scroller" ref={scroller} onPointerDown={startGesture} onPointerUp={finishGesture} onScroll={e => {
      if (!active || restoring.current) return;
      const available = e.currentTarget.scrollHeight - e.currentTarget.clientHeight;
      position.current = available > 0 ? e.currentTarget.scrollTop / available : 0;
      onLocation({ page, zoom: 1, scroll: position.current });
    }}><div className="pdf-page" ref={pageElement}>
      <canvas ref={canvas} /><div className="textLayer" ref={text} />
    </div></div>
  </>;
}
