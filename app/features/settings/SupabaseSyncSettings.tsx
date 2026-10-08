"use client";

import { useState, useRef, useId } from "react";
import { t } from "../../core/i18n";
import { useAppRuntime } from "../../core/AppRuntimeContext";
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  generateSyncKey,
  getLastSyncedAt,
  DEFAULT_SQL_SCHEMA,
} from "../../data/supabase/supabase-config";
import { testSupabaseConnection } from "../../data/supabase/supabase-client";
import { pushToSupabase, pullFromSupabase } from "../../data/supabase/sync-service";
import { saveBackup, restoreBackupFromFile } from "../backup/backup-file";
import { SettingsSwitch } from "./SettingsControls";

export function SupabaseSyncSettings() {
  const { showToast } = useAppRuntime();
  const [config, setConfig] = useState(getSupabaseConfig);
  const [lastSync, setLastSync] = useState<string | null>(getLastSyncedAt);
  const [isPending, setIsPending] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const urlInputId = useId();
  const keyInputId = useId();
  const syncKeyInputId = useId();

  const handleUpdate = (field: "url" | "anonKey" | "syncKey", value: string) => {
    const next = { ...config, [field]: value };
    setConfig(next);
    saveSupabaseConfig({ [field]: value });
  };

  const handleToggleAutoSync = () => {
    const next = !config.autoSync;
    setConfig((prev) => ({ ...prev, autoSync: next }));
    saveSupabaseConfig({ autoSync: next });
  };

  const handleGenerateKey = () => {
    const newKey = generateSyncKey();
    handleUpdate("syncKey", newKey);
    showToast(`Yeni senkronizasyon anahtarı oluşturuldu: ${newKey}`);
  };

  const handleTest = async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      const res = await testSupabaseConnection();
      showToast(res.message);
    } finally {
      setIsPending(false);
    }
  };

  const handlePush = async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      const res = await pushToSupabase();
      showToast(res.message);
      if (res.ok && res.timestamp) setLastSync(res.timestamp);
    } finally {
      setIsPending(false);
    }
  };

  const handlePull = async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      const res = await pullFromSupabase();
      showToast(res.message);
      if (res.ok) {
        if (res.timestamp) setLastSync(res.timestamp);
        window.setTimeout(() => window.location.reload(), 1200);
      }
    } finally {
      setIsPending(false);
    }
  };

  const handleExportFile = async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      await saveBackup();
      showToast("Yedek dosyası indirildi.");
    } catch {
      showToast("Yedekleme başarısız oldu.");
    } finally {
      setIsPending(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsPending(true);
    try {
      const res = await restoreBackupFromFile(file);
      showToast(t("settings.restoreSuccess", { count: res.restoredEntities }));
      window.setTimeout(() => window.location.reload(), 1200);
    } catch {
      showToast(t("settings.restoreError"));
    } finally {
      setIsPending(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCopySql = () => {
    navigator.clipboard?.writeText(DEFAULT_SQL_SCHEMA);
    showToast(t("settings.schemaCopied"));
  };

  return (
    <div className="settings-stack">
      <section className="settings-sync-panel" aria-labelledby="sync-section-title">
        <div className="settings-section-header">
          <h2 id="sync-section-title" className="settings-section-title">
            {t("settings.syncSection")}
          </h2>
          <p className="settings-section-subtitle">{t("settings.syncHint")}</p>
        </div>

        <div className="settings-flat-group">
          <div className="settings-input-group">
            <label htmlFor={urlInputId} className="settings-flat-label">{t("settings.supabaseUrl")}</label>
            <input
              id={urlInputId}
              type="url"
              className="settings-text-input"
              placeholder="https://xyzcompany.supabase.co"
              value={config.url}
              onChange={(e) => handleUpdate("url", e.target.value)}
            />
          </div>

          <div className="settings-input-group">
            <label htmlFor={keyInputId} className="settings-flat-label">{t("settings.supabaseKey")}</label>
            <input
              id={keyInputId}
              type="password"
              className="settings-text-input"
              placeholder="eyJhbGciOi..."
              value={config.anonKey}
              onChange={(e) => handleUpdate("anonKey", e.target.value)}
            />
          </div>

          <div className="settings-input-group">
            <div className="settings-label-row">
              <label htmlFor={syncKeyInputId} className="settings-flat-label">{t("settings.syncKey")}</label>
              <button type="button" className="settings-inline-action" onClick={handleGenerateKey}>
                {t("settings.generateNewKey")}
              </button>
            </div>
            <input
              id={syncKeyInputId}
              type="text"
              className="settings-text-input"
              placeholder="EVR-XXXXXX"
              value={config.syncKey}
              onChange={(e) => handleUpdate("syncKey", e.target.value.toUpperCase())}
            />
          </div>

          <SettingsSwitch
            label={t("settings.autoSyncTitle")}
            checked={config.autoSync}
            onToggle={handleToggleAutoSync}
          />
        </div>

        <div className="settings-sync-actions">
          <button
            type="button"
            className="settings-sync-btn"
            disabled={isPending || !config.url || !config.anonKey}
            onClick={handleTest}
          >
            {t("settings.testConnection")}
          </button>
          <button
            type="button"
            className="settings-sync-btn is-primary"
            disabled={isPending || !config.url || !config.anonKey || !config.syncKey}
            onClick={handlePush}
          >
            {t("settings.pushToCloud")}
          </button>
          <button
            type="button"
            className="settings-sync-btn"
            disabled={isPending || !config.url || !config.anonKey || !config.syncKey}
            onClick={handlePull}
          >
            {t("settings.pullFromCloud")}
          </button>
        </div>

        <p className="settings-sync-status">
          {lastSync
            ? t("settings.lastSynced", { date: new Date(lastSync).toLocaleString("tr-TR") })
            : t("settings.neverSynced")}
        </p>

        <div className="settings-help-accordion">
          <button
            type="button"
            className="settings-accordion-trigger"
            aria-expanded={showSql}
            onClick={() => setShowSql((prev) => !prev)}
          >
            <span>{t("settings.schemaHelp")}</span>
            <span className={`accordion-caret${showSql ? " is-open" : ""}`} aria-hidden="true">▾</span>
          </button>
          {showSql ? (
            <div className="settings-accordion-content">
              <pre className="settings-sql-code">{DEFAULT_SQL_SCHEMA}</pre>
              <button type="button" className="settings-sql-copy-btn" onClick={handleCopySql}>
                SQL Şemasını Kopyala
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <section className="settings-backup-panel" aria-labelledby="backup-section-title">
        <div className="settings-section-header">
          <h2 id="backup-section-title" className="settings-section-title">
            {t("settings.fileBackupSection")}
          </h2>
        </div>
        <div className="settings-backup-actions">
          <button type="button" className="settings-sync-btn" disabled={isPending} onClick={handleExportFile}>
            {t("settings.exportFile")}
          </button>
          <button
            type="button"
            className="settings-sync-btn"
            disabled={isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            {t("settings.importFile")}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zikirlerim,.json,application/json"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>
      </section>
    </div>
  );
}
