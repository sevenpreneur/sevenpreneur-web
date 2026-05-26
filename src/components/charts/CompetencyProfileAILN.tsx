"use client";
import { trpc } from "@/trpc/client";
import {
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from "chart.js";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import { Radar } from "react-chartjs-2";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const formatScore = (n: number) =>
  n.toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

function barColorClass(score: number) {
  if (score >= 3.5) return "bg-emerald-500 dark:bg-emerald-400";
  if (score >= 2) return "bg-blue-500 dark:bg-blue-400";
  if (score >= 1) return "bg-amber-500 dark:bg-amber-400";
  return "bg-gray-300 dark:bg-gray-600";
}

function textColorClass(score: number) {
  if (score >= 3.5) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 2) return "text-foreground dark:text-white";
  if (score >= 1) return "text-amber-600 dark:text-amber-400";
  return "text-gray-400 dark:text-gray-500";
}

interface CompetencyProfileAILNProps {
  className?: string;
}

export default function CompetencyProfileAILN({
  className,
}: CompetencyProfileAILNProps) {
  const q = trpc.ailene.read.competencyProfile.useQuery();

  if (q.isLoading) {
    return (
      <Shell className={className}>
        <div className="h-[360px] animate-pulse rounded-md bg-gray-100 dark:bg-dashboard-border" />
      </Shell>
    );
  }
  if (q.error || !q.data) {
    return (
      <Shell className={className}>
        <div className="flex h-[360px] items-center justify-center text-sm text-gray-500">
          Gagal memuat profil kompetensi.
        </div>
      </Shell>
    );
  }

  const { dimensions, avg, tier_number, tier_name } = q.data.profile;
  const labels = dimensions.map((d) => d.name);
  const values = dimensions.map((d) => d.score);

  return (
    <Shell className={className}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground dark:text-white">
            Profil Kompetensi AI Anda
          </h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            6 dimensi · Rata-rata saat ini:{" "}
            <span className="font-semibold text-foreground dark:text-white">
              {formatScore(avg)}
            </span>{" "}
            / 5,0 — Level {tier_number} {tier_name}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        {/* Radar chart */}
        <div className="min-w-0">
          <RadarBlock labels={labels} values={values} />
        </div>

        {/* Bar list */}
        <div className="flex flex-col gap-3">
          {dimensions.map((d) => {
            const pct = Math.max(0, Math.min(100, (d.score / 5) * 100));
            return (
              <div key={d.key}>
                <div className="flex items-baseline justify-between">
                  <span
                    className={`text-sm font-semibold ${textColorClass(d.score)}`}
                  >
                    {d.name}
                  </span>
                  <span
                    className={`text-sm font-semibold tabular-nums ${textColorClass(d.score)}`}
                  >
                    {formatScore(d.score)} / 5
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-dashboard-border">
                  <div
                    className={`h-full rounded-full ${barColorClass(d.score)}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}

function RadarBlock({
  labels,
  values,
}: {
  labels: string[];
  values: number[];
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const { data, options } = useMemo(() => {
    // Subtle neutral palette for grid + axis, adapts per theme
    const gridColor = isDark
      ? "rgba(148, 163, 184, 0.18)"
      : "rgba(148, 163, 184, 0.28)";
    const angleColor = isDark
      ? "rgba(148, 163, 184, 0.16)"
      : "rgba(148, 163, 184, 0.22)";
    const labelColor = isDark
      ? "rgba(226, 232, 240, 0.85)"
      : "rgba(71, 85, 105, 0.95)";

    return {
      data: {
        labels,
        datasets: [
          {
            label: "Kompetensi",
            data: values,
            // Faded fill + soft line — punchy enough to read, not aggressive
            backgroundColor: "rgba(59, 130, 246, 0.18)",
            borderColor: "rgba(59, 130, 246, 0.75)",
            borderWidth: 2,
            pointBackgroundColor: "rgba(59, 130, 246, 1)",
            pointBorderColor: isDark ? "#0F172A" : "#FFFFFF",
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx: { parsed: { r: number } }) =>
                ` ${ctx.parsed.r.toLocaleString("id-ID", {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })} / 5`,
            },
          },
        },
        scales: {
          r: {
            min: 0,
            max: 5,
            angleLines: { color: angleColor, lineWidth: 1 },
            grid: { color: gridColor, lineWidth: 1 },
            ticks: {
              display: true,
              stepSize: 1,
              color: labelColor,
              backdropColor: "transparent",
              font: { size: 10 },
            },
            pointLabels: {
              color: labelColor,
              font: { size: 12, weight: 500 as const },
            },
          },
        },
      } as const,
    };
  }, [labels, values, isDark]);

  return (
    <div className="h-[320px]">
      <Radar data={data} options={options} />
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
      className={`rounded-lg border border-dashboard-border bg-white p-5 dark:bg-card-bg ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
