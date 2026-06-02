"use client";
import { AILENE_ORG_NAME, AILENE_PROGRAM_NAME } from "@/lib/ailene-config";
import {
  usePdfReport,
  type ReportProps,
} from "@/components/reports/AileneReportPDF";
import ButtonAILN from "@/components/buttons/ButtonAILN";
import ScorecardAILN from "@/components/cards/ScorecardAILN";
import LevelDistributionSponsorAILN from "@/components/charts/LevelDistributionSponsorAILN";
import WeeklyTrendsSponsorAILN from "@/components/charts/WeeklyTrendsSponsorAILN";
import OrganizationLeaderboardAILN from "@/components/indexes/OrganizationLeaderboardAILN";
import PageContainerAILN from "@/components/pages/PageContainerAILN";
import AppErrorComponents from "@/components/states/AppErrorComponents";
import { setSessionToken, trpc } from "@/trpc/client";
import dayjs from "dayjs";
import { Download } from "lucide-react";
import { useEffect } from "react";

// Ailene brand accent — used for the activity timeline so the dashboard carries
// brand identity, not just gray.
const AILN_ACCENT = "#ee2333";

// Floor an avg level (0..4) to its tier name for the card caption.
function tierLabel(level: number): string {
  const names = [
    "Assessment",
    "AI Foundation",
    "AI Operator",
    "AI Intermediate",
    "AI Advanced",
  ];
  const idx = Math.min(Math.max(Math.floor(level), 0), names.length - 1);
  return `Level ${idx} · ${names[idx]}`;
}

// ---------- Component ----------

