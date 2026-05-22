"use client";
import { trpc } from "@/trpc/client";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { Flame } from "lucide-react";

dayjs.locale("id");

interface StreakCardAILNProps {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  className?: string;
}

function tierClass(count: number): string {
  if (count === 0) return "bg-gray-200 dark:bg-dashboard-border";
  if (count <= 2) return "bg-red-200 dark:bg-red-500/30";
  if (count <= 4)
    return "bg-red-400 dark:bg-red-500/60 dark:shadow-[0_0_4px_rgba(239,68,68,0.5)]";
  return "bg-red-600 dark:bg-red-500 dark:shadow-[0_0_6px_rgba(239,68,68,0.8)]";
}

export default function StreakCardAILN(props: StreakCardAILNProps) {
  const q = trpc.ailene.read.streak.useQuery({
    from: props.startDate,
    to: props.endDate,
  });

  if (q.isLoading) {
    return (
      <StatShell title="STREAK 45 HARI TERAKHIR" className={props.className}>
        <CardLoading />
      </StatShell>
    );
  }
  if (q.error || !q.data) {
    return (
      <StatShell title="STREAK 45 HARI TERAKHIR" className={props.className}>
        <CardError />
      </StatShell>
    );
  }

  const { days } = q.data;
  const todayKey = dayjs().format("YYYY-MM-DD");

  const start = dayjs(props.startDate);
  const end = dayjs(props.endDate);
  const dayMap = new Map(days.map((d) => [d.date, d.count]));

  // Flatten every day in [start, end] into a single sequence — laid out in a
  // 15-column grid below, wrapping to new rows as needed.
  type Cell = { date: string; count: number };
  const cells: Cell[] = [];
  let cursor = start;
  while (cursor.isBefore(end) || cursor.isSame(end, "day")) {
    const key = cursor.format("YYYY-MM-DD");
    cells.push({ date: key, count: dayMap.get(key) ?? 0 });
    cursor = cursor.add(1, "day");
  }

  return (
    <StatShell title="STREAK 45 HARI TERAKHIR" className={props.className}>
      <div className="mt-4 grid grid-cols-[repeat(9,minmax(0,1fr))] gap-1">
        {cells.map((cell) => {
          const isToday = cell.date === todayKey;
          return (
            <div
              key={cell.date}
              className={`group/cell relative aspect-square rounded-[2px] ${tierClass(cell.count)} ${
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
    </StatShell>
  );
}

function StatShell({
  title,
  className = "",
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex h-full flex-col gap-1 rounded-xl border bg-white p-6 border-dashboard-border dark:bg-card-bg dark:shadow-[0_0_18px_rgba(239,68,68,0.08)] ${className}`}
    >
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-md bg-red-50 dark:bg-red-500/10">
          <Flame className="size-4 text-red-500 dark:text-red-400" />
        </div>
        <span className="text-xs font-medium uppercase tracking-widest text-gray-500 dark:text-gray-400">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function CardLoading() {
  return (
    <div className="mt-4 grid grid-cols-[repeat(9,minmax(0,1fr))] gap-1 animate-pulse">
      {Array.from({ length: 45 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square rounded-[2px] bg-gray-200 dark:bg-dashboard-border"
        />
      ))}
    </div>
  );
}

function CardError() {
  return (
    <div className="flex h-20 items-center justify-center">
      <span className="text-xs text-red-500 dark:text-red-400">
        Gagal memuat data.
      </span>
    </div>
  );
}
