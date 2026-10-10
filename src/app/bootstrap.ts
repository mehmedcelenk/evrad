import { getAllDhikrs } from "../data/collection-repository";
import { getCompletionsForDate } from "../data/completion-repository";
import { getPreferences } from "../data/preferences";
import { getResetDateKey } from "../shared/date";
import { AppStore } from "./store";
import { initRouter } from "./router";
import { bindAppShellEvents, renderAppShell } from "./app-shell";

export async function bootstrapApp(rootId = "app"): Promise<void> {
  const root = document.getElementById(rootId);
  if (!root) return;

  const preferences = await getPreferences();
  const dateKey = getResetDateKey(new Date(), preferences.dayResetTime);
  const entries = await getAllDhikrs();
  const completions = await getCompletionsForDate(dateKey);

  const store = new AppStore({
    preferences,
    dateKey,
    entries,
    completions,
  });

  initRouter(store);

  function render() {
    const currentRoot = document.getElementById(rootId);
    if (!currentRoot) return;
    currentRoot.innerHTML = renderAppShell(store);
    bindAppShellEvents(currentRoot, store);
  }

  // Initial render
  render();

  // Re-render when state changes
  store.subscribe(() => {
    render();
  });
}

if (typeof window !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    bootstrapApp();
  });
}
