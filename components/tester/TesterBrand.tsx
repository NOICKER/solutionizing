import { testerHeadingFont } from "@/components/tester/testerTheme";

interface TesterBrandProps {
  readonly compact?: boolean;
  readonly className?: string;
}

export function TesterBrand({ compact = false, className }: Readonly<TesterBrandProps>) {
  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`.trim()}>
      <div
        className={`flex items-center justify-center rounded-2xl bg-tester-terracotta text-white shadow-[0_12px_24px_rgba(217,119,87,0.2)] ${
          compact ? "h-9 w-9" : "h-10 w-10"
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">analytics</span>
      </div>
      <span className={`${testerHeadingFont.className} text-lg font-extrabold tracking-tight text-tester-ink`}>
        Solutionizing
      </span>
    </div>
  );
}