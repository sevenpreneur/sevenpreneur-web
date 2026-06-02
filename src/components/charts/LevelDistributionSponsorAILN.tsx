"use client";
import type React from "react";
import { trpc } from "@/trpc/client";
import { BAR_DEEP } from "./sponsor-palette";
import {
  ShareBarList,
  ShareBarListContent,
  ShareBarListFill,
  ShareBarListItem,
  ShareBarListLabel,
  ShareBarListValue,
} from "@/components/share-bar-list";

// Single consistent bar color — magnitude is shown by bar length, not hue, so
// no level looks "faded" relative to another (matches the reference design).
const BAR_COLOR = BAR_DEEP;

type Level = {
  id: number | string;
  code: string;
  label?: string | null;
  name: string;
  count: number;
  percent: number;
};

export default function LevelDistributionSponsorAILN() {
  const q = trpc.ailene.read.levelDistribution.useQuery();

  if (q.isLoading) {
    return (
      <Shell>
        <div className="h-48 animate-pulse rounded-md bg-gray-100 dark:bg-dashboard-border" />
      </Shell>
    );
  }

  if (q.error || !q.data) {
    return (
      <Shell>
        <div className="flex h-48 items-center justify-center text-sm text-gray-500">
          Gagal memuat distribusi level.
        </div>
      </Shell>
    );
  }

  const levels = q.data.levels as Level[];

  return (
    <Shell>
      <div className="text-base font-bold text-gray-900 dark:text-white">
        Distribusi Level Organisasi
      </div>

      <div className="mt-3 -mx-2">
        <ShareBarList aria-label="Distribusi karyawan per level">
          {levels.map((level) => (
            <ShareBarListItem
              key={level.id}
              value={level.percent}
              title={`${level.count.toLocaleString("id-ID")} staff`}
              style={
                {
                  "--share-bar-color": BAR_COLOR,
                } as React.CSSProperties
              }
            >
              <ShareBarListContent>
                <ShareBarListLabel className="truncate">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {level.label ?? level.code}
                  </span>{" "}
                  <span className="text-gray-500 dark:text-gray-400">
                    {level.name}
                  </span>
                </ShareBarListLabel>
                <ShareBarListValue className="text-gray-900 dark:text-white">
                  {level.percent}%
                </ShareBarListValue>
              </ShareBarListContent>
              <ShareBarListFill />
            </ShareBarListItem>
          ))}
        </ShareBarList>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="ailn-card p-5">{children}</div>;
}
