import { ReactNode } from "react";

interface PillarSectionProps {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export function PillarSection({
  eyebrow,
  title,
  description,
  children
}: PillarSectionProps) {
  return (
    <section className="border-b border-border-subtle/60 bg-background">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-7 max-w-2xl space-y-3">
          <div className="heading-eyebrow">{eyebrow}</div>
          <h2 className="text-xl font-semibold tracking-tight text-text-main">
            {title}
          </h2>
          {description ? (
            <p className="text-sm leading-relaxed text-text-muted">{description}</p>
          ) : null}
        </div>
        {children}
      </div>
    </section>
  );
}

