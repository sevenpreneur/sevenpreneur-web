"use client";
import type React from "react";
import { trpc } from "@/trpc/client";

const LEVEL_COLORS = ["#eef2fb", "#9eb0d3", "#5b7bc4", "#00359D", "#001f5d"];

export default function LevelDistributionSponsorAILN() {
  const q = trpc.ailene.read.levelDistribution.useQuery();

  if (q.isLoading) {
    return (
      <Shell>
        <div className="h-40 animate-pulse rounded-md bg-gray-100 dark:bg-dashboard-border" />
      </Shell>
    );
  }

  if (q.error || !q.data) {
    return (
      <Shell>
        <div className="flex h-40 items-center justify-center text-sm text-gray-500">
          Gagal memuat distribusi level.
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="text-base font-bold text-gray-900 dark:text-white">
        Distribusi Level Organisasi
      </div>

      <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-dashboard-border">
        {q.data.levels.map((level, index) => (
          <div
            key={level.id}
            style={{
              width: `${level.percent}%`,
              backgroundColor: getColor(index),
            }}
          />
        ))}
      </div>

      <ul className="mt-4 flex flex-col gap-2 text-sm">
        {q.data.levels.map((level, index) => (
          <li
            key={level.id}
            className="flex items-center justify-between gap-2"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="inline-block size-2.5 rounded-sm"
                style={{ backgroundColor: getColor(index) }}
              />
              <span className="font-semibold text-gray-900 dark:text-white">
                {level.code}
              </span>
              <span className="truncate text-gray-600 dark:text-gray-300">
                {level.name}
              </span>
            </div>
            <div className="flex items-baseline gap-3 text-xs">
              <span className="font-semibold text-gray-900 dark:text-white">
                {level.count}
              </span>
              <span className="w-8 text-right font-medium text-[#00359D] dark:text-blue-300">
                {level.percent}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashboard-border bg-white p-5 shadow-sm dark:bg-card-bg dark:shadow-[0_0_16px_rgba(0,53,157,0.06)]">
      {children}
    </div>
  );
}

function getColor(index: number) {
  return LEVEL_COLORS[index] ?? LEVEL_COLORS[LEVEL_COLORS.length - 1];
}
