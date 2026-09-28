"use client";

import { useState } from "react";
import { ModuleScreenHeader } from "../../components/ModuleScreenHeader";
import { RecordFilters } from "../../components/RecordFilters";
import { SearchBar } from "../../components/SearchBar";
import { StorageLoading } from "../../components/StorageLoading";
import { TrackableModuleLayout } from "../../components/TrackableModuleLayout";
import { t } from "../../core/i18n";
import { recordKey } from "../../core/collections";
import { useExpandableItems } from "../../hooks/useExpandableItems";
import { useRecordFilters } from "../../hooks/useRecordFilters";
import { discoveryCatalog } from "./discovery-catalog";
import { DiscoveryDevotionalCard } from "./DiscoveryDevotionalCard";
import { useDiscovery } from "./useDiscovery";

export function DiscoveryScreen() {
  const library = useDiscovery();
  const filters = useRecordFilters();
  const expansion = useExpandableItems();
  const [searchQuery, setSearchQuery] = useState("");

  const normalizedQuery = searchQuery.trim().toLocaleLowerCase("tr");

  const visible = discoveryCatalog.filter(({ moduleId, item }) => {
    if (!filters.matches(item, moduleId)) return false;
    if (!normalizedQuery) return true;

    return [item.name, item.arabic, item.translation, item.details, item.source]
      .some((text) => text?.toLocaleLowerCase("tr").includes(normalizedQuery));
  });

  return (
    <TrackableModuleLayout
      header={
        <ModuleScreenHeader
          title={t("discover.bag.title")}
          eyebrow={t("space.discoverEyebrow")}
          tagline={t("space.discoverTagline")}
          filters={<RecordFilters filters={filters} />}
        />
      }
      toolbar={<SearchBar value={searchQuery} onChange={setSearchQuery} />}
      loading={!library.ready}
      hasItems
      loadingState={<StorageLoading label={t("loading.generic", { module: t("menu.discover") })} />}
      emptyState={null}
    >
      {library.failed ? (
        <p role="alert">{t("toast.storageError")}</p>
      ) : (
        visible.map(({ moduleId, item }) => {
          const key = recordKey(moduleId, item.id);
          return (
            <DiscoveryDevotionalCard
              key={key}
              moduleId={moduleId}
              item={item}
              expanded={expansion.expandedIds.has(key)}
              onToggle={() => expansion.toggleExpanded(key)}
              added={library.includes(moduleId, item.id, "virds")}
              liked={library.includes(moduleId, item.id, "favorites")}
              onAdd={() => void library.toggle(moduleId, item, "virds")}
              onLike={() => void library.toggle(moduleId, item, "favorites")}
            />
          );
        })
      )}
      {!library.failed && !visible.length ? (
        <p className="filter-empty">
          {t("empty.simple")}
        </p>
      ) : null}
    </TrackableModuleLayout>
  );
}
