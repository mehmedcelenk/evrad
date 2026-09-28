"use client";

import { useState } from "react";
import { AppShell } from "../AppShell";
import { mainSections, type MainSection, type NavigationTarget } from "../core/module-registry";
import type { DevotionalDraft } from "../core/types";
import { CollectionScreen } from "../features/collections/CollectionScreen";
import { RecordCreateScreen } from "../features/collections/RecordCreateScreen";
import { DiscoveryScreen } from "../features/discovery/DiscoveryScreen";
import { SettingsScreen } from "../features/settings/SettingsScreen";
import { useSectionPager } from "../hooks/useSectionPager";

export function MainSectionsView({ initialSection }: { initialSection: NavigationTarget }) {
  const { viewportRef, activeSection, navigationSection, selectSection } = useSectionPager(initialSection === "create" ? "virds" : initialSection);
  const [createDraft, setCreateDraft] = useState<DevotionalDraft | null | undefined>(initialSection === "create" ? null : undefined);
  const [previousInitial, setPreviousInitial] = useState(initialSection);
  if (previousInitial !== initialSection) {
    setPreviousInitial(initialSection);
    setCreateDraft(initialSection === "create" ? null : undefined);
  }
  const index = mainSections.findIndex((section) => section.id === activeSection);
  const neighbors = mainSections.filter((_, position) => Math.abs(position - index) <= 1).map((section) => section.id);
  const [mounted, setMounted] = useState<MainSection[]>(neighbors);
  // Keep visited screen state; prepare immediate neighbors for native swipes.
  if (neighbors.some((section) => !mounted.includes(section))) setMounted([...new Set([...mounted, ...neighbors])]);
  const closeCreate = () => {
    setCreateDraft(undefined);
    selectSection(activeSection, false);
  };

  return <AppShell section={createDraft !== undefined ? "create" : navigationSection}
    onSelectSection={(section) => { if (section !== "create") selectSection(section); }}
    onOpenDetailed={setCreateDraft}>
    <div ref={viewportRef} className="main-swipe-viewport">
      {mainSections.map(({ id }) => <div key={id} className="main-swipe-page" data-section={id}
        data-active={activeSection === id} inert={activeSection !== id}>
        {mounted.includes(id) ? (
          id === "settings" ? <SettingsScreen active={activeSection === id} /> :
          id === "discover" ? <DiscoveryScreen /> : <CollectionScreen collection={id} />
        ) : null}
      </div>)}
    </div>
    {createDraft !== undefined ? <RecordCreateScreen initialDraft={createDraft ?? undefined} onClose={closeCreate} /> : null}
  </AppShell>;
}
