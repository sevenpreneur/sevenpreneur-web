import { ReactNode } from "react";

interface ScorecardDashboardAILNProps {
  title: string;
  value: ReactNode;
  icon: ReactNode;
  iconClassName?: string;
  children?: ReactNode;
}

export default function ScorecardDashboardAILN({
  title,
  value,
  icon,
  iconClassName,
  children,
}: ScorecardDashboardAILNProps) {
  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg border border-dashboard-border bg-card-bg">
      <div className="flex items-start gap-3">
        <div
          className={`flex items-center justify-center size-10 rounded-md shrink-0 ${iconClassName ?? "bg-primary"}`}
        >
          {icon}
        </div>
        <div className="flex flex-col">
          <p className="font-geist-sans text-sm font-semibold text-emphasis leading-tight">
            {title}
          </p>
          <p className="font-geist-sans font-bold text-base text-sevenpreneur-coal dark:text-white">
            {value}
          </p>
        </div>
      </div>
      {children && <div className="w-full pt-1">{children}</div>}
    </div>
  );
}
