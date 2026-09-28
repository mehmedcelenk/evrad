import type { ReactNode } from "react";

interface TrackableModuleLayoutProps {
  header: ReactNode;
  loading: boolean;
  hasItems: boolean;
  loadingState: ReactNode;
  errorState?: ReactNode;
  emptyState: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  status?: ReactNode;
  toolbar?: ReactNode;
}

export function TrackableModuleLayout({
  header,
  loading,
  hasItems,
  loadingState,
  errorState,
  emptyState,
  children,
  footer,
  status,
  toolbar,
}: TrackableModuleLayoutProps) {
  return (
    <>
      <section className="module-screen">
        {header}
        {!loading ? toolbar : null}
        {loading ? loadingState : errorState ?? (hasItems ? <div className="trackable-list">{children}</div> : emptyState)}
        {footer}
      </section>
      {status}
    </>
  );
}
