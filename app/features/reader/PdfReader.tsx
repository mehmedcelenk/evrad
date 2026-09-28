"use client";
import { useEffect, useRef, useState } from "react";
import { getDocument, GlobalWorkerOptions, TextLayer, type PDFDocumentProxy } from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";
import { t } from "../../core/i18n";
import type { ReaderAdapterProps } from "./reader-types";
GlobalWorkerOptions.workerSrc = "/pdfjs/build/pdf.worker.min.mjs";

export default function PdfReader({ asset, state, active, onReady, onLocation, onSelection }: ReaderAdapterProps) {
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
  const page = Math.max(1, Math.min(document?.numPages ?? Infinity, state.location.page ?? 1));
  const zoom = state.location.zoom ?? 1;
  useEffect(() => {
    let disposed = false;
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
    onSelection(null);
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
      el.scrollTop = position.current * el.scrollHeight;
      restoring.current = false;
      setFailed(false);
      onReady();
      // Warm only immediate neighbors; canvases are reserved for the visible page.
      for (const neighbor of [page - 1, page + 1]) if (neighbor > 0 && neighbor <= document.numPages) void document.getPage(neighbor).catch(() => undefined);
    }).catch(error => { if (!disposed && error?.name !== "RenderingCancelledException") { setFailed(true); restoring.current = false; } });
    return () => { disposed = true; render?.cancel(); layer?.cancel(); };
  }, [document, page, zoom, width, onSelection, onReady]);
  useEffect(() => {
    position.current = state.location.scroll ?? 0;
    if (!restoring.current && scroller.current) scroller.current.scrollTop = position.current * scroller.current.scrollHeight;
  }, [state.location.scroll]);
  useEffect(() => {
    const select = () => {
    const selection = window.getSelection();
    const box = pageElement.current?.getBoundingClientRect();
    if (!selection?.rangeCount || !box || !selection.toString().trim()) return;
    const range = selection.getRangeAt(0);
    if (!text.current?.contains(range.commonAncestorContainer)) return;
    const rects = Array.from(range.getClientRects()).filter(rect => rect.width > 0 && rect.height > 0).map(rect => ({ x: (rect.x - box.x) / box.width, y: (rect.y - box.y) / box.height, width: rect.width / box.width, height: rect.height / box.height }));
    onSelection({ text: selection.toString(), page, rects });
    };
    window.document.addEventListener("selectionchange", select);
    return () => window.document.removeEventListener("selectionchange", select);
  }, [page, onSelection]);
  return <>
    <div className="reader-toolbar">
      <button disabled={!document || page <= 1} onClick={() => onLocation({ page: page - 1, scroll: 0 })}>{t("reader.previous")}</button>
      <label>{t("reader.page")}<input type="number" min="1" max={document?.numPages ?? 1} value={page} onChange={e => onLocation({ page: Math.max(1, Math.min(document?.numPages ?? 1, Number(e.target.value) || 1)), scroll: 0 })} /> / {document?.numPages ?? "…"}</label>
      <button disabled={!document || page >= document.numPages} onClick={() => onLocation({ page: page + 1, scroll: 0 })}>{t("reader.next")}</button>
      <label>{t("reader.zoom")}<input type="range" min="0.75" max="3" step="0.25" value={zoom} onChange={e => onLocation({ zoom: Number(e.target.value) })} /></label>
    </div>
    {failed ? <div role="alert">{t("reader.error")} <button onClick={() => setAttempt(a => a + 1)}>{t("reader.retry")}</button></div> : null}
    {!document && !failed ? <p role="status">{t("reader.loading")}</p> : null}
    <div role="region" aria-label={t("reader.menu")} className="pdf-scroller" ref={scroller} onScroll={e => {
      if (!active || restoring.current) return;
      position.current = e.currentTarget.scrollTop / e.currentTarget.scrollHeight;
      onLocation({ page, zoom, scroll: position.current });
    }}><div className="pdf-page" ref={pageElement}>
      <canvas ref={canvas} /><div className="textLayer" ref={text} />
      <div className="pdf-highlights">{state.annotations.filter(a => a.page === page).flatMap(a => a.rects?.map((rect, index) => <span key={`${a.id}:${index}`} title={a.note} style={{ left: `${rect.x * 100}%`, top: `${rect.y * 100}%`, width: `${rect.width * 100}%`, height: `${rect.height * 100}%` }} />) ?? [])}</div>
    </div></div>
  </>;
}
