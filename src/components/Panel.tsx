import type { ReactNode } from 'react';

type PanelProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
};

export default function Panel({ title, description, action, children }: PanelProps) {
  return (
    <section className="card panel">
      <header className="panel-header">
        <div>
          <h3>{title}</h3>
          {description && <p className="muted">{description}</p>}
        </div>
        {action}
      </header>
      <div className="panel-body">{children}</div>
    </section>
  );
}
