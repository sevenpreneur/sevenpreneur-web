"use client";
import ButtonAILN from "@/components/buttons/ButtonAILN";
import { GROWTH_RAMP } from "@/components/charts/sponsor-palette";
import PageContainerAILN from "@/components/pages/PageContainerAILN";
import AppErrorComponents from "@/components/states/AppErrorComponents";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AILENE_ORG_NAME, AILENE_PROGRAM_NAME } from "@/lib/ailene-config";
import {
  usePdfReport,
  type ReportProps,
} from "@/components/reports/AileneReportPDF";
import { setSessionToken, trpc } from "@/trpc/client";
import dayjs from "dayjs";
import { Download } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Cell, Pie, PieChart } from "recharts";

const SPONSOR_BLUE_DARK = "#111827";
// Green maturity ramp: L0 (light) → L3+ (deep). Light segments need dark text.
const LEVEL_COLORS = GROWTH_RAMP;

// Participation donut colors.
const PARTICIPATION_ACTIVE = "#1f5f4e"; // brand deep green
const PARTICIPATION_INACTIVE = "#e2e8f0"; // slate-200
const participationConfig = {
  active: { label: "Aktif", color: PARTICIPATION_ACTIVE },
  inactive: { label: "Belum aktif", color: PARTICIPATION_INACTIVE },
} satisfies ChartConfig;

