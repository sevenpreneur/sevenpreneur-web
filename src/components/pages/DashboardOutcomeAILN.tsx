"use client";
import ButtonAILN from "@/components/buttons/ButtonAILN";
import PageContainerAILN from "@/components/pages/PageContainerAILN";
import { setSessionToken, trpc } from "@/trpc/client";
import { Download } from "lucide-react";
import { useEffect } from "react";

const formatInt = (n: number) => n.toLocaleString("id-ID");
const formatScore = (n: number) =>
  n.toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
const formatHours = (n: number) =>
  n.toLocaleString("id-ID", { maximumFractionDigits: 1 });

function formatCompactIdr(value: number): { value: string; unit: string } {
  if (value >= 1_000_000_000) {
    return {
      value: (value / 1_000_000_000).toLocaleString("id-ID", {
        maximumFractionDigits: 2,
      }),
      unit: "M",
    };
  }
  if (value >= 1_000_000) {
    return {
      value: (value / 1_000_000).toLocaleString("id-ID", {
        maximumFractionDigits: 1,
      }),
      unit: "jt",
    };
  }
  return { value: value.toLocaleString("id-ID"), unit: "" };
}

// ---------- Page ----------

export default function DashboardOutcomeAILN({
  sessionToken,
}: {
  sessionToken: string;
}) {
  useEffect(() => {
    setSessionToken(sessionToken);
  }, [sessionToken]);

  const overviewQ = trpc.ailene.read.outcome.overview.useQuery();
  const levelQ = trpc.ailene.read.outcome.levelDistribution.useQuery();
  const performersQ = trpc.ailene.read.outcome.topPerformers.useQuery();

  const overview = overviewQ.data;
  const roi = formatCompactIdr(overview?.roi_total ?? 0);

  return (
    <PageContainerAILN>
      <div className="flex w-full flex-col gap-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold tracking-widest text-gray-500 dark:text-gray-400">
              SPONSOR · LAPORAN AKHIR PROGRAM
            </div>
            <h1 className="mt-1 text-3xl font-bold leading-tight text-gray-900 dark:text-white">
              Outcome Report
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Program AI Adoption ·{" "}
              {overview
                ? `${formatInt(overview.member_count)} karyawan · ${overview.department_count} departemen`
                : "— karyawan · — departemen"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ButtonAILN variant="light" size="medium">
              <Download className="size-4" />
              Export PDF
            </ButtonAILN>
          </div>
        </div>

        {/* 4 KPI tiles */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <KpiTile
            label="JAM DIHEMAT KUMULATIF"
            value={overview ? formatHours(overview.hours_saved_total) : "—"}
            unit="jam"
            sub={
              overview ? `≈ ${formatScore(overview.fte_equivalent)} FTE setahun` : "—"
            }
            loading={overviewQ.isLoading}
          />
          <KpiTile
            label="ROI ESTIMASI"
            prefix="Rp"
            value={overview ? roi.value : "—"}
            unit={roi.unit}
            sub={
              overview
                ? `basis Rp${formatInt(overview.roi_rate_per_hour)}/jam dihemat`
                : "—"
            }
            loading={overviewQ.isLoading}
          />
          <KpiTile
            label="AVG LEVEL SAAT INI"
            value={overview ? formatScore(overview.avg_level) : "—"}
            unit={overview ? `/ ${overview.max_level_number}` : "/ —"}
            sub={overview ? `skala L0–L${overview.max_level_number}` : "—"}
            loading={overviewQ.isLoading}
          />
          <KpiTile
            label="KARYAWAN TERSERTIFIKASI"
            value={overview ? formatInt(overview.certified_count) : "—"}
            unit={overview ? `/ ${overview.member_count}` : "/ —"}
            sub={
              overview ? `${overview.certified_percent}% selesai ≥ L1` : "—"
            }
            loading={overviewQ.isLoading}
          />
        </div>

        {/* Level distribution */}
        <Section
          title="Distribusi level organisasi"
          subtitle="% karyawan per level · kondisi saat ini"
        >
          {levelQ.isLoading || !levelQ.data ? (
            <Skeleton className="h-56" />
          ) : levelQ.data.total === 0 ? (
            <EmptyHint />
          ) : (
            <LevelBars distribution={levelQ.data.distribution} />
          )}
        </Section>

        {/* Top performers */}
        <Section
          title="Top Performers Org-Wide"
          subtitle="Bintang individual seluruh organisasi · composite score"
          badge={
            performersQ.data
              ? `${formatInt(performersQ.data.total)} karyawan`
              : undefined
          }
        >
          {performersQ.isLoading || !performersQ.data ? (
            <Skeleton className="h-72" />
          ) : performersQ.data.total === 0 ? (
            <EmptyHint />
          ) : (
            <TopPerformersTable list={performersQ.data.list} />
          )}
        </Section>
      </div>
    </PageContainerAILN>
  );
}

// ---------- KPI tile ----------

function KpiTile({
  label,
  value,
  unit,
  prefix,
  sub,
  loading,
}: {
  label: string;
  value: string;
  unit: string;
  prefix?: string;
  sub: string;
  loading: boolean;
}) {
  return (
    <div className="flex flex-col rounded-lg border border-dashboard-border bg-white p-4 shadow-sm dark:bg-card-bg dark:shadow-[0_0_16px_rgba(0,53,157,0.06)]">
      <div className="text-[10px] font-semibold tracking-widest text-gray-500 dark:text-gray-400">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        {prefix && (
          <span className="text-lg font-semibold text-gray-400 dark:text-gray-500">
            {prefix}
          </span>
        )}
        <span className="text-4xl font-bold leading-none text-gray-900 dark:text-white">
          {loading ? "—" : value}
        </span>
        {unit && (
          <span className="text-sm text-gray-400 dark:text-gray-500">
            {unit}
          </span>
        )}
      </div>
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">{sub}</div>
    </div>
  );
}

// ---------- Section card ----------

function Section({
  title,
  subtitle,
  badge,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-lg border border-dashboard-border bg-white p-5 shadow-sm dark:bg-card-bg dark:shadow-[0_0_16px_rgba(0,53,157,0.06)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <div className="text-base font-bold text-gray-900 dark:text-white">
            {title}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
        {badge && (
          <span className="shrink-0 rounded-full border border-dashboard-border bg-gray-50 px-2.5 py-0.5 text-[11px] font-semibold text-gray-500 dark:bg-card-inside-bg dark:text-gray-400">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ---------- Level distribution bars ----------

function LevelBars({
  distribution,
}: {
  distribution: {
    level_number: number;
    code: string;
    name: string;
    count: number;
    percent: number;
  }[];
}) {
  const maxPercent = Math.max(...distribution.map((d) => d.percent), 1);
  return (
    <div className="flex h-56 items-end gap-3 sm:gap-6">
      {distribution.map((d) => {
        const h = (d.percent / maxPercent) * 100;
        return (
          <div
            key={d.level_number}
            className="flex h-full flex-1 flex-col items-center justify-end gap-2"
          >
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {d.percent}%
            </span>
            <div className="flex w-full max-w-16 flex-1 items-end">
              <div
                className="w-full rounded-t-sm bg-emerald-600 dark:bg-emerald-500"
                style={{ height: `${Math.max(h, d.percent > 0 ? 4 : 0)}%` }}
              />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {d.code}
              </span>
              <span className="text-[11px] text-gray-400 dark:text-gray-500">
                {d.name}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------- Top performers table ----------

function TopPerformersTable({
  list,
}: {
  list: {
    rank: number;
    member_id: number;
    full_name: string;
    department: string;
    level_code: string;
    composite: number;
    use_case_count: number;
    hours: number;
  }[];
}) {
  return (
    <div className="max-h-[640px] overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-white dark:bg-card-bg">
          <tr className="border-b border-dashboard-border text-left text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
            <th className="pb-2 pr-3 font-semibold">#</th>
            <th className="pb-2 pr-3 font-semibold">Karyawan</th>
            <th className="pb-2 pr-3 font-semibold">Departemen</th>
            <th className="pb-2 pr-3 font-semibold">Level</th>
            <th className="pb-2 pr-3 font-semibold">Composite</th>
            <th className="pb-2 pr-3 text-right font-semibold">Use case</th>
            <th className="pb-2 text-right font-semibold">Jam</th>
          </tr>
        </thead>
        <tbody>
          {list.map((p) => (
            <tr
              key={p.member_id}
              className="border-b border-dashboard-border/60 last:border-0"
            >
              <td className="py-2.5 pr-3 tabular-nums text-gray-400 dark:text-gray-500">
                {p.rank}
              </td>
              <td className="py-2.5 pr-3 font-medium text-gray-900 dark:text-white">
                {p.full_name}
              </td>
              <td className="py-2.5 pr-3 text-gray-600 dark:text-gray-300">
                {p.department}
              </td>
              <td className="py-2.5 pr-3">
                <span className="inline-flex items-center rounded-full border border-dashboard-border bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:bg-card-inside-bg dark:text-gray-300">
                  {p.level_code}
                </span>
              </td>
              <td className="py-2.5 pr-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100 dark:bg-dashboard-border">
                    <div
                      className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500"
                      style={{
                        width: `${Math.min(100, Math.max(0, p.composite))}%`,
                      }}
                    />
                  </div>
                  <span className="w-7 text-right tabular-nums font-semibold text-gray-900 dark:text-white">
                    {p.composite}
                  </span>
                </div>
              </td>
              <td className="py-2.5 pr-3 text-right tabular-nums text-gray-700 dark:text-gray-300">
                {p.use_case_count}
              </td>
              <td className="py-2.5 text-right tabular-nums text-gray-700 dark:text-gray-300">
                {formatHours(p.hours)}j
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- States ----------

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-100 dark:bg-dashboard-border ${className ?? ""}`}
    />
  );
}

function EmptyHint() {
  return (
    <div className="flex h-32 items-center justify-center text-sm text-gray-400 dark:text-gray-500">
      Belum ada data.
    </div>
  );
}
