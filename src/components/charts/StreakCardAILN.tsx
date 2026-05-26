"use client";
import { trpc } from "@/trpc/client";
import dayjs from "dayjs";
import "dayjs/locale/id";

dayjs.locale("id");

interface StreakCardAILNProps {
  startDate: string; // YYYY-MM-DD — cohort start
  endDate: string; // YYYY-MM-DD — cohort end
  className?: string;
}

const fmtCount = (n: number) =>
  n.toLocaleString("id-ID", { maximumFractionDigits: 0 });

const fmtHours = (n: number) =>
  n.toLocaleString("id-ID", {
    minimumFractionDigits: n % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });

function tierClass(count: number): string {
  if (count === 0) return "bg-gray-200 dark:bg-dashboard-border";
  if (count <= 2) return "bg-red-200 dark:bg-red-500/30";
  if (count <= 4)
    return "bg-red-400 dark:bg-red-500/60 dark:shadow-[0_0_4px_rgba(239,68,68,0.5)]";
  return "bg-red-600 dark:bg-red-500 dark:shadow-[0_0_6px_rgba(239,68,68,0.8)]";
}

export default function StreakCardAILN({
  startDate,
  endDate,
  className,
}: StreakCardAILNProps) {
  const achievementsQ = trpc.ailene.read.achievements.useQuery();
  const streakQ = trpc.ailene.read.streak.useQuery({
    from: startDate,
    to: endDate,
  });

  if (achievementsQ.isLoading || streakQ.isLoading) {
    return (
      <Shell className={className}>
        <div className="h-full min-h-[420px] animate-pulse rounded-md bg-gray-100 dark:bg-dashboard-border" />
      </Shell>
    );
  }
  if (
    achievementsQ.error ||
    streakQ.error ||
    !achievementsQ.data ||
    !streakQ.data
  ) {
    return (
      <Shell className={className}>
        <div className="flex h-full min-h-[420px] items-center justify-center text-sm text-red-500">
          Gagal memuat data.
        </div>
      </Shell>
    );
  }

  const a = achievementsQ.data;
  const days = streakQ.data.days;
  const todayKey = dayjs().format("YYYY-MM-DD");

  // Flatten every day in the cohort window into a single sequence — laid out
  // in a 9-column wrapping grid below.
  const cellByDate = new Map(days.map((d) => [d.date, d.count]));
  type Cell = { date: string; count: number };
  const cells: Cell[] = [];
  let cursor = dayjs(startDate);
  const end = dayjs(endDate);
  while (cursor.isBefore(end) || cursor.isSame(end, "day")) {
    const key = cursor.format("YYYY-MM-DD");
    cells.push({ date: key, count: cellByDate.get(key) ?? 0 });
    cursor = cursor.add(1, "day");
  }

  return (
    <Shell className={className}>
      {/* Top: lifetime achievements */}
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-bold text-foreground dark:text-white">
          Capaian Kamu
        </h3>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        <StatLine
          value={fmtCount(a.use_case_count)}
          label="use case dicatat"
        />
        <StatLine value={fmtCount(a.prompt_count)} label="prompt dicatat" />
        <StatLine
          value={fmtHours(a.hours_saved_total)}
          label="jam dihemat (estimasi)"
          accent="emerald"
        />
      </div>

      {a.tools_mastered.length > 0 && (
        <div className="mt-5">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Telah Menguasai Tools
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {a.tools_mastered.map((t) => (
              <span
                key={t}
                className="rounded-full border border-dashboard-border bg-white px-2.5 py-1 text-xs text-foreground dark:bg-card-inside-bg dark:text-gray-200"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="my-5 h-px bg-dashboard-border" />

      {/* Bottom: streak heatmap — cohort range, rectangular cells */}
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
          Streak Cohort
        </div>
        <div className="mt-3 grid grid-cols-[repeat(9,minmax(0,1fr))] gap-1">
          {cells.map((cell) => {
            const isToday = cell.date === todayKey;
            return (
              <div
                key={cell.date}
                className={`group/cell relative h-3 rounded-[2px] ${tierClass(cell.count)} ${
                  isToday ? "ring-1 ring-red-600 dark:ring-red-400" : ""
                }`}
              >
                <div className="pointer-events-none invisible absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-md transition group-hover/cell:visible group-hover/cell:opacity-100 dark:bg-black dark:ring-1 dark:ring-red-500/40">
                  {dayjs(cell.date).format("D MMM YYYY")} · {cell.count} task
                  <div className="absolute left-1/2 top-full size-0 -translate-x-1/2 border-[4px] border-transparent border-t-gray-900 dark:border-t-black" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}

function StatLine({
  value,
  label,
  accent,
}: {
  value: string;
  label: string;
  accent?: "emerald";
}) {
  const valColor =
    accent === "emerald"
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-foreground dark:text-white";
  return (
    <div className="flex items-baseline gap-2">
      <span className={`font-geist-mono text-3xl font-bold ${valColor}`}>
        {value}
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
    </div>
  );
}

function Shell({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col rounded-xl border border-dashboard-border bg-white p-5 dark:bg-card-bg ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
