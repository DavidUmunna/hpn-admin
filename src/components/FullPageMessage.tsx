import type { ReactNode } from 'react';

type FullPageMessageProps = {
  title?: string;
  message?: string;
  loading?: boolean;
  actionSlot?: ReactNode;
};

export default function FullPageMessage({ title, message, loading, actionSlot }: FullPageMessageProps) {
  return (
    <div className="full-page-state">
      {loading && <div className="spinner" aria-label="Loading" />}
      {title && <h2>{title}</h2>}
      {message && <p className="muted">{message}</p>}
      {actionSlot}
    </div>
  );
}
