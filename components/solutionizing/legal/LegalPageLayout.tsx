import Link from "next/link";
import type { ReactNode } from "react";

export function LegalPageLayout({
  title,
  intro,
  lastUpdated,
  children,
}: {
  title: string;
  intro: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-neutral-bg px-6 py-14">
      <div className="mx-auto max-w-3xl rounded-panel border border-secondary/15 bg-white p-8 shadow-card-soft lg:p-10">
        <Link href="/" className="text-sm font-semibold text-primary hover:underline">
          Back to home
        </Link>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-text-main">{title}</h1>
        <p className="mt-4 text-base leading-relaxed text-text-main/65">{intro}</p>
        <p className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-text-main/45">
          Last updated: {lastUpdated}
        </p>

        <div className="mt-8 space-y-8 text-base leading-relaxed text-text-main/70">{children}</div>
      </div>
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-bold text-text-main">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-6">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