export default function LevelDistributionSponsorAILN({
  sessionToken,
}: {
  sessionToken: string;
}) {
  useEffect(() => {
    setSessionToken(sessionToken);
  }, [sessionToken]);

  const pdf = usePdfReport();
  // Client-side filters (snapshot data already arrives whole — no backend roundtrip).
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [highlightUnderperform, setHighlightUnderperform] = useState(false);

  const q = trpc.ailene.read.levelDistribution.useQuery();

  if (q.isLoading) {
    return (
      <PageContainerAILN>
        <LevelDistributionSkeleton />
      </PageContainerAILN>
    );
  }

  if (q.error || !q.data) {
    return (
      <PageContainerAILN>
        <AppErrorComponents />
      </PageContainerAILN>
    );
  }

  const data = q.data;
  const inactive = Math.max(data.total - data.active_weekly, 0);
  const levelNameByCode = new Map(data.levels.map((l) => [l.code, l.name]));
  const participation = [
    { key: "active", label: "Aktif", value: data.active_weekly, fill: PARTICIPATION_ACTIVE },
    { key: "inactive", label: "Belum aktif", value: inactive, fill: PARTICIPATION_INACTIVE },
  ];

  // Departments flagged as needing intervention (server-computed) — reused to
  // drive the "Highlight underperform" toggle so the criteria stay consistent.
  const underperformIds = new Set(
    data.groups_needing_intervention.map((group) => group.id)
  );
  const visibleGroups =
    selectedDept === "all"
      ? data.groups
      : data.groups.filter((group) => String(group.id) === selectedDept);

  // Report always exports the full org snapshot (not the on-screen filter).
  const buildReport = (): ReportProps => ({
    org: AILENE_ORG_NAME || undefined,
    program: AILENE_PROGRAM_NAME,
    title: "Distribusi Level Organisasi",
    subtitle: `${data.total.toLocaleString("id-ID")} karyawan · ${data.groups.length} departemen · partisipasi ${data.participation_percent}%`,
    generatedAt: dayjs().format("D MMMM YYYY"),
    sections: [
      {
        type: "donut",
        title: "Tingkat Partisipasi",
        centerValue: `${data.participation_percent}%`,
        centerLabel: "aktif",
        segments: [
          { label: "Aktif", value: data.active_weekly, color: "#1f5f4e" },
          {
            label: "Belum aktif",
            value: Math.max(data.total - data.active_weekly, 0),
            color: "#cbd5e1",
          },
        ],
      },
      ...(data.levels.length > 0
        ? [
            {
              type: "bar" as const,
              title: "Distribusi Level Organisasi",
              items: data.levels.map((l) => ({
                label: `${l.code} · ${l.name}`,
                value: l.count,
                display: `${l.count} (${l.percent}%)`,
              })),
            },
          ]
        : []),
      {
        type: "table",
        title: "Distribusi Level per Departemen",
        columns: ["Departemen", ...data.levels.map((l) => l.code), "Total"],
        align: [
          "left",
          ...data.levels.map(() => "right" as const),
          "right",
        ],
        rows: data.groups.map((g) => [
          g.name,
          ...g.levels.map((l) => l.count),
          g.total,
        ]),
      },
      ...(data.groups_needing_intervention.length > 0
        ? [
            {
              type: "table" as const,
              title: "Departemen Perlu Intervensi",
              columns: ["Departemen", "L0–L1", "Total", "% Pemula"],
              align: ["left", "right", "right", "right"] as (
                | "left"
                | "right"
              )[],
              rows: data.groups_needing_intervention.map((g) => [
                g.name,
                g.entry_level_count,
                g.total,
                `${g.entry_level_percent}%`,
              ]),
            },
          ]
        : []),
    ],
  });

  return (
    <PageContainerAILN>
      <div className="flex w-full flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold tracking-widest text-gray-500 dark:text-gray-400">
              SPONSOR · SNAPSHOT
            </div>
            <h1 className="mt-1 text-2xl font-bold leading-tight text-gray-900 dark:text-white">
              Distribusi Level Organisasi
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Snapshot level karyawan aktif berdasarkan departemen.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ButtonAILN
              variant="light"
              size="medium"
              onClick={() => pdf.generate(buildReport(), "distribusi-level.pdf")}
              disabled={pdf.exporting}
            >
              <Download className="size-4" />
              {pdf.exporting ? "Menyiapkan…" : "Export PDF"}
            </ButtonAILN>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashboard-border bg-white px-4 py-3 shadow-sm dark:bg-card-bg">
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 rounded-md border border-dashboard-border bg-white px-3 py-2 text-xs font-semibold text-gray-700 dark:bg-card-inside-bg dark:text-gray-200">
              Departemen:
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="cursor-pointer bg-transparent font-medium text-gray-700 outline-none dark:text-gray-200"
              >
                <option value="all">Semua</option>
                {data.groups.map((group) => (
                  <option key={group.id} value={String(group.id)}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashboard-border bg-white px-3 py-2 text-xs font-medium text-gray-600 dark:bg-card-inside-bg dark:text-gray-300">
              <input
                type="checkbox"
                checked={highlightUnderperform}
                onChange={(e) => setHighlightUnderperform(e.target.checked)}
                className="size-3.5 rounded border-gray-300 accent-[#1F2937]"
              />
              Highlight underperform
            </label>
            {(selectedDept !== "all" || highlightUnderperform) && (
              <button
                onClick={() => {
                  setSelectedDept("all");
                  setHighlightUnderperform(false);
                }}
                className="text-xs font-medium text-gray-500 underline-offset-2 hover:underline dark:text-gray-400"
              >
                Reset
              </button>
            )}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Sumber: log enrolment + activity per minggu
          </div>
        </div>

        <section className="rounded-lg border border-dashboard-border bg-white p-5 shadow-sm dark:bg-card-bg">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Level distribution x departemen
              </h2>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {selectedDept === "all"
                  ? `${data.groups.length} departemen · sort by total karyawan`
                  : `Difilter · 1 dari ${data.groups.length} departemen`}
                {highlightUnderperform
                  ? ` · ${underperformIds.size} ditandai underperform`
                  : ""}
              </p>
            </div>
            <LevelLegend levels={data.levels} />
          </div>

          <div className="mt-5 flex flex-col gap-3">
            {visibleGroups.length === 0 ? (
              <div className="rounded-md bg-gray-50 px-4 py-5 text-sm text-gray-500 dark:bg-card-inside-bg dark:text-gray-400">
                Tidak ada departemen yang cocok dengan filter.
              </div>
            ) : (
              visibleGroups.map((group) => (
                <DepartmentDistributionRow
                  key={group.id}
                  group={group}
                  levelNameByCode={levelNameByCode}
                  isUnderperform={underperformIds.has(group.id)}
                  dimmed={
                    highlightUnderperform && !underperformIds.has(group.id)
                  }
                  showFlag={highlightUnderperform}
                />
              ))
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section className="flex flex-col rounded-lg border border-dashboard-border bg-white p-5 shadow-sm dark:bg-card-bg">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              Tingkat Partisipasi
            </div>

            <div className="flex flex-1 flex-wrap items-center justify-center gap-x-8 gap-y-4 py-2">
              {/* Donut: aktif vs belum aktif, persen di tengah */}
              <div className="relative">
                <ChartContainer
                  config={participationConfig}
                  className="aspect-square h-44"
                >
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          hideLabel
                          className="border border-dashboard-border bg-popover text-popover-foreground shadow-md"
                        />
                      }
                    />
                    <Pie
                      data={participation}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={56}
                      outerRadius={76}
                      paddingAngle={2}
                      cornerRadius={5}
                      strokeWidth={0}
                    >
                      {participation.map((p) => (
                        <Cell key={p.key} fill={p.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-geist-mono text-3xl font-bold leading-none text-gray-900 dark:text-white">
                    {data.participation_percent}%
                  </span>
                  <span className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                    aktif
                  </span>
                </div>
              </div>

              {/* Legenda + konteks */}
              <div className="flex w-44 flex-col gap-3">
                <LegendStat
                  color={PARTICIPATION_ACTIVE}
                  label="Aktif"
                  value={data.active_weekly}
                />
                <LegendStat
                  color={PARTICIPATION_INACTIVE}
                  label="Belum aktif"
                  value={inactive}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {data.active_weekly} dari {data.total} karyawan login minimal
                  1x minggu ini.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-dashboard-border bg-white p-5 shadow-sm dark:bg-card-bg">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Departemen perlu intervensi
              </div>
              <span
                className="font-geist-mono text-xs font-bold"
                style={{ color: SPONSOR_BLUE_DARK }}
              >
                {data.groups_needing_intervention.length} dept
              </span>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {data.groups_needing_intervention.length === 0 ? (
                <div className="rounded-md bg-gray-50 px-4 py-5 text-sm text-gray-500 dark:bg-card-inside-bg dark:text-gray-400">
                  Tidak ada departemen dengan komposisi L0-L1 di atas threshold.
                </div>
              ) : (
                data.groups_needing_intervention.slice(0, 4).map((group) => (
                  <Link
                    key={group.id}
                    href={`/sponsor/groups/${group.id}`}
                    className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {group.name}
                        </div>
                        <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                          {group.entry_level_count} L0-L1 / {group.total} total
                          · {group.entry_level_percent}% pemula
                        </div>
                      </div>
                      <span
                        className="text-xs font-semibold"
                        style={{ color: SPONSOR_BLUE_DARK }}
                      >
                        Lihat detail
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </PageContainerAILN>
  );
}

function LevelLegend({
  levels,
}: {
  levels: { id: number; code: string; label?: string; name: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 text-[11px] text-gray-500 dark:text-gray-400">
      {levels.map((level, index) => (
        <span key={level.id} className="inline-flex items-center gap-1.5">
          <span
            className="inline-block size-2 rounded-sm"
            style={{ backgroundColor: getColor(index) }}
          />
          {level.label ?? level.code} {level.name}
        </span>
      ))}
    </div>
  );
}

function DepartmentDistributionRow({
  group,
  levelNameByCode,
  isUnderperform = false,
  dimmed = false,
  showFlag = false,
}: {
  group: {
    id: number;
    name: string;
    total: number;
    levels: {
      level_id: number;
      code: string;
      label?: string;
      count: number;
    }[];
  };
  levelNameByCode: Map<string, string>;
  isUnderperform?: boolean;
  dimmed?: boolean;
  showFlag?: boolean;
}) {
  return (
    <Link
      href={`/sponsor/groups/${group.id}`}
      className={`grid grid-cols-[minmax(7rem,10rem)_minmax(0,1fr)_3.5rem] items-center gap-3 rounded-md px-2 py-1 text-sm transition hover:bg-gray-50 dark:hover:bg-card-inside-bg ${
        dimmed ? "opacity-40" : ""
      } ${
        showFlag && isUnderperform
          ? "bg-amber-50 ring-1 ring-amber-300 dark:bg-amber-500/10 dark:ring-amber-500/40"
          : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="truncate font-medium text-gray-700 dark:text-gray-200">
          {group.name}
        </span>
        {showFlag && isUnderperform && (
          <span className="shrink-0 rounded-sm bg-amber-200 px-1 text-[10px] font-semibold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
            ⚠
          </span>
        )}
      </div>
      {/* 100% stacked bar — each segment's width = that level's share of the dept */}
      <TooltipProvider delayDuration={80}>
        <div className="flex h-7 w-full overflow-hidden rounded-sm bg-gray-100 dark:bg-dashboard-border">
          {group.levels.map((level, index) => {
            const pct = group.total > 0 ? (level.count / group.total) * 100 : 0;
            if (pct <= 0) return null;
            const name = levelNameByCode.get(level.code);
            return (
              <Tooltip key={level.level_id}>
                <TooltipTrigger asChild>
                  <div
                    className="flex cursor-pointer items-center justify-center px-1 text-[11px] font-bold transition-opacity hover:opacity-90"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: getColor(index),
                      color: index <= 1 ? "#1f2937" : "#ffffff",
                    }}
                  >
                    {pct >= 12 && (
                      <span className="truncate">{Math.round(pct)}%</span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="border border-dashboard-border bg-popover text-popover-foreground shadow-md">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold">
                      {level.label ?? level.code}
                      {name ? ` · ${name}` : ""}
                    </span>
                    <span className="text-muted-foreground">
                      {level.count.toLocaleString("id-ID")} orang ·{" "}
                      {Math.round(pct)}%
                    </span>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
      <div className="text-right font-geist-mono text-xs font-semibold text-gray-700 dark:text-gray-200">
        {group.total} org
      </div>
    </Link>
  );
}

function LevelDistributionSkeleton() {
  return (
    <div className="flex w-full flex-col gap-4 animate-pulse">
      <div className="h-20 rounded-lg bg-gray-100 dark:bg-dashboard-border" />
      <div className="h-14 rounded-lg bg-gray-100 dark:bg-dashboard-border" />
      <div className="h-96 rounded-lg bg-gray-100 dark:bg-dashboard-border" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-44 rounded-lg bg-gray-100 dark:bg-dashboard-border" />
        <div className="h-44 rounded-lg bg-gray-100 dark:bg-dashboard-border" />
      </div>
    </div>
  );
}

function getColor(index: number) {
  return LEVEL_COLORS[index] ?? LEVEL_COLORS[LEVEL_COLORS.length - 1];
}

function LegendStat({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="size-2.5 shrink-0 rounded-sm"
        style={{ backgroundColor: color }}
      />
      <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
      <span className="ml-auto font-geist-mono text-sm font-bold text-gray-900 dark:text-white">
        {value.toLocaleString("id-ID")}
      </span>
    </div>
  );
}
