import { ReactNode } from "react";

interface ScorecardAILNProps {
  title: string;
  value: string | number;
  unit?: string;
  /** Footer content rendered in a divided zone at the bottom of the card. */
  children?: ReactNode;
}

export default function ScorecardAILN({
  title,
  value,
  unit,
  children,
}: ScorecardAILNProps) {
  return (
    <div className="ailn-card flex min-h-40 flex-col overflow-hidden">
      <div className="flex flex-1 flex-col p-5">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {title}
        </div>

        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="font-geist-mono text-4xl font-bold leading-none tracking-tight text-gray-900 dark:text-white">
            {value}
          </span>
          {unit && (
            <span className="text-sm font-medium text-gray-400 dark:text-gray-500">
              {unit}
            </span>
          )}
        </div>
      </div>

      {children && (
        <div className="border-t border-gray-100 px-5 py-3 dark:border-dashboard-border">
          {children}
        </div>
      )}
    </div>
  );
}
