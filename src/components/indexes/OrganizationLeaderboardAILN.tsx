"use client";
import type React from "react";
import { trpc } from "@/trpc/client";

const BLUE_DARK = "#00359D";

export default function OrganizationLeaderboardAILN() {
  const q = trpc.ailene.read.organizationLeaderboard.useQuery();

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
          Gagal memuat top departemen.
        </div>
      </Shell>
    );
  }

  const maxHours = Math.max(...q.data.list.map((item) => item.hours), 1);

  return (
    <Shell>
      <div>
        <div className="text-base font-bold text-gray-900 dark:text-white">
          Top Departemen
        </div>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          by jam dihemat bulan ini
        </p>
      </div>

      {q.data.list.length === 0 ? (
        <div className="mt-3 flex h-32 items-center justify-center rounded-md bg-gray-50 text-sm text-gray-500 dark:bg-card-inside-bg dark:text-gray-400">
          Belum ada use case yang tersubmit bulan ini.
        </div>
      ) : (
        <ul className="mt-3 flex flex-col gap-2.5 text-sm">
          {q.data.list.map((department) => {
            const widthPct = (department.hours / maxHours) * 100;

            return (
              <li
                key={department.id}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3"
              >
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                  #{department.rank}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-gray-900 dark:text-white">
                    {department.name}
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-dashboard-border">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: BLUE_DARK,
                      }}
                    />
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {department.hours.toLocaleString("id-ID", {
                    maximumFractionDigits: 1,
                  })}
                  j
                </span>
              </li>
            );
          })}
        </ul>
      )}
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
