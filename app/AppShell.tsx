"use client";

import { ReaderProvider } from "./features/reader/ReaderProvider";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { t } from "./core/i18n";
import type { NavigationTarget } from "./core/module-registry";
import { BottomNavigation } from "./components/BottomNavigation";
import { AppNotifications } from "./components/AppNotifications";
import { AppRuntimeContext } from "./core/AppRuntimeContext";
import { usePwaUpdate } from "./hooks/usePwaUpdate";
import { useBackupExport } from "./features/backup/useBackupExport";
import { usePersistentStorage } from "./hooks/usePersistentStorage";
import { AppFooter } from "./components/AppFooter";
import { QuickAddModal } from "./components/QuickAddModal";
import { useScrollDirection } from "./hooks/useScrollDirection";

import { usePreferences } from "./hooks/usePreferences";
import { RecordLibraryProvider } from "./components/RecordLibraryProvider";

import type { DevotionalDraft } from "./core/types";

export function AppShell({
  children,
  section,
  onSelectSection,
  onOpenDetailed,
}: {
  children: ReactNode;
  section: NavigationTarget;
  onSelectSection?: (section: NavigationTarget) => void;
  onOpenDetailed?: (draft: DevotionalDraft) => void;
}) {
  const { updateReady, activateUpdate } = usePwaUpdate();
  const [toast, setToast] = useState<string | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const isScrolledDown = useScrollDirection();
  const showToast = useCallback((message: string) => setToast(message), []);
  const onStorageError = useCallback(() => showToast(t("toast.storageError")), [showToast]);
  const preferences = usePreferences(onStorageError);
  const runtimeValue = useMemo(() => ({ showToast, ...preferences }), [showToast, preferences]);

  const backup = useBackupExport(() => showToast(t("backup.error")));
  usePersistentStorage();

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  return (
    <AppRuntimeContext.Provider value={runtimeValue}>
      <RecordLibraryProvider>
        <ReaderProvider><main className="app-shell">
          <div className="ambient ambient-one" />
          <div className="ambient ambient-two" />
          {children}
          <AppFooter
            label={t("backup.save")}
            saving={backup.saving}
            onBackup={() => void backup.exportBackup()}
          />
          <BottomNavigation
            section={section}
            onSelectSection={onSelectSection}
            onOpenQuickAdd={() => setQuickAddOpen(true)}
            isScrolledHidden={isScrolledDown && !quickAddOpen}
          />
          <QuickAddModal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} onOpenDetailed={onOpenDetailed} />
          <AppNotifications message={toast} updateReady={updateReady} onActivateUpdate={activateUpdate} />
        </main></ReaderProvider>
      </RecordLibraryProvider>
    </AppRuntimeContext.Provider>
  );
}
