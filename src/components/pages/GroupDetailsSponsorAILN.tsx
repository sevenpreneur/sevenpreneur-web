"use client";

import { AILENE_ORG_NAME, AILENE_PROGRAM_NAME } from "@/lib/ailene-config";
import {
  usePdfReport,
  type ReportProps,
} from "@/components/reports/AileneReportPDF";
import dayjs from "dayjs";
import ButtonAILN from "@/components/buttons/ButtonAILN";
import PageContainerAILN from "@/components/pages/PageContainerAILN";
import AppErrorComponents from "@/components/states/AppErrorComponents";
import { setSessionToken, trpc } from "@/trpc/client";
import {
  ChevronDown,
  Download,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const LEVEL_COLORS = ["#e7f4ef", "#b9ddcf", "#73b99e", "#29916f", "#006b50"];

export default function GroupDetailsSponsorAILN({
  sessionToken,
  groupId,
}: {
  sessionToken: string;
  groupId: number;
}) {
  useEffect(() => {
    setSessionToken(sessionToken);
  }, [sessionToken]);

  const router = useRouter();
  const pdf = usePdfReport();
  const input = { group_id: groupId };
  const departmentsQ = trpc.ailene.read.group.departments.useQuery();
  const overviewQ = trpc.ailene.read.group.overview.useQuery(input);
  const distributionQ = trpc.ailene.read.group.levelDistribution.useQuery(input);
  const topUseCasesQ = trpc.ailene.read.group.topUseCases.useQuery(input);
  const attentionQ = trpc.ailene.read.group.attentionMembers.useQuery(input);

  if (overviewQ.isLoading) {
    return (
      <PageContainerAILN>
        <GroupDetailSkeleton />
      </PageContainerAILN>
    );
  }

  if (overviewQ.error || !overviewQ.data) {
    return (
      <PageContainerAILN>
        <AppErrorComponents />
      </PageContainerAILN>
    );
  }

  const group = overviewQ.data.group;
  const metrics = overviewQ.data.metrics;
  const selectedDepartment = departmentsQ.data?.departments.find(
    (department) => department.id === groupId
  );

  const buildReport = (): ReportProps => {
    const sections: ReportProps["sections"] = [
      {
        type: "kpi",
        title: "Indikator Departemen",
        items: [
          {
            label: "Partisipasi Mingguan",
            value: `${metrics.active_members}`,
            unit: `/ ${metrics.total_members}`,
            footer: `${metrics.active_percent}% aktif minggu ini`,
          },
          {
            label: "Avg Level",
            value: formatScore(metrics.avg_level),
            unit: "/ 4",
            footer: `${metrics.beginner_count} org di L0–L1`,
          },
          {
            label: "Jam Dihemat",
            value: formatNumber(metrics.hours_saved_total),
            unit: "jam",
            footer: "kumulatif",
          },
          {
            label: "Use Case Diterima",
            value: `${metrics.accepted_use_cases}`,
            footer: `+${metrics.accepted_use_cases_this_month} bulan ini`,
          },
        ],
      },
    ];
    const levels = distributionQ.data?.levels ?? [];
    if (levels.length > 0) {
      sections.push({
        type: "table",
        title: "Distribusi Level",
        columns: ["Level", "Karyawan", "%"],
        align: ["left", "right", "right"],
        rows: levels.map((l) => [
          `${l.code} · ${l.name}`,
          formatNumber(l.count),
          `${l.percent}%`,
        ]),
      });
    }
    const useCases = topUseCasesQ.data?.use_cases ?? [];
    if (useCases.length > 0) {
      sections.push({
        type: "table",
        title: "Top Use Case",
        columns: ["Use case", "Level", "Submit", "%"],
        align: ["left", "left", "right", "right"],
        rows: useCases.map((u) => [
          u.name,
          u.level_name,
          formatNumber(u.count),
          `${u.percent}%`,
        ]),
      });
    }
    const members = attentionQ.data?.members ?? [];
    if (members.length > 0) {
      sections.push({
        type: "table",
        title: "Karyawan Perlu Perhatian",
        columns: ["Karyawan", "Jabatan", "Level", "Status", "UC"],
        align: ["left", "left", "right", "left", "right"],
        rows: members.map((m) => [
          m.full_name,
          m.job_title,
          `L${m.level_number}`,
          m.status,
          formatNumber(m.accepted_use_cases),
        ]),
      });
    }
    return {
      org: AILENE_ORG_NAME || undefined,
      program: AILENE_PROGRAM_NAME,
      title: `Departemen ${group.name}`,
      subtitle: `${metrics.total_members} karyawan · Champion ${group.champion.full_name} · ${metrics.beginner_percent}% pemula`,
      generatedAt: dayjs().format("D MMMM YYYY"),
      sections,
    };
  };

  return (
    <PageContainerAILN>
      <div className="flex w-full flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Sponsor - Departemen
              </span>
              {metrics.needs_intervention && (
                <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
                  Perlu intervensi
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold leading-tight text-gray-900 dark:text-white">
                {group.name}
              </h1>
              <label className="relative inline-flex items-center">
                <select
                  value={selectedDepartment?.id ?? groupId}
                  onChange={(event) =>
                    router.push(`/sponsor/groups/${event.target.value}`)
                  }
                  className="h-9 appearance-none rounded-md border border-dashboard-border bg-white pl-3 pr-8 text-xs font-medium text-gray-700 outline-none transition hover:bg-gray-50 dark:bg-card-bg dark:text-gray-200 dark:hover:bg-card-inside-bg"
                >
                  {(departmentsQ.data?.departments ?? [
                    {
                      id: group.id,
                      name: group.name,
                      member_count: metrics.total_members,
                    },
                  ]).map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 size-4 text-gray-400" />
              </label>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {metrics.total_members} karyawan - Champion{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {group.champion.full_name}
              </span>{" "}
              - {metrics.beginner_percent}% masih di level pemula.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ButtonAILN
              variant="light"
              size="medium"
              onClick={() =>
                pdf.generate(buildReport(), `departemen-${group.name}.pdf`)
              }
              disabled={pdf.exporting}
            >
              <Download className="size-4" />
              {pdf.exporting ? "Menyiapkan…" : "Export"}
            </ButtonAILN>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ScoreTile
            label="Anggota aktif"
            value={`${metrics.active_members}`}
            unit={`/ ${metrics.total_members}`}
            sub={`${metrics.active_percent}% partisipasi mingguan`}
            percent={metrics.active_percent}
          />
          <ScoreTile
            label="Avg level"
            value={formatScore(metrics.avg_level)}
            unit="dari 4"
            sub={`${metrics.beginner_count} org L0-L1 atau bawah`}
            percent={(metrics.avg_level / 4) * 100}
          />
          <ScoreTile
            label="Jam dihemat"
            value={formatNumber(metrics.hours_saved_total)}
            unit="jam"
            sub="Estimasi dari use case diterima"
            percent={Math.min(100, metrics.hours_saved_total / 5)}
          />
          <ScoreTile
            label="Use case diterima"
            value={`${metrics.accepted_use_cases}`}
            unit="total"
            sub={`+${metrics.accepted_use_cases_this_month} bulan ini`}
            percent={Math.min(100, metrics.accepted_use_cases * 4)}
          />
        </div>

        <Section
          title={`Distribusi level - ${group.name}`}
          subtitle={`${distributionQ.data?.total_members ?? metrics.total_members} karyawan`}
        >
          {distributionQ.isLoading || !distributionQ.data ? (
            <Skeleton className="h-24" />
          ) : (
            <LevelDistribution levels={distributionQ.data.levels} />
          )}
        </Section>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
          <Section title={`Top use case - ${group.name}`}>
            {topUseCasesQ.isLoading || !topUseCasesQ.data ? (
              <SkeletonRows />
            ) : topUseCasesQ.data.use_cases.length === 0 ? (
              <EmptyState text="Belum ada use case diterima di departemen ini." />
            ) : (
              <div className="flex flex-col gap-3">
                {topUseCasesQ.data.use_cases.map((useCase, index) => (
                  <UseCaseRow
                    key={useCase.id}
                    rank={index + 1}
                    name={useCase.name}
                    level={useCase.level_name}
                    count={useCase.count}
                    percent={useCase.percent}
                  />
                ))}
              </div>
            )}
          </Section>

          <Section
            title="Anggota"
            badge={
              attentionQ.data
                ? `${attentionQ.data.lagging_count} ketinggalan`
                : "..."
            }
            badgeTone="warn"
          >
            {attentionQ.isLoading || !attentionQ.data ? (
              <SkeletonRows />
            ) : attentionQ.data.members.length === 0 ? (
              <EmptyState text="Belum ada anggota di departemen ini." />
            ) : (
              <div className="-mx-5 -mb-5 flex flex-col">
                {attentionQ.data.members.map((member) => (
                  <AttentionMemberRow key={member.id} member={member} />
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </PageContainerAILN>
  );
}

function ScoreTile({
  label,
  value,
  unit,
  sub,
  percent,
}: {
  label: string;
  value: string;
  unit: string;
  sub: string;
  percent: number;
}) {
  return (
    <div className="rounded-lg border border-dashboard-border bg-white p-5 shadow-sm dark:bg-card-bg dark:shadow-[0_0_16px_rgba(0,53,157,0.06)]">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
        {label}
      </div>
      <div className="mt-3 flex items-end gap-2">
        <span className="font-geist-mono text-4xl font-bold leading-none text-gray-900 dark:text-white">
          {value}
        </span>
        <span className="pb-1 text-sm font-semibold text-gray-500 dark:text-gray-400">
          {unit}
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-dashboard-border">
        <div
          className="h-full rounded-full bg-gray-900 dark:bg-gray-100"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{sub}</p>
    </div>
  );
}

function Section({
  title,
  subtitle,
  badge,
  badgeTone = "neutral",
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeTone?: "neutral" | "warn";
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-dashboard-border bg-white p-5 shadow-sm dark:bg-card-bg dark:shadow-[0_0_16px_rgba(0,53,157,0.06)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
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
      {children}
    </section>
  );
}

function LevelDistribution({
  levels,
}: {
  levels: {
    id: number;
    code: string;
    name: string;
    count: number;
    percent: number;
  }[];
}) {
  const total = levels.reduce((sum, level) => sum + level.count, 0);
  const maxCount = Math.max(...levels.map((level) => level.count), 1);
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.45fr)]">
      <div className="flex flex-col gap-4">
        <div className="flex h-5 overflow-hidden rounded-sm bg-gray-100 dark:bg-dashboard-border">
          {levels.map((level, index) => (
            <div
              key={level.id}
              className="h-full border-r border-white/50 last:border-r-0 dark:border-black/20"
              style={{
                width:
                  total === 0
                    ? `${100 / Math.max(levels.length, 1)}%`
                    : `${Math.max(level.percent, level.count > 0 ? 4 : 1)}%`,
                backgroundColor:
                  LEVEL_COLORS[index] ?? LEVEL_COLORS[LEVEL_COLORS.length - 1],
              }}
              title={`${level.code}: ${level.count} anggota (${level.percent}%)`}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {levels.map((level, index) => (
            <div key={level.id} className="flex items-start gap-2">
              <span
                className="mt-1 inline-block size-2.5 shrink-0 rounded-sm"
                style={{
                  backgroundColor:
                    LEVEL_COLORS[index] ??
                    LEVEL_COLORS[LEVEL_COLORS.length - 1],
                }}
              />
              <div className="min-w-0">
                <div className="text-sm font-bold text-gray-900 dark:text-white">
                  {level.code} {level.count}
                </div>
                <div className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                  {level.name} - {level.percent}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {levels.map((level, index) => (
          <div
            key={level.id}
            className="grid grid-cols-[3rem_1fr_3rem] items-center gap-2 text-xs"
          >
            <span className="font-bold text-gray-700 dark:text-gray-200">
              {level.code}
            </span>
            <div className="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-dashboard-border">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max((level.count / maxCount) * 100, level.count > 0 ? 6 : 1)}%`,
                  backgroundColor:
                    LEVEL_COLORS[index] ??
                    LEVEL_COLORS[LEVEL_COLORS.length - 1],
                }}
              />
            </div>
            <span className="text-right font-semibold text-gray-900 dark:text-white">
              {level.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function UseCaseRow({
  rank,
  name,
  level,
  count,
  percent,
}: {
  rank: number;
  name: string;
  level: string;
  count: number;
  percent: number;
}) {
  return (
    <div className="grid grid-cols-[2rem_minmax(8rem,12rem)_1fr_3rem] items-center gap-3">
      <span className="font-geist-mono text-xs text-gray-400">#{rank}</span>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">
          {name}
        </div>
        <div className="truncate text-[11px] text-gray-500 dark:text-gray-400">
          {level}
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-dashboard-border">
        <div
          className="h-full rounded-full bg-gray-900 dark:bg-gray-100"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
      <span className="text-right text-xs font-bold text-gray-900 dark:text-white">
        {count}x
      </span>
    </div>
  );
}

function AttentionMemberRow({
  member,
}: {
  member: {
    full_name: string;
    avatar: string | null;
    job_title: string;
    level_number: number;
    status: string;
    needs_attention: boolean;
    accepted_use_cases: number;
  };
}) {
  const lagging = member.needs_attention;
  return (
    <div
      className={`grid grid-cols-[minmax(0,1fr)_3rem_4rem_5rem] items-center gap-3 border-t border-dashboard-border px-5 py-3 ${
        lagging
          ? "border-l-4 border-l-amber-400 bg-amber-50/70 dark:bg-amber-500/10"
          : "bg-white dark:bg-card-bg"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={member.full_name} src={member.avatar} />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">
            {member.full_name}
          </div>
          <div className="truncate text-xs text-gray-500 dark:text-gray-400">
            {member.job_title}
          </div>
        </div>
      </div>
      <span className="text-center font-geist-mono text-sm font-bold text-gray-900 dark:text-white">
        L{member.level_number}
      </span>
      <span className="text-center text-[11px] font-medium text-gray-500 dark:text-gray-400">
        {member.accepted_use_cases} uc
      </span>
      <span
        className={`text-right text-[11px] font-medium ${
          lagging
            ? "text-amber-700 dark:text-amber-300"
            : "text-gray-500 dark:text-gray-400"
        }`}
      >
        {member.status}
      </span>
    </div>
  );
}

function Avatar({ name, src }: { name: string; src: string | null }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className="size-9 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-dashboard-border bg-blue-50 text-xs font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
      {initials || <Users className="size-4" />}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-md bg-gray-50 px-4 py-8 text-center text-sm text-gray-500 dark:bg-card-inside-bg dark:text-gray-400">
      {text}
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-100 dark:bg-dashboard-border ${className ?? ""}`}
    />
  );
}

function SkeletonRows() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-10" />
      ))}
    </div>
  );
}

function GroupDetailSkeleton() {
  return (
    <div className="flex w-full animate-pulse flex-col gap-5">
      <div className="h-20 rounded-lg bg-gray-100 dark:bg-dashboard-border" />
      <div className="grid grid-cols-2 gap-0 overflow-hidden rounded-lg border border-dashboard-border xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-36 border-r border-dashboard-border bg-gray-100 last:border-r-0 dark:bg-dashboard-border"
          />
        ))}
      </div>
      <div className="h-32 rounded-lg bg-gray-100 dark:bg-dashboard-border" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="h-72 rounded-lg bg-gray-100 dark:bg-dashboard-border" />
        <div className="h-72 rounded-lg bg-gray-100 dark:bg-dashboard-border" />
      </div>
    </div>
  );
}

function formatScore(n: number) {
  return n.toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function formatNumber(n: number) {
  return n.toLocaleString("id-ID", {
    maximumFractionDigits: 1,
  });
}
