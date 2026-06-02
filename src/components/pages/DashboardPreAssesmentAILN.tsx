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
  ShareBarList,
  ShareBarListContent,
  ShareBarListFill,
  ShareBarListItem,
  ShareBarListLabel,
  ShareBarListValue,
} from "@/components/share-bar-list";
import { setSessionToken, trpc } from "@/trpc/client";
import {
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from "chart.js";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { Building2, ChevronDown, Download } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
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

// ---------- Page ----------

export default function DashboardPreAssesmentAILN({
  sessionToken,
}: {
  sessionToken: string;
}) {
  useEffect(() => {
    setSessionToken(sessionToken);
  }, [sessionToken]);

  const pdf = usePdfReport();
  const [groupId, setGroupId] = useState<number | undefined>(undefined);
  const filter = { group_id: groupId };

  const departmentsQ = trpc.ailene.read.preAssessment.departments.useQuery();
  const overviewQ = trpc.ailene.read.preAssessment.overview.useQuery(filter);
  const pillarsQ = trpc.ailene.read.preAssessment.pillars.useQuery(filter);
  const frequencyQ =
    trpc.ailene.read.preAssessment.usageFrequency.useQuery(filter);
  const toolsQ = trpc.ailene.read.preAssessment.tools.useQuery(filter);
  const maturityQ =
    trpc.ailene.read.preAssessment.teamMaturity.useQuery(filter);
  const safetyQ = trpc.ailene.read.preAssessment.safetyGaps.useQuery(filter);
  const useCasesQ =
    trpc.ailene.read.preAssessment.topUseCases.useQuery(filter);
  const voiceQ = trpc.ailene.read.preAssessment.voice.useQuery(filter);

  const overview = overviewQ.data;
  const measuredLabel = overview?.measured_at
    ? dayjs(overview.measured_at).locale("id").format("D MMMM YYYY")
    : "—";

  const buildReport = (): ReportProps => {
    const sections: ReportProps["sections"] = [];
    if (overview) {
      sections.push({
        type: "kpi",
        title: "Ringkasan Kondisi Awal",
        items: [
          {
            label: "Partisipasi",
            value: `${overview.participation_percent}%`,
            footer: `${overview.completed_count} dari ${overview.total_members} karyawan`,
          },
          {
            label: "Pengguna Rutin AI",
            value: `${overview.routine_users_percent}%`,
            footer: "pakai AI rutin (q1)",
          },
          {
            label: "Literasi Dasar",
            value: `${overview.basic_literacy_percent}%`,
            footer: "paham dasar AI",
          },
          {
            label: "Skor Pilar (rata-rata)",
            value: pillarsQ.data ? formatScore(pillarsQ.data.org_avg) : "—",
            unit: "/ 5",
            footer: "6 pilar kompetensi",
          },
        ],
      });
    }
    if (pillarsQ.data) {
      sections.push({
        type: "table",
        title: "Skor 6 Pilar Kompetensi",
        columns: ["Pilar", "Skor / 5"],
        align: ["left", "right"],
        rows: pillarsQ.data.pillars.map((p) => [p.name, formatScore(p.score)]),
      });
    }
    if (frequencyQ.data) {
      sections.push({
        type: "table",
        title: "Frekuensi Pemakaian AI",
        columns: ["Kategori", "%"],
        align: ["left", "right"],
        rows: frequencyQ.data.buckets.map((b) => [b.label, `${b.percent}%`]),
      });
    }
    if (toolsQ.data && toolsQ.data.tools.length > 0) {
      sections.push({
        type: "table",
        title: "Tools AI Terpakai",
        columns: ["Tool", "%"],
        align: ["left", "right"],
        rows: toolsQ.data.tools.map((t) => [t.label, `${t.percent}%`]),
      });
    }
    if (maturityQ.data) {
      sections.push({
        type: "table",
        title: "Kematangan Tim",
        columns: ["Kategori", "%"],
        align: ["left", "right"],
        rows: maturityQ.data.buckets.map((b) => [b.label, `${b.percent}%`]),
      });
    }
    if (safetyQ.data && safetyQ.data.gaps.length > 0) {
      sections.push({
        type: "table",
        title: "Gap Praktik Keamanan",
        columns: ["Praktik", "Gap %"],
        align: ["left", "right"],
        rows: safetyQ.data.gaps.map((g) => [g.label, `${g.gap_percent}%`]),
      });
    }
    if (useCasesQ.data && useCasesQ.data.useCases.length > 0) {
      sections.push({
        type: "table",
        title: "Use Case Paling Diincar",
        columns: ["Use case", "%"],
        align: ["left", "right"],
        rows: useCasesQ.data.useCases.map((u) => [u.label, `${u.percent}%`]),
      });
    }
    return {
      org: AILENE_ORG_NAME || undefined,
      program: AILENE_PROGRAM_NAME,
      title: "Laporan Pre-Assessment",
      subtitle: overview
        ? `${overview.completed_count} dari ${overview.total_members} karyawan · diukur ${measuredLabel}`
        : undefined,
      generatedAt: dayjs().locale("id").format("D MMMM YYYY"),
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
              SPONSOR · BASELINE T0 · SEBELUM PROGRAM
            </div>
            <h1 className="mt-1 text-3xl font-bold leading-tight text-gray-900 dark:text-white">
              Baseline AI State Organisasi
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Snapshot kondisi awal · diukur {measuredLabel} ·{" "}
              {overview
                ? `${overview.completed_count} dari ${overview.total_members} karyawan menyelesaikan pre-assessment`
                : "— dari — karyawan menyelesaikan pre-assessment"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ButtonAILN
              variant="light"
              size="medium"
              onClick={() =>
                pdf.generate(buildReport(), "pre-assessment-report.pdf")
              }
              disabled={pdf.exporting || !overview}
            >
              <Download className="size-4" />
              {pdf.exporting ? "Menyiapkan…" : "Export PDF"}
            </ButtonAILN>
          </div>
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashboard-border bg-white px-4 py-3 dark:bg-card-bg">
          <div className="flex flex-wrap items-center gap-3">
            <DepartmentFilter
              departments={departmentsQ.data?.departments ?? []}
              totalMembers={departmentsQ.data?.total_members ?? 0}
              groupId={groupId}
              onChange={setGroupId}
            />
            <span className="rounded-full border border-dashboard-border bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-card-inside-bg dark:text-gray-300">
              Titik nol — sebelum modul pertama
            </span>
          </div>
        </div>

        {/* 4 KPI tiles — same ScorecardAILN cards as the executive summary */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <ScorecardAILN
            title="Partisipasi Pre-assessment"
            value={overview ? `${overview.participation_percent}` : "—"}
            unit="%"
          >
            <KpiCaption>
              {overview
                ? `${overview.completed_count} dari ${overview.total_members} karyawan`
                : "—"}
            </KpiCaption>
          </ScorecardAILN>
          <ScorecardAILN
            title="Pemakai AI Rutin"
            value={overview ? `${overview.routine_users_percent}` : "—"}
            unit="%"
          >
            <KpiCaption>harian atau lebih sering (q1)</KpiCaption>
          </ScorecardAILN>
          <ScorecardAILN
            title="Literasi Dasar Memadai"
            value={overview ? `${overview.basic_literacy_percent}` : "—"}
            unit="%"
          >
            <KpiCaption>paham konsep dasar ke atas (q4)</KpiCaption>
          </ScorecardAILN>
          <ScorecardAILN
            title="Kesiapan Rata-rata Pillar"
            value={pillarsQ.data ? formatScore(pillarsQ.data.org_avg) : "—"}
            unit="/ 5"
          >
            <KpiCaption>self-rating 6 pillar</KpiCaption>
          </ScorecardAILN>
        </div>

        {/* Pillars radar + usage frequency */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Section
            title="Kesiapan 6 pillar — rata-rata organisasi"
            subtitle="Titik nol yang akan diukur lagi di akhir program"
            badge="T0"
          >
            {pillarsQ.isLoading || !pillarsQ.data ? (
              <Skeleton className="h-[300px]" />
            ) : (
              <div className="flex flex-col items-center gap-3">
                <PillarRadar
                  labels={pillarsQ.data.pillars.map((p) => p.name)}
                  values={pillarsQ.data.pillars.map((p) => p.score)}
                />
                <div className="inline-flex items-center gap-2 rounded-full border border-dashboard-border bg-card-inside-bg px-4 py-1.5 text-sm dark:bg-card-inside-bg/60">
                  <span className="text-gray-500 dark:text-gray-400">
                    Rata-rata org
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {formatScore(pillarsQ.data.org_avg)}
                  </span>
                  <span className="text-gray-400 dark:text-gray-500">/ 5</span>
                </div>
              </div>
            )}
          </Section>

          <Section
            title="Frekuensi pemakaian AI"
            subtitle={`Sebelum program · % dari ${frequencyQ.data?.respondents ?? "—"} responden (q1)`}
            note="Tersorot = pemakai rutin (harian+). Mayoritas masih sporadis — ruang besar untuk peningkatan adopsi."
          >
            {frequencyQ.isLoading || !frequencyQ.data ? (
              <SkeletonRows />
            ) : (
              <ShareBarList>
                {frequencyQ.data.buckets.map((b) => (
                  <BarRow
                    key={b.key}
                    label={b.label}
                    percent={b.percent}
                    tone={b.highlight ? "highlight" : "neutral"}
                  />
                ))}
              </ShareBarList>
            )}
          </Section>
        </div>

        {/* Penetrasi tools · Kematangan adopsi · Kesadaran keamanan · Use case
            — 1 kolom (HP) → 2+2 (tablet) → 4 sejajar (desktop) */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Section
            title="Penetrasi tools AI"
            subtitle={`Pernah dipakai · multi-pilih · % responden (q2)`}
          >
            {toolsQ.isLoading || !toolsQ.data ? (
              <SkeletonRows />
            ) : toolsQ.data.tools.length === 0 ? (
              <EmptyHint />
            ) : (
              <ShareBarList>
                {toolsQ.data.tools.map((t) => (
                  <BarRow
                    key={t.label}
                    label={t.label}
                    percent={t.percent}
                    tone="neutral"
                  />
                ))}
              </ShareBarList>
            )}
          </Section>

          <Section
            title="Kematangan adopsi tim"
            subtitle="Kondisi adopsi di departemen masing-masing (q8)"
            note={
              maturityQ.data
                ? `Hanya ${maturityQ.data.formal_percent}% tim punya kebijakan/integrasi resmi — sisanya belum terstruktur.`
                : undefined
            }
          >
            {maturityQ.isLoading || !maturityQ.data ? (
              <SkeletonRows />
            ) : (
              <ShareBarList>
                {maturityQ.data.buckets.map((b) => (
                  <BarRow
                    key={b.key}
                    label={b.label}
                    percent={b.percent}
                    tone={b.highlight ? "highlight" : "neutral"}
                  />
                ))}
              </ShareBarList>
            )}
          </Section>

          <Section
            title="Kesadaran keamanan — gap"
            subtitle="% karyawan yang BELUM menyadari praktik aman (q11)"
            badge="Lensa risiko"
            badgeTone="warn"
            note="Prioritas compliance: hak cipta & transparansi adalah celah terbesar. Modul Ethics & Safety perlu diutamakan."
          >
            {safetyQ.isLoading || !safetyQ.data ? (
              <SkeletonRows />
            ) : (
              <ShareBarList>
                {safetyQ.data.gaps.map((g) => (
                  <BarRow
                    key={g.label}
                    label={g.label}
                    percent={g.gap_percent}
                    tone="warn"
                  />
                ))}
              </ShareBarList>
            )}
          </Section>

          <Section
            title="Use case paling diincar"
            subtitle="Untuk apa AI ingin dipakai · % responden (q7)"
            note="Sinyal untuk Champion: prioritaskan konten menulis & meringkas — kebutuhan terbesar lintas departemen."
          >
            {useCasesQ.isLoading || !useCasesQ.data ? (
              <SkeletonRows />
            ) : useCasesQ.data.useCases.length === 0 ? (
              <EmptyHint />
            ) : (
              <ShareBarList>
                {useCasesQ.data.useCases.map((u) => (
                  <BarRow
                    key={u.label}
                    leading={
                      <span className="w-4 shrink-0 text-right text-xs tabular-nums text-gray-400 dark:text-gray-500">
                        {u.rank}
                      </span>
                    }
                    label={u.label}
                    percent={u.percent}
                    tone={u.highlight ? "highlight" : "neutral"}
                  />
                ))}
              </ShareBarList>
            )}
          </Section>
        </div>

        {/* Voice of employees */}
        <Section
          title="Suara karyawan"
          subtitle="Klaster tema dari jawaban terbuka · angka = jumlah penyebutan"
        >
          {voiceQ.isLoading || !voiceQ.data ? (
            <Skeleton className="h-32" />
          ) : (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                  <div className="mb-3 text-[11px] font-semibold tracking-widest text-gray-500 dark:text-gray-400">
                    TANTANGAN TERBESAR (Q13)
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {voiceQ.data.challenges.map((c) => (
                      <VoiceChip key={c.label} label={c.label} count={c.count} />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-3 text-[11px] font-semibold tracking-widest text-gray-500 dark:text-gray-400">
                    EKSPEKTASI PELATIHAN (Q14)
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {voiceQ.data.expectations.map((e) => (
                      <VoiceChip
                        key={e.label}
                        label={e.label}
                        count={e.count}
                        tone="green"
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-dashboard-border pt-3 text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Motivasi tinggi (siap mencoba):{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {voiceQ.data.motivated_percent}%
                  </span>
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  Sikap mendukung dengan panduan jelas:{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {voiceQ.data.supportive_percent}%
                  </span>
                </span>
              </div>
            </div>
          )}
        </Section>
      </div>
    </PageContainerAILN>
  );
}

// ---------- Department filter ----------

function DepartmentFilter({
  departments,
  totalMembers,
  groupId,
  onChange,
}: {
  departments: { id: number; name: string; member_count: number }[];
  totalMembers: number;
  groupId: number | undefined;
  onChange: (id: number | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = groupId
    ? departments.find((d) => d.id === groupId)
    : null;
  const label = selected
    ? selected.name
    : `Semua (${departments.length})`;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-dashboard-border bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:bg-card-bg dark:text-gray-200 dark:hover:bg-card-inside-bg"
      >
        <Building2 className="size-4 text-gray-400" />
        Departemen: {label}
        <ChevronDown className="size-4 text-gray-400" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute left-0 z-20 mt-1 max-h-72 w-64 overflow-auto rounded-md border border-dashboard-border bg-white py-1 shadow-lg dark:bg-card-bg">
            <DeptItem
              active={!groupId}
              onClick={() => {
                onChange(undefined);
                setOpen(false);
              }}
            >
              Semua departemen ({totalMembers})
            </DeptItem>
            {departments.map((d) => (
              <DeptItem
                key={d.id}
                active={groupId === d.id}
                onClick={() => {
                  onChange(d.id);
                  setOpen(false);
                }}
              >
                {d.name} ({d.member_count})
              </DeptItem>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DeptItem({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-card-inside-bg ${
        active
          ? "font-semibold text-gray-900 dark:text-white"
          : "text-gray-600 dark:text-gray-300"
      }`}
    >
      {children}
    </button>
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
  badgeTone = "neutral",
  note,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeTone?: "neutral" | "warn";
  note?: string;
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
          <span
            className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
              badgeTone === "warn"
                ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300"
                : "border-dashboard-border bg-gray-50 text-gray-500 dark:bg-card-inside-bg dark:text-gray-400"
            }`}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="flex-1">{children}</div>
      {note && (
        <p className="mt-4 border-t border-dashboard-border pt-3 text-xs text-gray-500 dark:text-gray-400">
          {note}
        </p>
      )}
    </div>
  );
}

// ---------- Bar row (Efferd ShareBarList style: label overlaid on a
// length-proportional bar, value pinned right, single color per tone) ----------

const BAR_TONE: Record<"highlight" | "neutral" | "warn", string> = {
  highlight: "#1f5f4e", // brand deep green — routine/positive rows
  neutral: "#64748b", // slate — default
  warn: "#f59e0b", // amber — risk lens
};

function BarRow({
  leading,
  label,
  percent,
  tone = "neutral",
}: {
  leading?: React.ReactNode;
  label: string;
  percent: number;
  tone?: "highlight" | "neutral" | "warn";
}) {
  return (
    <ShareBarListItem
      value={percent}
      title={label}
      style={{ "--share-bar-color": BAR_TONE[tone] } as React.CSSProperties}
    >
      <ShareBarListContent>
        <span className="flex min-w-0 items-center gap-2">
          {leading}
          <ShareBarListLabel className="truncate text-gray-700 dark:text-gray-200">
            {label}
          </ShareBarListLabel>
        </span>
        <ShareBarListValue className="shrink-0 text-gray-900 dark:text-white">
          {percent}%
        </ShareBarListValue>
      </ShareBarListContent>
      <ShareBarListFill />
    </ShareBarListItem>
  );
}

// ---------- Voice chip ----------

function VoiceChip({
  label,
  count,
  tone = "neutral",
}: {
  label: string;
  count: number;
  tone?: "neutral" | "green";
}) {
  const toneCls =
    tone === "green"
      ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200"
      : "border-dashboard-border bg-gray-50 text-gray-700 dark:bg-card-inside-bg dark:text-gray-300";
  const countCls =
    tone === "green"
      ? "bg-white/70 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
      : "bg-white text-gray-600 dark:bg-card-bg dark:text-gray-300";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${toneCls}`}
    >
      {label}
      <span
        className={`min-w-5 rounded-full px-1.5 text-center text-xs font-semibold tabular-nums ${countCls}`}
      >
        {count}
      </span>
    </span>
  );
}

// ---------- Radar ----------

function PillarRadar({
  labels,
  values,
}: {
  labels: string[];
  values: number[];
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const { data, options } = useMemo(() => {
    const gridColor = isDark
      ? "rgba(148, 163, 184, 0.18)"
      : "rgba(148, 163, 184, 0.28)";
    const angleColor = isDark
      ? "rgba(148, 163, 184, 0.16)"
      : "rgba(148, 163, 184, 0.22)";
    const labelColor = isDark
      ? "rgba(226, 232, 240, 0.85)"
      : "rgba(71, 85, 105, 0.95)";
    const valueColor = isDark
      ? "rgba(148, 163, 184, 0.75)"
      : "rgba(100, 116, 139, 0.9)";

    return {
      data: {
        labels,
        datasets: [
          {
            label: "Kesiapan",
            data: values,
            backgroundColor: "rgba(15, 122, 82, 0.14)",
            borderColor: "rgba(17, 24, 39, 0.85)",
            borderWidth: 2,
            pointBackgroundColor: "rgba(17, 24, 39, 1)",
            pointBorderColor: isDark ? "#0F172A" : "#FFFFFF",
            pointBorderWidth: 2,
            pointRadius: 3.5,
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
                ` ${formatScore(ctx.parsed.r)} / 5`,
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
              color: valueColor,
              backdropColor: "transparent",
              font: { size: 10 },
            },
            pointLabels: {
              color: labelColor,
              font: { size: 12, weight: 500 as const },
              callback: (label: string, index: number) => [
                label,
                formatScore(values[index] ?? 0),
              ],
            },
          },
        },
      } as const,
    };
  }, [labels, values, isDark]);

  return (
    <div className="h-[300px] w-full">
      <Radar data={data} options={options} />
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

function SkeletonRows() {
  return (
    <div className="flex flex-col gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

function EmptyHint() {
  return (
    <div className="flex h-24 items-center justify-center text-sm text-gray-400 dark:text-gray-500">
      Belum ada data responden.
    </div>
  );
}
