import type { DevotionalModuleId, TrackableModuleDefinition, TrackableModuleId } from "./types";

export const appSections = [
  { id: "virds", route: "/virdlerim", label: "menu.virds", icon: "virds" },
] as const;
export type AppSection = typeof appSections[number]["id"];
export const mainSections = [...appSections, { id: "settings", route: "/ayarlar", label: "menu.settings", icon: "settings" }] as const;
export type MainSection = typeof mainSections[number]["id"];
export type NavigationTarget = MainSection | "create";
export const createRecordRoute = "/virdlerim/yeni";

export function getSectionRoute(section: NavigationTarget) {
  if (section === "create") return createRecordRoute;
  return mainSections.find((item) => item.id === section)!.route;
}

export const modules = [
  createTrackableModule("prayers", "devotional", "prayer", "/dualar", "menu.prayers", "menu.addPrayer"),
  createTrackableModule("books", "books", "book", "/kitaplar", "menu.books", "menu.addBook"),
  createTrackableModule("memorization", "devotional", "memory", "/ezberler", "menu.memorization", "menu.addMemorization"),
  createTrackableModule("dhikr", "devotional", "dhikr", "/zikirler", "menu.dhikr", "menu.addDhikr"),
  createTrackableModule("poetry", "devotional", "poetry", "/siirler", "menu.poetry", "menu.addPoetry"),
] as const satisfies readonly TrackableModuleDefinition[];

// Storage identities stay stable even when the visible navigation changes.
export const devotionalModuleIds = modules.filter((module) => module.kind === "devotional").map((module) => module.id as DevotionalModuleId);
export const trackableModuleIds = modules.filter((module) => module.kind === "devotional" || module.kind === "books").map((module) => module.id as TrackableModuleId);

function createTrackableModule(
  id: TrackableModuleId,
  kind: TrackableModuleDefinition["kind"],
  icon: TrackableModuleDefinition["icon"],
  route: string,
  menu: TrackableModuleDefinition["copy"]["menu"],
  addLabel: TrackableModuleDefinition["create"]["label"],
): TrackableModuleDefinition {
  const copyPrefix = `module.${id}` as const;
  return {
    id,
    storeName: id === "dhikr" ? "dhikrs" : id,
    kind,
    icon,
    route,
    create: { route: `${route}/yeni`, label: addLabel },
    copy: {
      menu,
      title: `${copyPrefix}.title`,
      singular: `${copyPrefix}.singular`,
      eyebrow: `${copyPrefix}.eyebrow`,
      tagline: `${copyPrefix}.tagline`,
    },
  } as TrackableModuleDefinition;
}

export function getModule(id: TrackableModuleId): TrackableModuleDefinition {
  const definition = modules.find((candidate) => candidate.id === id);
  if (!definition) throw new Error(`Unknown module: ${id}`);
  return definition;
}

export function getTrackableModule(id: TrackableModuleId): TrackableModuleDefinition {
  return getModule(id);
}
