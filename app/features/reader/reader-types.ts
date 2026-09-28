import type { BookAsset, ReaderAnnotation, ReaderLocation, ReaderState } from "../../core/reader";
export interface ReaderAdapterProps {
  asset: BookAsset;
  state: ReaderState;
  active: boolean;
  onReady: () => void;
  onLocation: (location: ReaderLocation) => void;
  onSelection: (selection: Omit<ReaderAnnotation, "id" | "note"> | null) => void;
}
