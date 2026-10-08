import type { BookAsset, ReaderLocation, ReaderState } from "../../core/reader";
export interface ReaderAdapterProps {
  asset: BookAsset;
  state: ReaderState;
  active: boolean;
  onReady: () => void;
  onLocation: (location: ReaderLocation) => void;
}
