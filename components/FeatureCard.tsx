import { ReactNode } from "react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon?: ReactNode;
}

export function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <div className="surface-card flex flex-col gap-3 p-5">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-accent/10 text-accent">
        {icon ?? <span className="text-sm">*</span>}
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold tracking-tight text-text-main">{title}</h3>
        <p className="text-xs leading-relaxed text-text-muted">{description}</p>
      </div>
    </div>
  );
}
