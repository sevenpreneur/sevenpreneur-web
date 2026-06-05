import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface SectionContainerCMSProps {
  title: string;
  icon?: LucideIcon;
  headerAction?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function SectionContainerCMS({
  title,
  icon: Icon,
  headerAction,
  children,
  className,
}: SectionContainerCMSProps) {
  return (
    <div
      className={`flex flex-col gap-3 p-4 bg-card-bg border border-dashboard-border rounded-lg ${className ?? ""}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="size-4 text-emphasis" />}
          <h2 className=" font-bold text-foreground dark:text-sevenpreneur-white">
            {title}
          </h2>
        </div>
        {headerAction}
      </div>
      {children}
    </div>
  );
}
