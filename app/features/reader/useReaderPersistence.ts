"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReaderState } from "../../core/reader";
import { saveReaderState } from "../../data/reader-repository";

export function useReaderPersistence(initial: ReaderState) {
  const [state, setState] = useState(initial);
  const [failed, setFailed] = useState(false);
  const latest = useRef(initial);
  const saved = useRef(initial);
  const queue = useRef(Promise.resolve(true));
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flush = useCallback(() => {
    clearTimeout(timer.current);
    const snapshot = latest.current;
    queue.current = queue.current.then(async () => {
      if (snapshot === saved.current) return true;
      try { await saveReaderState(snapshot); saved.current = snapshot; setFailed(false); return true; }
      catch { setFailed(true); return false; }
    });
    return queue.current;
  }, []);
  const update = useCallback((transform: (state: ReaderState) => ReaderState) => {
    latest.current = transform(latest.current);
    setState(latest.current);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), 250);
  }, [flush]);
  useEffect(() => {
    const save = () => { void flush(); };
    document.addEventListener("visibilitychange", save);
    window.addEventListener("pagehide", save);
    return () => { document.removeEventListener("visibilitychange", save); window.removeEventListener("pagehide", save); void flush(); };
  }, [flush]);
  return { state, update, flush, failed };
}
