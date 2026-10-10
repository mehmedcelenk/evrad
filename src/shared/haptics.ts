export function triggerHaptic(enabled = true, durationMs = 15): void {
  if (!enabled || typeof window === "undefined" || !("vibrate" in navigator)) return;
  try {
    navigator.vibrate(durationMs);
  } catch {
    // Ignore unsupported device errors
  }
}
