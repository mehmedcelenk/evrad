import type { AppStore } from "./store";
import type { NavigationTarget } from "../shared/types";

export function initRouter(store: AppStore): void {
  if (typeof window === "undefined") return;

  function handleRoute() {
    const hash = window.location.hash.replace("#", "");
    const target: NavigationTarget = hash === "settings" || hash === "ayarlar" ? "settings" : "virds";
    if (store.getState().activeSection !== target) {
      store.setState(() => ({ activeSection: target }));
    }
  }

  window.addEventListener("hashchange", handleRoute);
  handleRoute();
}

export function navigateTo(target: NavigationTarget): void {
  if (typeof window === "undefined") return;
  if (target === "settings") {
    window.location.hash = "ayarlar";
  } else {
    window.location.hash = "virds";
  }
}
