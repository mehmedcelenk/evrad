"use client";

import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { recordKey } from "../core/collections";
import type { TrackableModuleId } from "../core/types";
import { completionRepository } from "../data/completion-repository";
import { useLocalDay } from "./useLocalDay";
import { pushToSupabase } from "../data/supabase/sync-service";
import { getSupabaseConfig } from "../data/supabase/supabase-config";

export const CompletionContext = createContext<ReturnType<typeof useCompletionStore> | null>(null);

export function useCompletionState() {
  const value = useContext(CompletionContext);
  if (!value) throw new Error("RecordLibraryProvider is missing");
  return value;
}

export function useCompletionStore(onError: () => void, resetTime: string) {
  const date = useLocalDay(resetTime);
  const [state, setState] = useState({ date: "", keys: new Set<string>(), failed: false });
  const keysRef = useRef(new Set<string>());
  const pending = useRef(new Set<string>());
  const currentDate = useRef(date);

  useEffect(() => {
    let active = true;
    currentDate.current = date;
    keysRef.current = new Set();
    const load = () => {
      completionRepository.loadKeys(date).then((keys) => {
        if (!active) return;
        keysRef.current = keys;
        setState({ date, keys, failed: false });
      }).catch(() => {
        if (active) { setState({ date, keys: new Set(), failed: true }); onError(); }
      });
    };
    load();
    if (typeof window !== "undefined") {
      window.addEventListener("evrad:user-changed", load);
      window.addEventListener("evrad:synced", load);
    }
    return () => {
      active = false;
      currentDate.current = "";
      if (typeof window !== "undefined") {
        window.removeEventListener("evrad:user-changed", load);
        window.removeEventListener("evrad:synced", load);
      }
    };
  }, [date, onError]);

  const toggle = useCallback(async (moduleId: TrackableModuleId, itemId: string) => {
    const key = recordKey(moduleId, itemId);
    const operationKey = `${date}:${key}`;
    if (state.date !== date || state.failed || pending.current.has(operationKey)) return;
    pending.current.add(operationKey);
    const wasComplete = keysRef.current.has(key);
    const publish = (complete: boolean) => {
      if (currentDate.current !== date) return;
      const keys = new Set(keysRef.current);
      if (complete) keys.add(key); else keys.delete(key);
      keysRef.current = keys;
      setState({ date, keys, failed: false });
    };
    publish(!wasComplete);
    try {
      await completionRepository.set(moduleId, itemId, date, !wasComplete);
      const cfg = getSupabaseConfig();
      if (cfg.autoSync && cfg.url && cfg.anonKey && cfg.syncKey) {
        void pushToSupabase().catch(() => {});
      }
    } catch {
      publish(wasComplete);
      onError();
    } finally {
      pending.current.delete(operationKey);
    }
  }, [date, onError, state.date, state.failed]);

  return useMemo(() => ({ ready: state.date === date, failed: state.failed,
    keys: state.date === date ? state.keys : new Set<string>(), toggle }), [date, state, toggle]);
}