export default function DashboardSponsorAILN({
  sessionToken,
}: {
  sessionToken: string;
}) {
  useEffect(() => {
    setSessionToken(sessionToken);
  }, [sessionToken]);

  const pdf = usePdfReport();
  const executiveQ = trpc.ailene.read.executiveView.useQuery();
  const orgStatsQ = trpc.ailene.read.organizationStats.useQuery();
  const healthQ = trpc.ailene.read.programHealth.useQuery();
  const activityQ = trpc.ailene.read.recentActivity.useQuery();
  // For the PDF report: data the on-page charts render via child components.
  const levelDistQ = trpc.ailene.read.levelDistribution.useQuery();
  const trendsQ = trpc.ailene.read.weeklyTrends.useQuery();
  const leaderboardQ = trpc.ailene.read.organizationLeaderboard.useQuery();

  if (executiveQ.isLoading) {
    return (
      <PageContainerAILN>
        <DashboardSponsorSkeleton />
      </PageContainerAILN>
    );
  }

  if (executiveQ.error || !executiveQ.data) {
    return (
      <PageContainerAILN>
        <AppErrorComponents />
      </PageContainerAILN>
    );
  }

  const metrics = executiveQ.data.metrics;
  const staffActiveWeeklyValue =
    metrics.member_count === 0
      ? "0"
      : metrics.staff_active_weekly_percent.toLocaleString("id-ID");
  const roi = formatCompactIdr(metrics.roi_cohort_to_date);
  const workdaysSaved = Math.round(metrics.hours_saved_total / 8);

  const healthMetrics = healthQ.data?.metrics ?? [];
  const activity = activityQ.data?.activity ?? [];
  const orgStats = orgStatsQ.data;
  const orgName = AILENE_ORG_NAME || "Ringkasan Organisasi";
  const orgSubline = orgStats
    ? `${orgStats.member_count.toLocaleString("id-ID")} staff aktif · ${orgStats.group_count.toLocaleString("id-ID")} departemen · ${AILENE_PROGRAM_NAME}`
    : AILENE_PROGRAM_NAME;

  const kpiCards: {
    title: string;
    value: string;
    unit: string;
    footer: string;
  }[] = [
    {
      title: "Avg Level Organisasi",
      value: metrics.avg_level.toLocaleString("id-ID", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
      unit: "/ 4",
      footer: tierLabel(metrics.avg_level),
    },
    {
      title: "Jam Dihemat (Kumulatif)",
      value: metrics.hours_saved_total.toLocaleString("id-ID", {
        maximumFractionDigits: 1,
      }),
      unit: "jam",
      footer: `≈ ${workdaysSaved.toLocaleString("id-ID")} hari kerja`,
    },
    {
      title: "ROI (Cohort-to-date)",
      value: roi.value,
      unit: roi.unit,
      footer: `dari ${metrics.hours_saved_total.toLocaleString("id-ID")} jam dihemat`,
    },
    {
      title: "Staff Aktif Mingguan",
      value: staffActiveWeeklyValue,
      unit: "%",
      footer: `${metrics.staff_active_weekly_count.toLocaleString("id-ID")} dari ${metrics.member_count.toLocaleString("id-ID")} staff aktif`,
    },
  ];

  const report: ReportProps = {
    org: AILENE_ORG_NAME || undefined,
    program: AILENE_PROGRAM_NAME,
    title: "Ringkasan Eksekutif",
    subtitle: orgStats
      ? `${orgStats.member_count.toLocaleString("id-ID")} staff · ${orgStats.group_count.toLocaleString("id-ID")} departemen`
      : undefined,
    generatedAt: dayjs().format("D MMMM YYYY"),
    sections: [
      {
        type: "kpi",
        title: "Indikator Utama",
        items: kpiCards.map((k) => ({
          label: k.title,
          value: k.value,
          unit: k.unit,
          footer: k.footer,
        })),
      },
      {
        type: "kpi",
        title: "Kesehatan Program",
        items: healthMetrics.map((h) => ({
          label: h.label,
          value: `${h.percent}%`,
          footer: h.detail,
        })),
      },
      ...(levelDistQ.data && levelDistQ.data.levels.length > 0
        ? [
            {
              type: "bar" as const,
              title: "Distribusi Level Organisasi",
              items: levelDistQ.data.levels.map((l) => ({
                label: `${l.code} · ${l.name}`,
                value: l.count,
                display: `${l.count} (${l.percent}%)`,
              })),
            },
          ]
        : []),
      ...(trendsQ.data && trendsQ.data.weeks.length > 0
        ? [
            {
              type: "trend" as const,
              title: "Tren Mingguan (12 minggu)",
              barName: "Jam dihemat",
              lineName: "Adopsi %",
              points: trendsQ.data.weeks.map((w) => ({
                label: w.label,
                bar: w.hours_saved,
                line: w.adoption_percent,
              })),
            },
          ]
        : []),
      ...(leaderboardQ.data && leaderboardQ.data.list.length > 0
        ? [
            {
              type: "table" as const,
              title: "Top Departemen (jam dihemat bulan ini)",
              columns: ["#", "Departemen", "Anggota", "Jam"],
              align: ["right", "left", "right", "right"] as (
                | "left"
                | "right"
              )[],
              rows: leaderboardQ.data.list.map((g) => [
                g.rank,
                g.name,
                g.member_count.toLocaleString("id-ID"),
                g.hours.toLocaleString("id-ID"),
              ]),
            },
          ]
        : []),
      {
        type: "list",
        title: "Aktivitas Terkini",
        items:
          activity.length > 0
            ? activity.map((a) => ({
                primary: `${a.actor} — ${a.action}`,
                secondary: a.meta || undefined,
                trailing: a.time,
              }))
            : [{ primary: "Belum ada aktivitas." }],
      },
    ],
  };

  return (
    <PageContainerAILN>
      <div className="flex w-full flex-col gap-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold tracking-widest text-gray-500 dark:text-gray-400">
              SPONSOR · EXECUTIVE VIEW
            </div>
            <h1 className="mt-1 text-3xl font-bold leading-tight text-gray-900 dark:text-white">
              {orgName}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {orgSubline}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ButtonAILN
              variant="light"
              size="medium"
              onClick={() => pdf.generate(report, "ringkasan-eksekutif.pdf")}
              disabled={pdf.exporting}
            >
              <Download className="size-4" />
              {pdf.exporting ? "Menyiapkan…" : "Export PDF"}
            </ButtonAILN>
          </div>
        </div>

        {/* 4 KPI cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpiCards.map((k) => (
            <ScorecardAILN
              key={k.title}
              title={k.title}
              value={k.value}
              unit={k.unit}
            >
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {k.footer}
              </span>
            </ScorecardAILN>
          ))}
        </div>

        {/* Trend + Distribusi Level + Top Departemen */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <WeeklyTrendsSponsorAILN />

          <div className="flex flex-col gap-4">
            <LevelDistributionSponsorAILN />
            <OrganizationLeaderboardAILN />
          </div>
        </div>

        {/* Kesehatan Program + Aktivitas terkini */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* Kesehatan Program */}
          <div className="ailn-card overflow-hidden">
            <div className="border-b border-gray-100 p-5 dark:border-dashboard-border">
              <div className="text-base font-bold text-gray-900 dark:text-white">
                Kesehatan Program
              </div>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                Capaian program vs target · update real-time.
              </p>
            </div>
            <div className="p-5">
              {healthQ.isLoading ? (
                <ul className="grid grid-cols-2 gap-6 lg:grid-cols-4">
                  {[0, 1, 2, 3].map((i) => (
                    <li key={i} className="flex flex-col gap-2">
                      <div className="h-3 w-20 animate-pulse rounded bg-gray-200 dark:bg-dashboard-border" />
                      <div className="h-3 w-16 animate-pulse rounded bg-gray-100 dark:bg-dashboard-border/60" />
                      <div className="mt-1 h-7 w-16 animate-pulse rounded bg-gray-200 dark:bg-dashboard-border" />
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="grid grid-cols-2 gap-6 lg:grid-cols-4">
                  {healthMetrics.map((h) => (
                    <HealthMetric
                      key={h.key}
                      label={h.label}
                      name={h.name}
                      percent={h.percent}
                      detail={h.detail}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Aktivitas terkini */}
          <div className="ailn-card p-5">
            <div className="text-base font-bold text-gray-900 dark:text-white">
              Aktivitas terkini
            </div>
            {activityQ.isLoading ? (
              <ul className="mt-3 flex flex-col gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gray-200 dark:bg-dashboard-border" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-dashboard-border" />
                      <div className="h-2.5 w-1/2 animate-pulse rounded bg-gray-100 dark:bg-dashboard-border/60" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : activity.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                Belum ada aktivitas.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3 text-sm">
                {activity.map((a, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: AILN_ACCENT }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <span className="font-semibold">{a.actor}</span>{" "}
                        <span className="text-gray-700 dark:text-gray-300">
                          {a.action}
                        </span>
                      </div>
                      {a.meta && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {a.meta}
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                      {a.time}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </PageContainerAILN>
  );
}

// ---------- Sub-components ----------

function formatCompactIdr(value: number): { value: string; unit: string } {
  if (value >= 1_000_000_000) {
    return {
      value: (value / 1_000_000_000).toLocaleString("id-ID", {
        maximumFractionDigits: 2,
      }),
      unit: "M Rp",
    };
  }
  if (value >= 1_000_000) {
    return {
      value: (value / 1_000_000).toLocaleString("id-ID", {
        maximumFractionDigits: 1,
      }),
      unit: "jt Rp",
    };
  }
  return { value: value.toLocaleString("id-ID"), unit: "Rp" };
}

function DashboardSponsorSkeleton() {
  return (
    <div className="flex w-full flex-col gap-6 animate-pulse">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-3 w-48 rounded bg-gray-200 dark:bg-dashboard-border" />
          <div className="h-8 w-56 rounded bg-gray-200 dark:bg-dashboard-border" />
          <div className="h-4 w-96 rounded bg-gray-200 dark:bg-dashboard-border" />
        </div>
        <div className="h-9 w-72 rounded-md bg-gray-200 dark:bg-dashboard-border" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="ailn-card min-h-40 p-4"
          >
            <div className="h-3 w-36 rounded bg-gray-200 dark:bg-dashboard-border" />
            <div className="mt-4 h-10 w-24 rounded bg-gray-200 dark:bg-dashboard-border" />
            <div className="mt-8 h-11 w-full rounded bg-gray-100 dark:bg-dashboard-border/60" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="ailn-card h-96" />
        <div className="flex flex-col gap-4">
          <div className="ailn-card h-48" />
          <div className="ailn-card h-48" />
        </div>
      </div>
    </div>
  );
}

// One metric, Core-Web-Vitals layout: label, sub-label, big percent value, and
// a real "X dari Y" detail (no fabricated target/delta — no baseline yet).
function HealthMetric({
  label,
  name,
  percent,
  detail,
}: {
  label: string;
  name: string;
  percent: number;
  detail: string;
}) {
  return (
    <li className="flex flex-col gap-1">
      <p className="text-sm font-medium text-gray-900 dark:text-white">
        {label}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{name}</p>
      <p className="font-geist-mono text-2xl font-bold tabular-nums text-gray-900 dark:text-white">
        {percent.toLocaleString("id-ID")}%
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{detail}</p>
    </li>
  );
}
