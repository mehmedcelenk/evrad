"use client";
import { Component, type ReactNode } from "react";
import { t } from "../../core/i18n";

export class ReaderErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <div role="alert"><p>{t("reader.error")}</p><button onClick={() => window.location.reload()}>{t("reader.retry")}</button></div>;
  }
}
