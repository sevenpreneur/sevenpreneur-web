"use client";
import { AILENE_ORG_NAME, AILENE_PROGRAM_NAME } from "@/lib/ailene-config";
import {
  usePdfReport,
  type ReportProps,
} from "@/components/reports/AileneReportPDF";
import ButtonAILN from "@/components/buttons/ButtonAILN";
import ScorecardAILN from "@/components/cards/ScorecardAILN";
import PageContainerAILN from "@/components/pages/PageContainerAILN";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { setSessionToken, trpc } from "@/trpc/client";
import dayjs from "dayjs";
import { Download } from "lucide-react";
import { useEffect } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

// Level the program wants employees to reach (≥). Adjust to the real goal.
const TARGET_LEVEL = 2;
const OUTCOME_GREEN = "#1f5f4e";
const OUTCOME_GRAY = "#e2e8f0";
// Deterministic sample shape for the "process" line (rising), 30 points 0..1.
// Used only for the illustrative trend until a real time-series endpoint exists.
const PROCESS_CURVE = [
  0.16, 0.2, 0.18, 0.24, 0.27, 0.25, 0.31, 0.34, 0.32, 0.37, 0.41, 0.39, 0.44,
  0.48, 0.46, 0.51, 0.55, 0.53, 0.58, 0.62, 0.6, 0.66, 0.7, 0.68, 0.74, 0.79,
  0.82, 0.87, 0.93, 1,
];
const processConfig = {
  value: { label: "% capai target", color: OUTCOME_GREEN },
} satisfies ChartConfig;
const donutConfig = {
  reached: { label: "Sudah", color: OUTCOME_GREEN },
  below: { label: "Belum", color: OUTCOME_GRAY },
} satisfies ChartConfig;

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

  const pdf = usePdfReport();
  const overviewQ = trpc.ailene.read.outcome.overview.useQuery();
  const levelQ = trpc.ailene.read.outcome.levelDistribution.useQuery();
  const performersQ = trpc.ailene.read.outcome.topPerformers.useQuery();

  const overview = overviewQ.data;
  const roi = formatCompactIdr(overview?.roi_total ?? 0);

  const buildReport = (): ReportProps => {
    const sections: ReportProps["sections"] = [];
    if (overview) {
      sections.push({
        type: "kpi",
        title: "Hasil Akhir Program",
        items: [
          {
            label: "Jam Dihemat Kumulatif",
            value: formatHours(overview.hours_saved_total),
            unit: "jam",
            footer: `≈ ${formatScore(overview.fte_equivalent)} FTE setahun`,
          },
          {
            label: "ROI Estimasi",
            value: `Rp ${roi.value}`,
            unit: roi.unit,
            footer: `basis Rp${formatInt(overview.roi_rate_per_hour)}/jam`,
          },
          {
            label: "Avg Level Saat Ini",
            value: formatScore(overview.avg_level),
            unit: `/ ${overview.max_level_number}`,
            footer: `skala L0–L${overview.max_level_number}`,
          },
          {
            label: "Karyawan Tersertifikasi",
            value: formatInt(overview.certified_count),
            unit: `/ ${overview.member_count}`,
            footer: `${overview.certified_percent}% selesai ≥ L1`,
          },
        ],
      });
    }
    const dist = levelQ.data?.distribution ?? [];
    const distTotal = dist.reduce((sum, d) => sum + d.count, 0) || 1;
    if (dist.length > 0) {
      const achieved = dist
        .filter((d) => d.level_number >= TARGET_LEVEL)
        .reduce((sum, d) => sum + d.count, 0);
      sections.push({
        type: "donut",
        title: `Hasil Akhir · Capai ≥ L${TARGET_LEVEL}`,
        centerValue: `${Math.round((achieved / distTotal) * 100)}%`,
        centerLabel: `≥ L${TARGET_LEVEL}`,
        segments: [
          { label: `Capai ≥ L${TARGET_LEVEL}`, value: achieved, color: "#1f5f4e" },
          {
            label: "Belum",
            value: Math.max(distTotal - achieved, 0),
            color: "#cbd5e1",
          },
        ],
      });
    }
    if (dist.length > 0) {
      sections.push({
        type: "table",
        title: "Distribusi Level Akhir",
        columns: ["Level", "Karyawan", "%"],
        align: ["left", "right", "right"],
        rows: dist.map((d) => [
          `L${d.level_number} · ${d.name}`,
          formatInt(d.count),
          `${Math.round((d.count / distTotal) * 100)}%`,
        ]),
      });
    }
    const performers = performersQ.data?.list ?? [];
    if (performers.length > 0) {
      sections.push({
        type: "table",
        title: "Top Performers Org-Wide",
        columns: ["#", "Karyawan", "Departemen", "Level", "Skor", "Use case", "Jam"],
        align: ["right", "left", "left", "left", "right", "right", "right"],
        rows: performers.map((p) => [
          p.rank,
          p.full_name,
          p.department,
          p.level_code,
          p.composite,
          formatInt(p.use_case_count),
          formatScore(p.hours),
        ]),
      });
    }
    return {
      org: AILENE_ORG_NAME || undefined,
      program: AILENE_PROGRAM_NAME,
      title: "Outcome Report",
      subtitle: overview
        ? `${formatInt(overview.member_count)} karyawan · ${overview.department_count} departemen`
        : undefined,
      generatedAt: dayjs().format("D MMMM YYYY"),
      sections,
    };
  };

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
              {AILENE_PROGRAM_NAME} ·{" "}
              {overview
                ? `${formatInt(overview.member_count)} karyawan · ${overview.department_count} departemen`
                : "— karyawan · — departemen"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ButtonAILN
              variant="light"
              size="medium"
              onClick={() => pdf.generate(buildReport(), "outcome-report.pdf")}
              disabled={pdf.exporting || !overview}
            >
              <Download className="size-4" />
              {pdf.exporting ? "Menyiapkan…" : "Export PDF"}
            </ButtonAILN>
          </div>
        </div>

        {/* 4 KPI cards — same ScorecardAILN cards as the executive summary */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <ScorecardAILN
            title="Jam Dihemat Kumulatif"
            value={overview ? formatHours(overview.hours_saved_total) : "—"}
            unit="jam"
          >
            <KpiCaption>
              {overview
                ? `≈ ${formatScore(overview.fte_equivalent)} FTE setahun`
                : "—"}
            </KpiCaption>
          </ScorecardAILN>
          <ScorecardAILN
            title="ROI Estimasi"
            value={overview ? `Rp ${roi.value}` : "—"}
            unit={roi.unit}
          >
            <KpiCaption>
              {overview
                ? `basis Rp${formatInt(overview.roi_rate_per_hour)}/jam dihemat`
                : "—"}
            </KpiCaption>
          </ScorecardAILN>
          <ScorecardAILN
            title="Avg Level Saat Ini"
            value={overview ? formatScore(overview.avg_level) : "—"}
            unit={overview ? `/ ${overview.max_level_number}` : "/ —"}
          >
            <KpiCaption>
              {overview ? `skala L0–L${overview.max_level_number}` : "—"}
            </KpiCaption>
          </ScorecardAILN>
          <ScorecardAILN
            title="Karyawan Tersertifikasi"
            value={overview ? formatInt(overview.certified_count) : "—"}
            unit={overview ? `/ ${overview.member_count}` : "/ —"}
          >
            <KpiCaption>
              {overview ? `${overview.certified_percent}% selesai ≥ L1` : "—"}
            </KpiCaption>
          </ScorecardAILN>
        </div>

        {/* Progres menuju level target — proses (kiri) + hasil akhir (kanan) */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.7fr_1fr]">
          <Section
            title={`Proses · % capai ≥ L${TARGET_LEVEL}`}
            subtitle={`Karyawan yang mencapai ${targetLevelName(levelQ.data)} dari waktu ke waktu`}
            badge="data contoh"
          >
            {levelQ.isLoading || !levelQ.data ? (
              <Skeleton className="h-56" />
            ) : levelQ.data.total === 0 ? (
              <EmptyHint />
            ) : (
              <ProcessArea distribution={levelQ.data.distribution} />
            )}
          </Section>

          <Section
            title={`Hasil akhir · capai ≥ L${TARGET_LEVEL}`}
            subtitle="Sudah vs belum mencapai level target"
          >
            {levelQ.isLoading || !levelQ.data ? (
              <Skeleton className="h-56" />
            ) : levelQ.data.total === 0 ? (
              <EmptyHint />
            ) : (
              <ResultDonut distribution={levelQ.data.distribution} />
            )}
          </Section>
        </div>

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

// ---------- KPI caption ----------

// Footer caption inside ScorecardAILN's divided zone (matches executive view).
function KpiCaption({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
      {children}
    </span>
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
            <p className="text-sm text-gray-500 dark:text-gray-400">
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

// ---------- Progres menuju level target ----------

type LevelDist = {
  level_number: number;
  code: string;
  name: string;
  count: number;
  percent: number;
}[];

function targetLevelName(data?: { distribution: LevelDist }) {
  const name = data?.distribution.find(
    (d) => d.level_number === TARGET_LEVEL
  )?.name;
  return name ? `≥ L${TARGET_LEVEL} ${name}` : `≥ L${TARGET_LEVEL}`;
}

function deriveTarget(distribution: LevelDist) {
  const total = distribution.reduce((sum, d) => sum + d.count, 0) || 1;
  const reached = distribution
    .filter((d) => d.level_number >= TARGET_LEVEL)
    .reduce((sum, d) => sum + d.count, 0);
  const below = Math.max(total - reached, 0);
  const currentPct = Math.round((reached / total) * 100);
  return { total, reached, below, currentPct };
}

// Proses: tren % karyawan capai ≥ target dari waktu ke waktu (sample sampai
// ada endpoint time-series asli; berakhir di angka capaian sekarang).
function ProcessArea({ distribution }: { distribution: LevelDist }) {
  const { currentPct } = deriveTarget(distribution);
  const days = PROCESS_CURVE.length;
  const processData = PROCESS_CURVE.map((f, i) => ({
    date: dayjs()
      .subtract(days - 1 - i, "day")
      .format("D MMM"),
    value: Math.round(f * currentPct),
  }));

  return (
    <div className="flex flex-1 flex-col">
      <ChartContainer
        config={processConfig}
        className="aspect-auto h-56 w-full flex-1"
      >
        <AreaChart
          data={processData}
          margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="proc-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={OUTCOME_GREEN} stopOpacity={0.25} />
              <stop offset="100%" stopColor={OUTCOME_GREEN} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
            fontSize={11}
          />
          <YAxis
            width={40}
            tickLine={false}
            axisLine={false}
            fontSize={11}
            domain={[0, (max: number) => Math.max(Math.ceil(max * 1.3), 10)]}
            tickFormatter={(v) => `${v}%`}
          />
          <ChartTooltip
            cursor={{ stroke: "var(--color-dashboard-border)" }}
            content={
              <ChartTooltipContent
                className="border border-dashboard-border bg-popover text-popover-foreground shadow-md"
                labelFormatter={(label) => String(label)}
                formatter={(value) => (
                  <span className="font-mono font-medium tabular-nums text-foreground">
                    {Number(value)}% capai ≥ L{TARGET_LEVEL}
                  </span>
                )}
              />
            }
          />
          <Area
            dataKey="value"
            type="monotone"
            stroke={OUTCOME_GREEN}
            strokeWidth={2}
            fill="url(#proc-fill)"
          />
        </AreaChart>
      </ChartContainer>
      <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
        Sumbu Y = % capai ≥ L{TARGET_LEVEL} · 30 hari terakhir · tren ilustratif
      </p>
    </div>
  );
}

// Hasil akhir: donut sudah vs belum capai target, % di tengah.
function ResultDonut({ distribution }: { distribution: LevelDist }) {
  const { reached, below, currentPct } = deriveTarget(distribution);
  const donutData = [
    { key: "reached", label: `≥ L${TARGET_LEVEL}`, value: reached, fill: OUTCOME_GREEN },
    { key: "below", label: "Belum", value: below, fill: OUTCOME_GRAY },
  ];

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <div className="relative">
        <ChartContainer config={donutConfig} className="aspect-square h-40">
          <PieChart>
            <Pie
              data={donutData}
              dataKey="value"
              nameKey="label"
              innerRadius={50}
              outerRadius={68}
              paddingAngle={2}
              cornerRadius={4}
              strokeWidth={0}
            >
              {donutData.map((d) => (
                <Cell key={d.key} fill={d.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-geist-mono text-2xl font-bold leading-none text-gray-900 dark:text-white">
            {currentPct}%
          </span>
          <span className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
            ≥ L{TARGET_LEVEL}
          </span>
        </div>
      </div>
      <div className="flex w-44 flex-col gap-2 text-sm">
        <LegendStat
          color={OUTCOME_GREEN}
          label={`Sudah ≥ L${TARGET_LEVEL}`}
          value={reached}
        />
        <LegendStat color={OUTCOME_GRAY} label="Belum" value={below} />
      </div>
    </div>
  );
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
      <span className="text-gray-700 dark:text-gray-200">{label}</span>
      <span className="ml-auto font-geist-mono font-bold text-gray-900 dark:text-white">
        {formatInt(value)}
      </span>
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
