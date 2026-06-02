"use client";

import ButtonAILN from "@/components/buttons/ButtonAILN";
import PageContainerAILN from "@/components/pages/PageContainerAILN";
import AppErrorComponents from "@/components/states/AppErrorComponents";
import { setSessionToken, trpc } from "@/trpc/client";
import type { AppRouter } from "@/trpc/routers/_app";
import type { inferRouterOutputs } from "@trpc/server";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { Download } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const ACCENT = "#107158";
type ChampionReportData =
  inferRouterOutputs<AppRouter>["ailene"]["read"]["report"]["champion"];

export default function ReportChampionAILN({
  sessionToken,
}: {
  sessionToken: string;
}) {
  useEffect(() => {
    setSessionToken(sessionToken);
  }, [sessionToken]);

  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const reportQ = trpc.ailene.read.report.champion.useQuery({ period });

  if (reportQ.isLoading) {
    return (
      <PageContainerAILN>
        <ReportSkeleton />
      </PageContainerAILN>
    );
  }

  if (reportQ.error || !reportQ.data) {
    return (
      <PageContainerAILN>
        <AppErrorComponents />
      </PageContainerAILN>
    );
  }

  return (
    <ReportContent
      key={`${period}-${reportQ.data.generated_at}`}
      data={reportQ.data}
      period={period}
      onPeriodChange={setPeriod}
    />
  );
}

