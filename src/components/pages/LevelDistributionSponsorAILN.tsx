"use client";
import ButtonAILN from "@/components/buttons/ButtonAILN";
import PageContainerAILN from "@/components/pages/PageContainerAILN";
import AppErrorComponents from "@/components/states/AppErrorComponents";
import { setSessionToken, trpc } from "@/trpc/client";
import { Building2, Download, Search } from "lucide-react";
import { useEffect } from "react";

const SPONSOR_BLUE = "#00359D";
const SPONSOR_BLUE_DARK = "#001f5d";
const LEVEL_COLORS = ["#eef2fb", "#cbd7f0", "#8ea6d8", "#3f67b5", "#00359D"];

export default function LevelDistributionSponsorAILN({
  sessionToken,
}: {
  sessionToken: string;
}) {
  useEffect(() => {
    setSessionToken(sessionToken);
  }, [sessionToken]);

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
  const maxTotal = Math.max(...data.groups.map((group) => group.total), 1);
  const inactive = Math.max(data.total - data.active_weekly, 0);

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
            <ButtonAILN variant="light" size="medium">
              <Download className="size-4" />
              Export PDF
            </ButtonAILN>
            <ButtonAILN variant="primary" size="medium">
              <Building2 className="size-4" />
              Drill ke departemen
            </ButtonAILN>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashboard-border bg-white px-4 py-3 shadow-sm dark:bg-card-bg">
          <div className="flex flex-wrap items-center gap-2">
            <FilterPill label="Departemen" value="Semua" />
            <FilterPill label="Periode" value="Bulan ini" />
            <label className="flex items-center gap-2 rounded-md border border-dashboard-border bg-white px-3 py-2 text-xs font-medium text-gray-600 dark:bg-card-inside-bg dark:text-gray-300">
              <input
                type="checkbox"
                className="size-3.5 rounded border-gray-300 accent-[#00359D]"
              />
              Highlight underperform
            </label>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Search className="size-3.5" />
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
                {data.groups.length} departemen · sort by total karyawan
              </p>
            </div>
            <LevelLegend levels={data.levels} />
          </div>

          <div className="mt-5 flex flex-col gap-3">
            {data.groups.map((group) => (
              <DepartmentDistributionRow
                key={group.id}
                group={group}
                maxTotal={maxTotal}
              />
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section className="rounded-lg border border-dashboard-border bg-white p-5 shadow-sm dark:bg-card-bg">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              Tingkat Partisipasi
            </div>
            <div className="mt-3 flex items-end gap-1">
              <span className="font-geist-mono text-4xl font-bold leading-none text-gray-900 dark:text-white">
                {data.participation_percent}
              </span>
              <span className="pb-1 text-sm font-semibold text-gray-500 dark:text-gray-400">
                %
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {data.active_weekly} dari {data.total} karyawan login minimal 1x
              minggu ini.
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-dashboard-border">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${data.participation_percent}%`,
                  backgroundColor: SPONSOR_BLUE,
                }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-gray-400 dark:text-gray-500">
              <span>0%</span>
              <span>{inactive} belum aktif minggu ini</span>
              <span>100%</span>
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
                  <div
                    key={group.id}
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
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </PageContainerAILN>
  );
}

function FilterPill({ label, value }: { label: string; value: string }) {
  return (
    <button className="rounded-md border border-dashboard-border bg-white px-3 py-2 text-xs font-semibold text-gray-700 dark:bg-card-inside-bg dark:text-gray-200">
      {label}: <span className="font-medium">{value}</span>
    </button>
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
  maxTotal,
}: {
  group: {
    name: string;
    total: number;
    levels: {
      level_id: number;
      code: string;
      label?: string;
      count: number;
    }[];
  };
  maxTotal: number;
}) {
  return (
    <div className="grid grid-cols-[minmax(7rem,10rem)_minmax(0,1fr)_3.5rem] items-center gap-3 text-sm">
      <div className="truncate font-medium text-gray-700 dark:text-gray-200">
        {group.name}
      </div>
      <div className="h-7">
        <div
          className="grid h-full min-w-80 overflow-hidden rounded-sm bg-gray-100 dark:bg-dashboard-border"
          style={{
            width: `${Math.max((group.total / maxTotal) * 100, 45)}%`,
            gridTemplateColumns: `repeat(${group.levels.length}, minmax(0, 1fr))`,
          }}
        >
          {group.levels.map((level, index) => (
            <div
              key={level.level_id}
              className="flex items-center justify-center border-r border-white/50 px-2 text-[11px] font-bold last:border-r-0 dark:border-black/20"
              style={{
                backgroundColor: getColor(index),
                color: index >= 3 ? "white" : undefined,
              }}
            >
              <span className="truncate">
                {level.label ?? level.code} ({level.count} orang)
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="text-right font-geist-mono text-xs font-semibold text-gray-700 dark:text-gray-200">
        {group.total} org
      </div>
    </div>
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
