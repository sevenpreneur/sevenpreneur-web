"use client";
import type React from "react";
import { trpc } from "@/trpc/client";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import { BAR_DEEP, BAR_SOFT, LINE_ADOPTION } from "./sponsor-palette";
import { SAMPLE_TREND } from "./sample-trend-data";

const chartConfig = {
  hours_saved: { label: "Jam dihemat", color: BAR_DEEP },
  adoption_percent: { label: "Adopsi %", color: LINE_ADOPTION },
} satisfies ChartConfig;

type TrendWeek = {
  label: string;
  hours_saved: number;
  adoption_percent: number;
  highlight?: boolean;
};

// Use real data when there's any activity; otherwise fall back to local sample
// data (keeping the real week labels) so the chart isn't barren in empty envs.
function resolveWeeks(realWeeks: TrendWeek[]): {
  weeks: TrendWeek[];
  isSample: boolean;
} {
  // Need a few weeks of activity before the real data forms a meaningful trend;
  // a lone spike still reads as "broken/empty", so fall back to sample below.
  const nonZeroWeeks = realWeeks.filter((w) => w.hours_saved > 0).length;
  if (nonZeroWeeks >= 4) return { weeks: realWeeks, isSample: false };

  const base = realWeeks.length === SAMPLE_TREND.length ? realWeeks : SAMPLE_TREND;
  const weeks = base.map((w, i) => ({
    label: w.label,
    hours_saved: SAMPLE_TREND[i].hours_saved,
    adoption_percent: SAMPLE_TREND[i].adoption_percent,
    highlight: i === base.length - 1,
  }));
  return { weeks, isSample: true };
}

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

  const { weeks, isSample } = resolveWeeks(q.data.weeks);

  return (
    <Shell>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-base font-bold text-gray-900 dark:text-white">
              Trend mingguan · Jam dihemat × Adopsi
            </div>
            {isSample && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-dashboard-border dark:text-gray-400">
                data contoh
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            12 minggu terakhir · sumber log workplace use case
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-300">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: BAR_DEEP }}
            />
            Jam dihemat
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-0.5 w-3 rounded-full"
              style={{ backgroundColor: LINE_ADOPTION }}
            />
            Adopsi %
          </span>
        </div>
      </div>

      <div className="mt-5 min-h-[240px] flex-1">
        <TrendChart data={weeks} />
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="ailn-card flex h-full flex-col p-5">{children}</div>;
}

function TrendChart({
  data,
}: {
  data: {
    label: string;
    hours_saved: number;
    adoption_percent: number;
    highlight?: boolean;
  }[];
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-md bg-gray-50 text-sm text-gray-500 dark:bg-card-inside-bg dark:text-gray-400">
        Belum ada data trend.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
      <ComposedChart
        data={data}
        margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
        barCategoryGap="22%"
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={16}
          fontSize={11}
        />
        <YAxis yAxisId="hours" hide />
        <YAxis yAxisId="adoption" domain={[0, 100]} hide />
        <ChartTooltip
          cursor={{ fill: "var(--color-ailn-surface-2)", opacity: 0.6 }}
          content={
            <ChartTooltipContent
              labelKey="label"
              formatter={(value, name) => {
                const isPct = name === "adoption_percent";
                const color = isPct ? LINE_ADOPTION : BAR_DEEP;
                const text = isPct
                  ? `${Number(value).toLocaleString("id-ID")}%`
                  : `${Number(value).toLocaleString("id-ID", {
                      maximumFractionDigits: 1,
                    })} jam`;
                return (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5">
                      {isPct ? (
                        // Line metric → line-shaped indicator (matches legend)
                        <span
                          className="inline-block h-[3px] w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      ) : (
                        // Bar metric → square indicator
                        <span
                          className="size-2 shrink-0 rounded-[2px]"
                          style={{ backgroundColor: color }}
                        />
                      )}
                      <span className="text-muted-foreground">
                        {isPct ? "Adopsi" : "Jam dihemat"}
                      </span>
                    </span>
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {text}
                    </span>
                  </div>
                );
              }}
            />
          }
        />
        <Bar
          yAxisId="hours"
          dataKey="hours_saved"
          radius={[5, 5, 0, 0]}
          minPointSize={(value) => ((value ?? 0) > 0 ? 3 : 0)}
        >
          {data.map((d, i) => (
            <Cell
              key={d.label}
              fill={d.highlight ?? i === data.length - 1 ? BAR_DEEP : BAR_SOFT}
            />
          ))}
        </Bar>
        <Line
          yAxisId="adoption"
          dataKey="adoption_percent"
          type="monotone"
          stroke={LINE_ADOPTION}
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </ComposedChart>
    </ChartContainer>
  );
}
