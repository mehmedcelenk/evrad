"use client";

import { useState, type ReactNode } from "react";
import { Accordion } from "./Accordion";
import { ChevronDown } from "lucide-react";
import { t } from "../core/i18n";

export function ModuleScreenHeader({
  eyebrow,
  title,
  tagline,
  categoryFilters,
  filters,
}: {
  eyebrow: string;
  title: string;
  tagline?: string;
  categoryFilters?: ReactNode;
  filters?: ReactNode;
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <header className="screen-heading">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <div className="screen-heading-row">
        <h1 className="screen-heading-title">{title}</h1>
        {categoryFilters}
        {filters ? (
          <button
            className="filter-toggle"
            type="button"
            aria-label={t("filter.contexts")}
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <ChevronDown aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {tagline ? <p className="dayline">{tagline}</p> : null}
      {filters ? (
        <Accordion open={filtersOpen} className="header-filters-accordion">{filters}</Accordion>
      ) : null}
    </header>
  );
}