function ReportContent({
  data,
  period,
  onPeriodChange,
}: {
  data: ChampionReportData;
  period: "weekly" | "monthly";
  onPeriodChange: (period: "weekly" | "monthly") => void;
}) {
  const [narrative, setNarrative] = useState(data.narrative);
  const maxMovement = Math.max(
    ...data.level_movements.map((movement) => movement.count),
    1
  );

  const generatedLabel = useMemo(
    () => dayjs(data.generated_at).locale("id").format("D MMMM YYYY, HH:mm"),
    [data.generated_at]
  );

  const handleDownload = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 18;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(data.report.title, 16, y);

    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(90);
    doc.text(`Tim ${data.report.team_name} - Champion ${data.report.champion_name}`, 16, y);
    y += 6;
    doc.text(`Generated: ${generatedLabel}`, 16, y);

    y += 12;
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("Ringkasan KPI", 16, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.text(`Anggota aktif: ${data.metrics.active_members}/${data.metrics.total_members}`, 16, y);
    doc.text(`Submission diterima: ${data.metrics.accepted_submissions}`, 75, y);
    y += 6;
    doc.text(`Jam dihemat: ${data.metrics.hours_saved}`, 16, y);
    doc.text(`Naik level: ${data.metrics.level_ups}`, 75, y);

    y += 12;
    doc.setFont("helvetica", "bold");
    doc.text("Pergerakan Level", 16, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    data.level_movements.forEach((movement) => {
      doc.text(`${movement.from} -> ${movement.to}: ${movement.count} (${movement.note})`, 16, y);
      y += 6;
    });

    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Narasi Champion", 16, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    const wrapped = doc.splitTextToSize(narrative, pageWidth - 32);
    doc.text(wrapped, 16, y);

    doc.save(`${slugify(data.report.title)}.pdf`);
  };

  return (
    <PageContainerAILN>
      <div className="flex w-full flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              Champion - Pelaporan
            </div>
            <h1 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
              Reports
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Laporan dibuat otomatis dari data tim. Tinjau, sesuaikan narasi,
              lalu unduh PDF untuk Sponsor.
            </p>
          </div>

          <div className="inline-flex h-10 rounded-lg border border-dashboard-border bg-white p-1 dark:bg-card-bg">
            <button
              onClick={() => onPeriodChange("weekly")}
              className={`rounded-md px-4 text-sm font-semibold ${
                period === "weekly"
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              Mingguan
            </button>
            <button
              onClick={() => onPeriodChange("monthly")}
              className={`rounded-md px-4 text-sm font-semibold ${
                period === "monthly"
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              Bulanan
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.42fr)]">
          <section className="rounded-lg border border-dashboard-border bg-white shadow-sm dark:bg-card-bg">
            <div className="border-b border-dashboard-border p-5">
              <div className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                Draft - auto-generated
              </div>
              <h2 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
                {data.report.title}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Tim {data.report.team_name} - Champion {data.report.champion_name}
              </p>
            </div>

            <div className="grid grid-cols-2 border-b border-dashboard-border md:grid-cols-4">
              <KpiTile
                label="Anggota aktif"
                value={`${data.metrics.active_members}`}
                unit={`/ ${data.metrics.total_members}`}
                sub={`${data.metrics.active_percent}% aktif periode ini`}
              />
              <KpiTile
                label="Submission diterima"
                value={`${data.metrics.accepted_submissions}`}
                unit="diterima"
                sub="prompt + use case"
              />
              <KpiTile
                label="Jam dihemat tim"
                value={`${data.metrics.hours_saved}`}
                unit="jam"
                sub="estimasi dari use case"
              />
              <KpiTile
                label="Naik level"
                value={`${data.metrics.level_ups}`}
                unit="orang"
                sub="periode berjalan"
              />
            </div>

            <div className="border-b border-dashboard-border p-5">
              <div className="mb-4 text-base font-bold text-gray-900 dark:text-white">
                Pergerakan level
              </div>
              <div className="flex flex-col gap-3">
                {data.level_movements.map((movement) => (
                  <div
                    key={`${movement.from}-${movement.to}`}
                    className="grid grid-cols-[4rem_1fr_2rem_minmax(8rem,0.55fr)] items-center gap-3 text-sm"
                  >
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      {movement.from} -&gt; {movement.to}
                    </span>
                    <div className="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-dashboard-border">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max((movement.count / maxMovement) * 100, movement.count > 0 ? 8 : 1)}%`,
                          backgroundColor: ACCENT,
                        }}
                      />
                    </div>
                    <span className="text-right font-geist-mono font-bold text-gray-900 dark:text-white">
                      {movement.count}
                    </span>
                    <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {movement.note}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="text-base font-bold text-gray-900 dark:text-white">
                  Narasi Champion
                </div>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  Auto-draft - bisa diedit
                </span>
              </div>
              <textarea
                value={narrative}
                onChange={(event) => setNarrative(event.target.value)}
                rows={5}
                className="w-full resize-none rounded-md border border-dashboard-border bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-900 outline-none focus:border-emerald-500 dark:bg-card-inside-bg dark:text-white"
              />
            </div>
          </section>

          <aside className="flex flex-col gap-4">
            <section className="rounded-lg border border-dashboard-border bg-white p-5 shadow-sm dark:bg-card-bg">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Unduh laporan
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Hasilkan ringkasan periode ini sebagai PDF untuk dibagikan
                manual ke sponsor / tim.
              </p>
              <ButtonAILN
                variant="primary"
                size="medium"
                className="mt-4 w-full"
                onClick={handleDownload}
              >
                <Download className="size-4" />
                Unduh PDF
              </ButtonAILN>
            </section>
          </aside>
        </div>
      </div>
    </PageContainerAILN>
  );
}

function KpiTile({
  label,
  value,
  unit,
  sub,
}: {
  label: string;
  value: string;
  unit: string;
  sub: string;
}) {
  return (
    <div className="border-r border-dashboard-border p-5 last:border-r-0">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
        {label}
      </div>
      <div className="mt-3 flex items-end gap-1.5">
        <span className="font-geist-mono text-4xl font-bold leading-none text-gray-900 dark:text-white">
          {value}
        </span>
        <span className="pb-1 text-sm font-semibold text-gray-500 dark:text-gray-400">
          {unit}
        </span>
      </div>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{sub}</p>
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div className="flex w-full animate-pulse flex-col gap-5">
      <div className="h-20 rounded-lg bg-gray-100 dark:bg-dashboard-border" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.42fr)]">
        <div className="h-[560px] rounded-lg bg-gray-100 dark:bg-dashboard-border" />
        <div className="h-[360px] rounded-lg bg-gray-100 dark:bg-dashboard-border" />
      </div>
    </div>
  );
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
