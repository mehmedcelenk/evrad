"use client";
import { createContext, useContext } from "react";
export const ReaderContext = createContext<{
  open: (id?: string) => Promise<void>;
  close: () => Promise<boolean>;
  active: boolean;
} | null>(null);
export function useReader() {
  const context = useContext(ReaderContext);
  if (!context) throw new Error("ReaderProvider missing");
  return context;
}
