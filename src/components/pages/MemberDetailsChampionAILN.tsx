"use client";

import ButtonAILN from "@/components/buttons/ButtonAILN";
import PageContainerAILN from "@/components/pages/PageContainerAILN";
import AppErrorComponents from "@/components/states/AppErrorComponents";
import AppPageState from "@/components/states/AppPageState";
import { setSessionToken, trpc } from "@/trpc/client";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  ArrowUp,
  Check,
  CheckCircle2,
  ClipboardList,
  FileText,
  Send,
  StickyNote,
  Upload,
} from "lucide-react";
import { useEffect } from "react";

dayjs.extend(relativeTime);

const ACCENT = "#107158";

export default function MemberDetailsChampionAILN({
  sessionToken,
  memberId,
}: {
  sessionToken: string;
  memberId: number;
}) {
  useEffect(() => {
    setSessionToken(sessionToken);
  }, [sessionToken]);

  const detailQ = trpc.ailene.read.memberDetail.useQuery({
    member_id: memberId,
  });

  if (detailQ.isLoading) {
    return (
      <PageContainerAILN>
        <MemberDetailsSkeleton />
      </PageContainerAILN>
    );
  }

  if (detailQ.error) {
    if (detailQ.error.data?.code === "FORBIDDEN") {
      return <AppPageState variant="FORBIDDEN" />;
    }

    return (
      <PageContainerAILN>
        <AppErrorComponents />
      </PageContainerAILN>
    );
  }

  if (!detailQ.data) {
    return (
      <PageContainerAILN>
        <AppErrorComponents />
      </PageContainerAILN>
    );
  }

  const { member, metrics, radar, gate, activities } = detailQ.data;
  const lastActiveLabel = member.last_active_at
    ? `aktif ${dayjs(member.last_active_at).fromNow()}`
    : "belum pernah aktif";
  const joinedLabel = dayjs(member.joined_at).format("DD MMM YYYY");

  return (
    <PageContainerAILN>
      <div className="flex w-full flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar name={member.full_name} src={member.avatar} size="large" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-bold text-gray-900 dark:text-white">
                  {member.full_name}
                </h1>
                <span className="text-sm font-bold" style={{ color: ACCENT }}>
                  L{member.current_level.level_number} {member.current_level.name}
                </span>
                <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300">
                  On track
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {member.job_title}
                {member.group ? ` - ${member.group.name}` : ""} - bergabung{" "}
                {joinedLabel} - {lastActiveLabel}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ButtonAILN variant="light" size="medium">
              <StickyNote className="size-4" />
              Kirim catatan
            </ButtonAILN>
            <ButtonAILN
              variant="secondary"
              size="medium"
              disabled={!gate.ready || !gate.next_level_id}
            >
              <ArrowUp className="size-4" />
              Promote ke L{gate.to_level}
            </ButtonAILN>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label={`Gate L${gate.from_level} -> L${gate.to_level}`}
            value={`${metrics.gate_percent}`}
            unit="%"
            sub={gate.ready ? "siap naik level" : "belum siap naik level"}
          />
          <MetricCard
            label="Streak"
            value={`${metrics.streak_days}`}
            unit="hari"
            sub="aktivitas belajar beruntun"
          />
          <MetricCard
            label="Submission"
            value={`${metrics.submission_total}`}
            unit="total"
            sub="prompt + use case tersubmit"
          />
          <MetricCard
            label="Avg quiz"
            value={`${metrics.avg_quiz}`}
            unit="/100"
            sub="rata-rata skor terbaik"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <Section
            title="Pillar radar"
            subtitle={`Berdasarkan ${radar.total_submissions} submission - skala 0-5`}
          >
            <div className="flex flex-col gap-5">
              <RadarChart dimensions={radar.dimensions} />
              <div className="grid grid-cols-2 gap-x-7 gap-y-2">
                {radar.dimensions.map((dimension) => (
                  <div
                    key={dimension.key}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-gray-500 dark:text-gray-400">
                      {dimension.label}
                    </span>
                    <span className="font-geist-mono font-bold text-gray-900 dark:text-white">
                      {formatDecimal(dimension.score)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Riwayat submission & review" action="Semua aktivitas ->">
            <div className="-mx-5 -mb-5 flex flex-col">
              {activities.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  Belum ada submission atau aktivitas quiz.
                </div>
              ) : (
                activities.map((activity) => (
                  <ActivityRow key={activity.id} activity={activity} />
                ))
              )}

              <div className="flex gap-2 border-t border-dashboard-border bg-gray-50 px-5 py-3 dark:bg-card-inside-bg">
                <input
                  placeholder={`Tulis catatan coaching untuk ${member.full_name.split(" ")[0]}...`}
                  className="h-9 min-w-0 flex-1 rounded-md border border-dashboard-border bg-white px-3 text-sm outline-none focus:border-emerald-500 dark:bg-card-bg dark:text-white"
                />
                <ButtonAILN variant="primary" size="medium">
                  <Send className="size-4" />
                  Kirim
                </ButtonAILN>
              </div>
            </div>
          </Section>
        </div>

        <Section title={`Gate L${gate.from_level} -> L${gate.to_level}`}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-dashboard-border">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${gate.percent}%`, backgroundColor: ACCENT }}
                />
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                {gate.percent}% {gate.ready ? "siap" : "progress"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {gate.requirements.map((requirement) => (
                <div
                  key={requirement.label}
                  className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                      requirement.completed
                        ? "border-emerald-500 bg-emerald-600 text-white"
                        : "border-gray-300 bg-white text-gray-300 dark:bg-card-bg"
                    }`}
                  >
                    {requirement.completed && <Check className="size-3" />}
                  </span>
                  {requirement.label}
                </div>
              ))}
            </div>
          </div>
        </Section>
      </div>
    </PageContainerAILN>
  );
}

function MetricCard({
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
    <div className="rounded-lg border border-dashboard-border bg-white p-5 shadow-sm dark:bg-card-bg dark:shadow-[0_0_16px_rgba(16,113,88,0.08)]">
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

function Section({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-dashboard-border bg-white p-5 shadow-sm dark:bg-card-bg dark:shadow-[0_0_16px_rgba(16,113,88,0.08)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            {action}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function RadarChart({
  dimensions,
}: {
  dimensions: { key: string; label: string; score: number }[];
}) {
  const center = 90;
  const radius = 70;
  const points = dimensions.map((dimension, index) => {
    const angle = -Math.PI / 2 + (index / dimensions.length) * Math.PI * 2;
    const valueRadius = (dimension.score / 5) * radius;
    return {
      axis: `${center + Math.cos(angle) * radius},${center + Math.sin(angle) * radius}`,
      value: `${center + Math.cos(angle) * valueRadius},${center + Math.sin(angle) * valueRadius}`,
    };
  });
  const rings = [0.25, 0.5, 0.75, 1].map((scale) =>
    dimensions
      .map((_, index) => {
        const angle = -Math.PI / 2 + (index / dimensions.length) * Math.PI * 2;
        return `${center + Math.cos(angle) * radius * scale},${center + Math.sin(angle) * radius * scale}`;
      })
      .join(" ")
  );

  return (
    <div className="flex justify-center">
      <svg viewBox="0 0 180 180" className="h-64 w-64">
        {rings.map((ring) => (
          <polygon
            key={ring}
            points={ring}
            fill="none"
            stroke="rgba(148,163,184,0.25)"
            strokeWidth="1"
          />
        ))}
        {points.map((point) => (
          <line
            key={point.axis}
            x1={center}
            y1={center}
            x2={point.axis.split(",")[0]}
            y2={point.axis.split(",")[1]}
            stroke="rgba(148,163,184,0.18)"
            strokeWidth="1"
          />
        ))}
        <polygon
          points={points.map((point) => point.value).join(" ")}
          fill="rgba(16,113,88,0.16)"
          stroke={ACCENT}
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}

function ActivityRow({
  activity,
}: {
  activity: {
    type: "use_case" | "prompt" | "quiz";
    title: string;
    subtitle: string;
    status: string;
    occurred_at: string | Date;
  };
}) {
  const accepted = activity.status === "accepted";
  const submitted = activity.status === "submitted";
  const Icon =
    activity.type === "quiz"
      ? ClipboardList
      : activity.type === "prompt"
        ? FileText
        : CheckCircle2;

  return (
    <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_5rem] items-start gap-3 border-t border-dashboard-border px-5 py-4">
      <div
        className={`flex size-8 items-center justify-center rounded-md border ${
          accepted
            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
            : submitted
              ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
              : "border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-card-inside-bg dark:text-gray-300"
        }`}
      >
        {submitted && !accepted ? <Upload className="size-4" /> : <Icon className="size-4" />}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">
          {activity.title}
        </div>
        <div className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
          {activity.subtitle}
        </div>
      </div>
      <span className="text-right text-xs text-gray-400 dark:text-gray-500">
        {dayjs(activity.occurred_at).fromNow()}
      </span>
    </div>
  );
}

function Avatar({
  name,
  src,
  size = "default",
}: {
  name: string;
  src: string | null;
  size?: "default" | "large";
}) {
  const className =
    size === "large"
      ? "size-16 text-xl"
      : "size-9 text-xs";
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={name} className={`${className} rounded-full object-cover`} />
    );
  }

  return (
    <div
      className={`${className} flex shrink-0 items-center justify-center rounded-full border border-orange-200 bg-orange-50 font-bold text-orange-800 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-200`}
    >
      {getInitials(name)}
    </div>
  );
}

function MemberDetailsSkeleton() {
  return (
    <div className="flex w-full animate-pulse flex-col gap-5">
      <div className="h-20 rounded-lg bg-gray-100 dark:bg-dashboard-border" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 rounded-lg bg-gray-100 dark:bg-dashboard-border"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="h-96 rounded-lg bg-gray-100 dark:bg-dashboard-border" />
        <div className="h-96 rounded-lg bg-gray-100 dark:bg-dashboard-border" />
      </div>
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDecimal(n: number) {
  return n.toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
