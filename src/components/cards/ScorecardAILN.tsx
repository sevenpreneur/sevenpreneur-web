import { ReactNode } from "react";

interface ScorecardAILNProps {
  title: string;
  value: string | number;
  unit?: string;
  children?: ReactNode;
}

export default function ScorecardAILN({
  title,
  value,
  unit,
  children,
}: ScorecardAILNProps) {
  return (
    <div className="relative flex min-h-40 flex-col rounded-lg border border-dashboard-border bg-white p-4 shadow-sm dark:bg-card-bg dark:shadow-[0_0_16px_rgba(0,53,157,0.06)]">
      <div className="text-[11px] font-semibold tracking-widest text-gray-500 dark:text-gray-400">
        {title}
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="font-geist-mono text-4xl font-bold leading-none text-gray-900 dark:text-white">
          {value}
        </span>
        {unit && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {unit}
          </span>
        )}
      </div>

      {children && <div className="mt-auto pt-3">{children}</div>}
    </div>
  );
}
