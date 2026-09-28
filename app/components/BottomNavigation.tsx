"use client";

import type { ReactNode } from "react";
import { BookOpen, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { t, type TranslationKey } from "../core/i18n";
import { appSections, getSectionRoute, type NavigationTarget } from "../core/module-registry";
import { useReader } from "../features/reader/useReader";
import { NavigationGlyph } from "./NavigationGlyph";

function NavigationLink({ target, label, selected, className, onSelect, children }: {
  target: NavigationTarget; label: TranslationKey; selected: boolean; className: string;
  onSelect?: () => void; children: ReactNode;
}) {
  return <Link href={getSectionRoute(target)} className={`${className}${selected ? " is-selected" : ""}`}
    aria-label={t(label)} aria-current={selected ? "page" : undefined} title={t(label)} onClick={(event) => {
      if (onSelect && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        onSelect();
      }
    }}>{children}</Link>;
}

export function BottomNavigation({ section, onSelectSection, onOpenQuickAdd, isScrolledHidden = false }: {
  section: NavigationTarget;
  onSelectSection?: (section: NavigationTarget) => void;
  onOpenQuickAdd?: () => void;
  isScrolledHidden?: boolean;
}) {
  const reader = useReader();
  const select = (target: NavigationTarget) => onSelectSection ? () => onSelectSection(target) : undefined;
  return <nav className={`bottom-navigation${isScrolledHidden ? " is-scrolled-hidden" : ""}`} aria-label={t("menu.label")} inert={isScrolledHidden}>
    <div className="bottom-base-row">
      <div className="bottom-space-segment">
        {appSections.map((item) => <NavigationLink key={item.id} target={item.id} label={item.label}
          selected={section === item.id} className="bottom-space-option" onSelect={select(item.id)}>
          <NavigationGlyph name={item.icon} />
        </NavigationLink>)}
      </div>
      <button type="button" className="bottom-nav-button" aria-label={t("reader.menu")} title={t("reader.menu")} onClick={() => void reader.open()}><BookOpen className="navigation-glyph" aria-hidden="true" /></button>
      <NavigationLink target="create" label="menu.addBag" selected={section === "create"} className="bottom-nav-button bottom-add" onSelect={onOpenQuickAdd}>
        <Plus className="navigation-glyph" aria-hidden="true" strokeWidth={1.8} />
      </NavigationLink>
      <NavigationLink target="settings" label="menu.settings" selected={section === "settings"} className="bottom-nav-button bottom-settings" onSelect={select("settings")}>
        <Settings className="navigation-glyph" aria-hidden="true" strokeWidth={1.8} />
      </NavigationLink>
    </div>
  </nav>;
}
