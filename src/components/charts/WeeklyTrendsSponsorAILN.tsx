"use client";
import type React from "react";
import { trpc } from "@/trpc/client";

const BLUE_DARK = "#00359D";
const BLUE_MUTED = "#9eb0d3";

export default function WeeklyTrendsSponsorAILN() {
  const q = trpc.ailene.read.weeklyTrends.useQuery();

  if (q.isLoading) {
    return (
      <Shell>
        <div className="h-72 animate-pulse rounded-md bg-gray-100 dark:bg-dashboard-border" />
      </Shell>
    );
  }

  if (q.error || !q.data) {
    return (
      <Shell>
        <div className="flex h-72 items-center justify-center text-sm text-gray-500">
          Gagal memuat trend mingguan.
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-base font-bold text-gray-900 dark:text-white">
            Trend mingguan · Jam dihemat × Adopsi
          </div>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            12 minggu terakhir · sumber log workplace use case
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-300">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: BLUE_DARK }}
            />
            Jam dihemat
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: BLUE_MUTED }}
            />
            Adopsi %
          </span>
        </div>
      </div>

      <div className="mt-5">
        <TrendBarChart data={q.data.weeks} />
      </div>
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

function TrendBarChart({
  data,
}: {
  data: {
    label: string;
    hours_saved: number;
    adoption_percent: number;
    highlight?: boolean;
  }[];
}) {
  const W = 720;
  const H = 240;
  const PAD_L = 8;
  const PAD_R = 8;
  const PAD_T = 28;
  const PAD_B = 28;

  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;
  const max = Math.max(...data.map((d) => d.hours_saved), 1) * 1.1;
  const slot = chartW / Math.max(data.length, 1);
  const barW = slot * 0.6;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-64 w-full"
    >
      {data.map((d, i) => {
        const barH = (d.hours_saved / max) * chartH;
        const x = PAD_L + i * slot + (slot - barW) / 2;
        const y = PAD_T + (chartH - barH);
        const fillClass = d.highlight
          ? "fill-[#00359D]"
          : "fill-[#dde4f3] dark:fill-blue-500/25";
        const valueClass = d.highlight
          ? "fill-[#00359D] dark:fill-blue-300"
          : "fill-gray-500 dark:fill-gray-400";
        const labelClass = d.highlight
          ? "fill-gray-900 dark:fill-white"
          : "fill-gray-500 dark:fill-gray-400";
        return (
          <g key={`${d.label}-${i}`}>
            <text
              x={x + barW / 2}
              y={y - 6}
              textAnchor="middle"
              fontSize="11"
              fontWeight={d.highlight ? 700 : 500}
              className={valueClass}
            >
              {d.hours_saved.toLocaleString("id-ID", { maximumFractionDigits: 1 })}j
            </text>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={3}
              className={fillClass}
            />
            <text
              x={x + barW / 2}
              y={H - 8}
              textAnchor="middle"
              fontSize="11"
              fontWeight={d.highlight ? 700 : 400}
              className={labelClass}
            >
              {d.label}
            </text>
            <circle
              cx={x + barW / 2}
              cy={PAD_T + (1 - d.adoption_percent / 100) * chartH}
              r="2.5"
              fill={BLUE_MUTED}
            />
          </g>
        );
      })}
    </svg>
  );
}
