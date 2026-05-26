"use client";
import { trpc } from "@/trpc/client";
import { Star } from "lucide-react";

interface LevelProgressCardAILNProps {
  className?: string;
}

export default function LevelProgressCardAILN(
  props: LevelProgressCardAILNProps
) {
  const q = trpc.ailene.read.levelProgress.useQuery();

  if (q.isLoading) {
    return (
      <StatShell className={props.className}>
        <CardLoading />
      </StatShell>
    );
  }
  if (q.error || !q.data) {
    return (
      <StatShell className={props.className}>
        <CardError />
      </StatShell>
    );
  }

  const { levels, current_level_number, tasks_required, tasks_done } = q.data;
  const target = Math.max(tasks_required, 1);
  const pct = Math.min(100, Math.round((tasks_done / target) * 100));

  return (
    <StatShell className={props.className}>
      <LevelStepper
        levels={levels}
        currentLevelNumber={current_level_number}
        tasksRequired={tasks_required}
        tasksDone={tasks_done}
      />
      <div className="mt-5 rounded-lg border border-gray-200 p-3 dark:border-dashboard-border">
        <div className="mb-2 text-xs text-gray-700 dark:text-gray-300">
          Progress di Level {current_level_number}
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-dashboard-border">
            <div
              className="h-full rounded-full bg-red-500 dark:shadow-[0_0_8px_rgba(239,68,68,0.7)]"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {tasks_done} / {tasks_required}
          </span>
        </div>
      </div>
    </StatShell>
  );
}

function LevelStepper({
  levels,
  currentLevelNumber,
  tasksRequired,
  tasksDone,
}: {
  levels: {
    id: number;
    level_number: number;
    name: string;
    icon: string | null;
  }[];
  currentLevelNumber: number;
  tasksRequired: number;
  tasksDone: number;
}) {
  if (levels.length === 0) return null;
  return (
    <div className="mt-6 flex items-start">
      {levels.map((lvl, idx) => {
        const isPast = lvl.level_number < currentLevelNumber;
        const isCurrent = lvl.level_number === currentLevelNumber;
        const isFuture = lvl.level_number > currentLevelNumber;

        const leftReached = idx > 0 && lvl.level_number <= currentLevelNumber;
        const rightReached =
          idx < levels.length - 1 &&
          levels[idx + 1].level_number <= currentLevelNumber;

        return (
          <div key={lvl.id} className="flex flex-1 flex-col items-center gap-2">
            <div className="relative flex h-10 w-full items-center justify-center">
              {idx > 0 && (
                <div
                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-1/2 ${
                    leftReached
                      ? "h-0.5 bg-red-500 dark:shadow-[0_0_4px_rgba(239,68,68,0.7)]"
                      : "border-t-2 border-dashed border-gray-300 dark:border-dashboard-border"
                  }`}
                />
              )}
              {idx < levels.length - 1 && (
                <div
                  className={`absolute right-0 top-1/2 -translate-y-1/2 w-1/2 ${
                    rightReached
                      ? "h-0.5 bg-red-500 dark:shadow-[0_0_4px_rgba(239,68,68,0.7)]"
                      : "border-t-2 border-dashed border-gray-300 dark:border-dashboard-border"
                  }`}
                />
              )}
              <LevelCircle
                state={isPast ? "past" : isCurrent ? "current" : "future"}
              />
            </div>

            <div
              className={`text-xs font-bold uppercase tracking-wider ${
                isCurrent
                  ? "text-red-500 dark:text-red-400"
                  : isFuture
                    ? "text-gray-400 dark:text-gray-500"
                    : "text-gray-800 dark:text-gray-200"
              }`}
            >
              Level {lvl.level_number}
            </div>

            <LevelBadge
              state={isPast ? "past" : isCurrent ? "current" : "future"}
              done={isPast ? tasksRequired : isCurrent ? tasksDone : 0}
              total={tasksRequired}
            />
          </div>
        );
      })}
    </div>
  );
}

function LevelCircle({ state }: { state: "past" | "current" | "future" }) {
  if (state === "past") {
    return (
      <div className="relative z-10 flex size-9 items-center justify-center rounded-full bg-red-500 dark:shadow-[0_0_10px_rgba(239,68,68,0.6)]">
        <Star className="size-4 fill-white text-white" />
      </div>
    );
  }
  if (state === "current") {
    return (
      <div className="relative z-10 flex size-9 items-center justify-center rounded-full bg-red-500 shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#ef4444] dark:shadow-[0_0_0_2px_#0a0a0a,0_0_0_4px_#ef4444,0_0_12px_rgba(239,68,68,0.6)]">
        <Star className="size-4 fill-white text-white" />
      </div>
    );
  }
  return (
    <div className="relative z-10 flex size-9 items-center justify-center rounded-full bg-gray-300 dark:bg-dashboard-border">
      <Star className="size-4 fill-white text-white" />
    </div>
  );
}

function LevelBadge({
  state,
  done,
  total,
}: {
  state: "past" | "current" | "future";
  done: number;
  total: number;
}) {
  if (state === "past") {
    return (
      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-500/15 dark:text-green-400">
        Selesai
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600 dark:bg-red-500/15 dark:text-red-400">
        {done} / {total}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-dashboard-border dark:text-gray-400">
      {done} / {total}
    </span>
  );
}

function StatShell({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex h-full flex-col rounded-lg border border-dashboard-border bg-white p-5 dark:bg-card-bg ${className}`}
    >
      <div>
        <h2 className="text-base font-bold text-foreground dark:text-white">
          Level Progress
        </h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Pantau perkembangan level belajar kamu.
        </p>
      </div>
      {children}
    </div>
  );
}

function CardLoading() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      <div className="mt-2 h-9 w-40 rounded bg-gray-200 dark:bg-dashboard-border" />
      <hr className="my-3 border-gray-200 dark:border-dashboard-border" />
      <div className="flex items-start gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div className="size-9 rounded-full bg-gray-200 dark:bg-dashboard-border" />
            <div className="h-3 w-14 rounded bg-gray-200 dark:bg-dashboard-border" />
            <div className="h-3 w-12 rounded-full bg-gray-200 dark:bg-dashboard-border" />
          </div>
        ))}
      </div>
      <div className="mt-3 h-16 rounded-lg bg-gray-100 dark:bg-dashboard-border/40" />
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
