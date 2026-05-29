"use client";
import ButtonAILN from "@/components/buttons/ButtonAILN";
import ScorecardAILN from "@/components/cards/ScorecardAILN";
import LevelDistributionSponsorAILN from "@/components/charts/LevelDistributionSponsorAILN";
import WeeklyTrendsSponsorAILN from "@/components/charts/WeeklyTrendsSponsorAILN";
import OrganizationLeaderboardAILN from "@/components/indexes/OrganizationLeaderboardAILN";
import PageContainerAILN from "@/components/pages/PageContainerAILN";
import AppErrorComponents from "@/components/states/AppErrorComponents";
import { setSessionToken, trpc } from "@/trpc/client";
import { Download } from "lucide-react";
import { useEffect } from "react";

const BLUE_DARK = "#1F2937";

const HEALTH_CARDS: {
  label: string;
  value: string;
  target: string;
  hint: string;
  tone: "good" | "warn";
}[] = [
  {
    label: "LULUS L1",
    value: "84%",
    target: "vs 80%",
    hint: "Di atas target",
    tone: "good",
  },
  {
    label: "LULUS L2",
    value: "61%",
    target: "vs 65%",
    hint: "Slight gap",
    tone: "warn",
  },
  {
    label: "SUBMISSION ACCEPTED",
    value: "92%",
    target: "vs 85%",
    hint: "Comment loop sehat",
    tone: "good",
  },
  {
    label: "NPS CHAMPION",
    value: "+48",
    target: "vs +30",
    hint: "11 dari 12 respond",
    tone: "good",
  },
];

const ACTIVITY: {
  actor: string;
  action: string;
  meta: string;
  time: string;
}[] = [
  {
    actor: "Champion Adi P.",
    action: "submit report bulanan",
    meta: "Product · Mei 2026",
    time: "12 mnt",
  },
  {
    actor: "Sistem",
    action: "auto-promote 4 staff ke L2",
    meta: "Operations, CS, Eng",
    time: "1j",
  },
  {
    actor: "Champion Bunga S.",
    action: "accept 6 use case",
    meta: "Marketing · ROI +84j",
    time: "2j",
  },
  {
    actor: "Indah Maharani",
    action: "selesai pre-assessment",
    meta: "Joined cohort · Research",
    time: "3j",
  },
];

// ---------- Component ----------

export default function DashboardSponsorAILN({
  sessionToken,
}: {
  sessionToken: string;
}) {
  useEffect(() => {
    setSessionToken(sessionToken);
  }, [sessionToken]);

  const executiveQ = trpc.ailene.read.executiveView.useQuery();

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
  const kpiCards = [
    {
      title: "AVG LEVEL ORGANISASI",
      value: metrics.avg_level.toLocaleString("id-ID", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
      unit: "/ 4",
      spark: [0, metrics.avg_level],
    },
    {
      title: "JAM DIHEMAT (KUMULATIF)",
      value: metrics.hours_saved_total.toLocaleString("id-ID", {
        maximumFractionDigits: 1,
      }),
      unit: "jam",
      spark: [0, metrics.hours_saved_total],
    },
    {
      title: "ROI (COHORT-TO-DATE)",
      value: roi.value,
      unit: roi.unit,
      spark: [0, metrics.roi_cohort_to_date],
    },
    {
      title: "STAFF AKTIF MINGGUAN",
      value: staffActiveWeeklyValue,
      unit: "%",
      spark: [0, metrics.staff_active_weekly_percent],
    },
  ];

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
              Hutama Karya
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              240 staff aktif · 18 departemen · cohort Q2-2026 berjalan
              ke-bulan-2.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ButtonAILN variant="light" size="medium">
              <Download className="size-4" />
              Export PDF
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
              <Sparkline data={k.spark} color={BLUE_DARK} />
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
          <div className="rounded-lg border border-dashboard-border bg-white p-5 shadow-sm dark:bg-card-bg dark:shadow-[0_0_16px_rgba(0,53,157,0.06)]">
            <div className="flex items-start justify-between gap-2">
              <div className="text-base font-bold text-gray-900 dark:text-white">
                Kesehatan Program
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Update real-time
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
              {HEALTH_CARDS.map((h) => (
                <HealthCard key={h.label} {...h} />
              ))}
            </div>
          </div>

          {/* Aktivitas terkini */}
          <div className="rounded-lg border border-dashboard-border bg-white p-5 shadow-sm dark:bg-card-bg dark:shadow-[0_0_16px_rgba(0,53,157,0.06)]">
            <div className="text-base font-bold text-gray-900 dark:text-white">
              Aktivitas terkini
            </div>
            <ul className="mt-3 flex flex-col gap-3 text-sm">
              {ACTIVITY.map((a, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: BLUE_DARK }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-gray-900 dark:text-white">
                      <span className="font-semibold">{a.actor}</span>{" "}
                      <span className="text-gray-700 dark:text-gray-300">
                        {a.action}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {a.meta}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                    {a.time}
                  </span>
                </li>
              ))}
            </ul>
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
            className="min-h-40 rounded-lg border border-dashboard-border bg-white p-4 dark:bg-card-bg"
          >
            <div className="h-3 w-36 rounded bg-gray-200 dark:bg-dashboard-border" />
            <div className="mt-4 h-10 w-24 rounded bg-gray-200 dark:bg-dashboard-border" />
            <div className="mt-8 h-11 w-full rounded bg-gray-100 dark:bg-dashboard-border/60" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="h-96 rounded-lg border border-dashboard-border bg-white dark:bg-card-bg" />
        <div className="flex flex-col gap-4">
          <div className="h-48 rounded-lg border border-dashboard-border bg-white dark:bg-card-bg" />
          <div className="h-48 rounded-lg border border-dashboard-border bg-white dark:bg-card-bg" />
        </div>
      </div>
    </div>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const W = 200;
  const H = 44;
  const PAD = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = (W - PAD * 2) / (data.length - 1);

  const points = data.map((v, i) => {
    const x = PAD + i * stepX;
    const y = PAD + (1 - (v - min) / range) * (H - PAD * 2);
    return [x, y] as const;
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

  const areaPath = `${linePath} L${points[points.length - 1][0].toFixed(1)},${H} L${points[0][0].toFixed(1)},${H} Z`;

  const gradId = `sparkGrad-${color.replace("#", "")}`;
  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="h-11 w-full"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill={color} />
    </svg>
  );
}

function HealthCard({
  label,
  value,
  target,
  hint,
  tone,
}: {
  label: string;
  value: string;
  target: string;
  hint: string;
  tone: "good" | "warn";
}) {
  const dotClass =
    tone === "good"
      ? "bg-emerald-500 dark:bg-emerald-400"
      : "bg-amber-500 dark:bg-amber-400";
  const pillClass =
    tone === "good"
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
      : "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";

  return (
    <div className="flex flex-col rounded-md border border-dashboard-border bg-white p-3 dark:bg-card-inside-bg">
      <div className="text-[10px] font-semibold tracking-widest text-gray-500 dark:text-gray-400">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {target}
        </span>
      </div>
      <span
        className={`mt-3 inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${pillClass}`}
      >
        <span className={`inline-block size-1.5 rounded-full ${dotClass}`} />
        {hint}
      </span>
    </div>
  );
}
