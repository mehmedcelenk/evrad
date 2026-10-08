import { readBackupPayload } from "../../data/backup-repository";
import type { BackupEnvelope, BackupSaveResult } from "../../core/backup";

const MIME_TYPE = "application/json";

function bytesToHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function createEnvelope(): Promise<BackupEnvelope> {
  const payload = await readBackupPayload();
  const serializedPayload = JSON.stringify(payload);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(serializedPayload));
  return {
    format: "zikirlerim-backup",
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    checksum: bytesToHex(digest),
    payload,
  };
}

function backupFilename(date = new Date()): string {
  const part = (value: number) => String(value).padStart(2, "0");
  return `Virdlerim-${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}-${part(date.getHours())}${part(date.getMinutes())}.zikirlerim`;
}

function download(file: File): void {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function saveBackup(): Promise<BackupSaveResult> {
  const envelope = await createEnvelope();
  const file = new File([JSON.stringify(envelope, null, 2)], backupFilename(), { type: MIME_TYPE });
  const shareData = { files: [file], title: "Virdlerim yedeği" };

  if (navigator.share && navigator.canShare?.(shareData)) {
    try {
      await navigator.share(shareData);
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
    }
  }

  download(file);
  return "downloaded";
}

export async function parseBackupFile(content: string): Promise<BackupEnvelope> {
  const envelope = JSON.parse(content) as BackupEnvelope;
  if (!envelope || envelope.format !== "zikirlerim-backup" || !envelope.payload) {
    throw new Error("Invalid backup file format");
  }
  return envelope;
}

export async function restoreBackupFromFile(file: File) {
  const text = await file.text();
  const envelope = await parseBackupFile(text);
  const { restoreBackupPayload } = await import("../../data/backup-repository");
  return restoreBackupPayload(envelope.payload);
}
