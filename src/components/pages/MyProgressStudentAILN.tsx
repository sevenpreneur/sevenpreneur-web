"use client";
import ButtonAILN from "@/components/buttons/ButtonAILN";
import CompetencyProfileAILN from "@/components/charts/CompetencyProfileAILN";
import LevelProgressCardAILN from "@/components/charts/LevelProgressCardAILN";
import StreakCardAILN from "@/components/charts/StreakCardAILN";
import PageContainerAILN from "@/components/pages/PageContainerAILN";
import AppErrorComponents from "@/components/states/AppErrorComponents";
import { setSessionToken, trpc } from "@/trpc/client";
import { Tooltip as MuiTooltip } from "@mui/material";
import dayjs from "dayjs";
import "dayjs/locale/id";
import {
  ChevronRight,
  Download,
  FileText,
  Flame,
  Lock,
  Share2,
  Sparkles,
  Star,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

dayjs.locale("id");

const DEFAULT_AVATAR =
  "https://tskubmriuclmbcfmaiur.supabase.co/storage/v1/object/public/sevenpreneur//default-avatar.svg.png";

const fmtInt = (n: number) =>
  n.toLocaleString("id-ID", { maximumFractionDigits: 0 });
const fmtHours = (n: number) =>
  n.toLocaleString("id-ID", {
    minimumFractionDigits: n % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });

export default function MyProgressStudentAILN({
  sessionToken,
}: {
  sessionToken: string;
}) {
  useEffect(() => {
    setSessionToken(sessionToken);
  }, [sessionToken]);

  const searchParams = useSearchParams();
  const isOutcome = searchParams.get("outcome") === "true";

  const userQ = trpc.auth.checkSession.useQuery();
  const memberQ = trpc.auth.checkAilMember.useQuery();

  if (userQ.isLoading || memberQ.isLoading) {
    return (
      <PageContainerAILN>
        <ProgressSkeleton />
      </PageContainerAILN>
    );
  }
  if (
    userQ.error ||
    memberQ.error ||
    !userQ.data?.user ||
    !memberQ.data?.ail_member
  ) {
    return (
      <PageContainerAILN>
        <AppErrorComponents />
      </PageContainerAILN>
    );
  }

  const user = userQ.data.user;
  const member = memberQ.data.ail_member;
  const firstName = user.full_name.split(" ")[0] ?? user.full_name;
  const levelNumber = member.current_level?.level_number ?? 0;
  const levelName = member.current_level?.name ?? "—";
  // Rentang streak = sejak member bergabung sampai hari ini (bukan hardcoded).
  const cohortStart = dayjs(member.created_at).format("YYYY-MM-DD");
  const cohortEnd = dayjs().format("YYYY-MM-DD");

  if (isOutcome) {
    return (
      <PageContainerAILN>
        <OutcomeView
          firstName={firstName}
          fullName={user.full_name}
          jobTitle={member.job_title}
          groupName={member.group?.name ?? null}
          levelNumber={levelNumber}
          levelName={levelName}
          totalXp={member.total_xp}
        />
      </PageContainerAILN>
    );
  }

  return (
    <PageContainerAILN>
      <div className="flex w-full flex-col gap-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-red-500 dark:text-red-400">
              Progress Saya
            </div>
            <h1 className="mt-1 text-2xl font-bold leading-tight dark:text-white">
              Perjalanan AI {firstName}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {[user.full_name, member.job_title, member.group?.name]
                .filter(Boolean)
                .join(" · ")}
              {" — "}sekarang di{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                Level {levelNumber} {levelName}
              </span>
              .
            </p>
          </div>
        </div>

        {/* Level journey — full width */}
        <LevelProgressCardAILN />

        {/* Profil Kompetensi 60% sejajar Capaian Kamu / streak 40% (tinggi sama) */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <CompetencyProfileAILN className="h-full" />
          <StreakCardAILN
            startDate={cohortStart}
            endDate={cohortEnd}
            className="h-full"
          />
        </div>

        {/* Leaderboard — full width */}
        <LeaderboardPanel />
      </div>
    </PageContainerAILN>
  );
}

// ===== Achievement stats =====

function StatsPanel({
  totalXp,
  levelNumber,
}: {
  totalXp: number;
  levelNumber: number;
}) {
  const q = trpc.ailene.read.achievements.useQuery();

  if (q.isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-lg border border-dashboard-border bg-gray-100 dark:bg-card-bg"
          />
        ))}
      </div>
    );
  }
  if (q.error || !q.data) {
    return (
      <div className="rounded-lg border border-dashboard-border bg-white p-5 text-sm text-red-500 dark:bg-card-bg dark:text-red-400">
        Gagal memuat capaian.
      </div>
    );
  }

  const a = q.data;

  return (
    <div className="grid grid-cols-2 gap-4">
      <StatCard
        icon={FileText}
        value={fmtInt(a.use_case_count)}
        label="Use Case Dicatat"
        sub={
          a.tools_mastered.length > 0
            ? `${a.tools_mastered.length} tools dikuasai`
            : undefined
        }
      />
      <StatCard
        icon={Sparkles}
        value={fmtInt(a.prompt_count)}
        label="Prompt Dicatat"
      />
      <StatCard
        icon={Timer}
        value={fmtHours(a.hours_saved_total)}
        unit="jam"
        label="Jam Dihemat"
        sub="estimasi dari use case"
        accent
      />
      <StatCard
        icon={Star}
        value={totalXp.toLocaleString("id-ID")}
        unit="XP"
        label="Total XP"
        sub={`Level ${levelNumber}`}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  unit,
  label,
  sub,
  accent,
}: {
  icon: LucideIcon;
  value: string;
  unit?: string;
  label: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashboard-border bg-white p-4 dark:bg-card-bg dark:shadow-[0_0_16px_rgba(239,68,68,0.06)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {label}
        </span>
        <Icon
          className={`size-4 shrink-0 ${
            accent
              ? "text-emerald-500 dark:text-emerald-400"
              : "text-red-500 dark:text-red-400"
          }`}
        />
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={`font-geist-mono text-3xl font-bold leading-none ${
            accent
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-foreground dark:text-white"
          }`}
        >
          {value}
        </span>
        {unit && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {unit}
          </span>
        )}
      </div>
      <span className="min-h-4 text-[11px] text-gray-400 dark:text-gray-500">
        {sub ?? ""}
      </span>
    </div>
  );
}

// ===== Leaderboard (tabbed) =====

type LeaderboardTab = "DEPT" | "ANGKATAN" | "TIM";

function LeaderboardPanel() {
  const [tab, setTab] = useState<LeaderboardTab>("DEPT");
  const q = trpc.ailene.read.groupLeaderboard.useQuery();

  const tabs: { key: LeaderboardTab; label: string; enabled: boolean }[] = [
    { key: "DEPT", label: "Departemen", enabled: true },
    { key: "ANGKATAN", label: "Angkatan", enabled: false },
    { key: "TIM", label: "Tim", enabled: false },
  ];

  return (
    <div className="flex flex-col rounded-lg border border-dashboard-border bg-white p-5 dark:bg-card-bg">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-foreground dark:text-white">
            Leaderboard
          </h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Peringkat kontribusi XP.
          </p>
        </div>
        {tab === "DEPT" && q.data?.group && (
          <div className="flex items-baseline gap-1.5">
            <span className="font-geist-mono text-2xl font-bold leading-none text-gray-900 dark:text-white">
              #{q.data.my_rank}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              dari {q.data.total}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-4 inline-flex w-fit rounded-md border border-dashboard-border p-0.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            disabled={!t.enabled}
            onClick={() => t.enabled && setTab(t.key)}
            className={`flex items-center gap-1 rounded px-3 py-1.5 text-xs font-medium transition ${
              tab === t.key
                ? "bg-black text-white dark:bg-red-500/20 dark:text-red-100"
                : t.enabled
                  ? "text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white"
                  : "cursor-not-allowed text-gray-300 dark:text-gray-600"
            }`}
          >
            {t.label}
            {!t.enabled && <Lock className="size-3" />}
          </button>
        ))}
      </div>

      <div className="mt-4 flex-1">
        {tab !== "DEPT" ? (
          <Placeholder />
        ) : q.isLoading ? (
          <LeaderboardLoading />
        ) : q.error ? (
          <p className="py-8 text-center text-sm text-red-500 dark:text-red-400">
            Gagal memuat leaderboard.
          </p>
        ) : !q.data?.group || q.data.leaderboard.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Kamu belum tergabung dalam group manapun.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {q.data.leaderboard.map((entry) => (
              <div
                key={entry.member_id}
                className={`flex items-center gap-3 rounded-md px-2.5 py-2 ${
                  entry.is_me
                    ? "bg-red-50 font-semibold text-gray-900 dark:bg-red-500/15 dark:text-white dark:shadow-[inset_0_0_0_1px_rgba(239,68,68,0.4)]"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                <span
                  className={`w-5 shrink-0 text-center text-sm font-semibold ${
                    entry.is_me
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {entry.rank}
                </span>
                <Image
                  src={entry.avatar || DEFAULT_AVATAR}
                  alt=""
                  width={32}
                  height={32}
                  className={`size-8 rounded-full object-cover ${
                    entry.is_me ? "dark:ring-1 dark:ring-red-500/50" : ""
                  }`}
                />
                <span className="flex-1 truncate text-sm">
                  {entry.full_name}
                  {entry.is_me && (
                    <span className="ml-1.5 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      ANDA
                    </span>
                  )}
                </span>
                <span className="shrink-0 font-geist-mono text-xs text-gray-500 dark:text-gray-400">
                  {entry.total_xp.toLocaleString("id-ID")} XP
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Placeholder() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-dashboard-border py-12 text-center">
      <Lock className="size-6 text-gray-400 dark:text-gray-500" />
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Segera hadir
      </div>
    </div>
  );
}

function LeaderboardLoading() {
  return (
    <div className="flex flex-col gap-1 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-2.5 py-2">
          <div className="size-4 rounded bg-gray-200 dark:bg-dashboard-border" />
          <div className="size-8 rounded-full bg-gray-200 dark:bg-dashboard-border" />
          <div className="h-3 flex-1 rounded bg-gray-200 dark:bg-dashboard-border" />
        </div>
      ))}
    </div>
  );
}

// ===== Streak panel =====

const WINDOW_OPTIONS = [
  { days: 7, label: "7 hari" },
  { days: 30, label: "30 hari" },
  { days: 90, label: "90 hari" },
];

const STREAK_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];
// Inisial hari (Senin-start) untuk header kolom tiap blok bulan.
const DOW_INITIALS = ["S", "S", "R", "K", "J", "S", "M"];

function tierClass(count: number): string {
  if (count === 0) return "bg-gray-200 dark:bg-dashboard-border";
  if (count <= 2) return "bg-red-200 dark:bg-red-500/30";
  if (count <= 4) return "bg-red-400 dark:bg-red-500/60";
  return "bg-red-600 dark:bg-red-500 dark:shadow-[0_0_6px_rgba(239,68,68,0.8)]";
}

type DayCell = { date: string; count: number };

function computeStats(days: DayCell[]) {
  let longest = 0;
  let run = 0;
  let active = 0;
  for (const d of days) {
    if (d.count > 0) {
      run += 1;
      active += 1;
      if (run > longest) longest = run;
    } else {
      run = 0;
    }
  }
  return { longest, active, total: days.length, rest: days.length - active };
}

// Kalender multi-bulan: tiap bulan jadi blok (hari = kolom Sen..Min, minggu =
// baris ke bawah); blok bulan disusun berdampingan ke samping.
type MonthCal = { key: string; label: string; weeks: (DayCell | null)[][] };
function buildMonthCalendars(days: DayCell[]): MonthCal[] {
  const countByDate = new Map(days.map((d) => [d.date, d.count]));
  const inRange = new Set(days.map((d) => d.date));
  const monthKeys = [...new Set(days.map((d) => d.date.slice(0, 7)))].sort();

  return monthKeys.map((mk) => {
    const monthIdx = Number(mk.slice(5, 7)) - 1;
    const daysInMonth = dayjs(`${mk}-01`).daysInMonth();
    const lead = (dayjs(`${mk}-01`).day() + 6) % 7; // Monday-start offset
    const cells: (DayCell | null)[] = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let dnum = 1; dnum <= daysInMonth; dnum++) {
      const date = `${mk}-${String(dnum).padStart(2, "0")}`;
      cells.push(inRange.has(date) ? { date, count: countByDate.get(date) ?? 0 } : null);
    }
    while (cells.length % 7 !== 0) cells.push(null);
    const weeks: (DayCell | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return { key: mk, label: STREAK_MONTHS[monthIdx], weeks };
  });
}

function StreakPanel() {
  const [windowDays, setWindowDays] = useState(90);
  const q = trpc.ailene.read.streak.useQuery();

  const visibleDays = useMemo(() => {
    const all = (q.data?.days ?? []) as DayCell[];
    return all.slice(-windowDays);
  }, [q.data, windowDays]);
  const stats = useMemo(() => computeStats(visibleDays), [visibleDays]);
  const monthCals = useMemo(() => buildMonthCalendars(visibleDays), [visibleDays]);
  const todayKey = dayjs().format("YYYY-MM-DD");

  return (
    <div className="flex flex-col rounded-lg border border-dashboard-border bg-white p-5 dark:bg-card-bg">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-foreground dark:text-white">
            Riwayat Streak
          </h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Konsistensi belajar harian.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-red-500 dark:text-red-400">
          <Flame className="size-4" fill="currentColor" />
          <span className="text-sm font-semibold">
            {q.data?.current_streak ?? 0} hari berjalan
          </span>
        </div>
      </div>

      {q.isLoading ? (
        <div className="mt-5 h-56 animate-pulse rounded-md bg-gray-100 dark:bg-dashboard-border" />
      ) : q.error || !q.data ? (
        <p className="mt-8 text-center text-sm text-red-500 dark:text-red-400">
          Gagal memuat streak.
        </p>
      ) : (
        <>
          {/* Stat row */}
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StreakStat
              value={`${q.data.current_streak}`}
              unit="hari"
              label="Streak Berjalan"
              accent
            />
            <StreakStat
              value={`${stats.longest}`}
              unit="hari"
              label="Rekor Terpanjang"
            />
            <StreakStat
              value={`${stats.active}`}
              unit={`/ ${stats.total}`}
              label="Hari Aktif"
            />
            <StreakStat
              value={`${stats.rest}`}
              unit="hari"
              label="Hari Rehat"
            />
          </div>

          {/* Window filter */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              Aktivitas Harian
            </span>
            <div className="flex gap-1.5">
              {WINDOW_OPTIONS.map((opt) => (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => setWindowDays(opt.days)}
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition ${
                    windowDays === opt.days
                      ? "border-red-500 bg-red-50 text-red-600 dark:border-red-400/60 dark:bg-red-500/15 dark:text-red-300"
                      : "border-dashboard-border text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Heatmap — blok per bulan disusun ke samping; di tiap blok hari ke
              samping (Sen..Min), minggu ke bawah */}
          <div className="mt-3 overflow-x-auto pb-1">
            <div className="flex gap-4">
              {monthCals.map((month) => (
                <div key={month.key} className="flex shrink-0 flex-col gap-1">
                  <div className="text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                    {month.label}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {DOW_INITIALS.map((d, i) => (
                      <div
                        key={i}
                        className="size-5 text-center text-[9px] leading-5 text-gray-400 dark:text-gray-500"
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                  {month.weeks.map((week, wi) => (
                    <div key={wi} className="grid grid-cols-7 gap-1">
                      {week.map((cell, di) =>
                        cell ? (
                          <MuiTooltip
                            key={cell.date}
                            arrow
                            title={`${dayjs(cell.date).format("D MMM YYYY")} · ${cell.count} aktivitas`}
                          >
                            <div
                              className={`size-5 rounded-[4px] ${tierClass(cell.count)} ${
                                cell.date === todayKey
                                  ? "ring-1 ring-red-600 dark:ring-red-400"
                                  : ""
                              }`}
                            />
                          </MuiTooltip>
                        ) : (
                          <div key={`pad-${month.key}-${wi}-${di}`} className="size-5" />
                        )
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
            <span>Sedikit</span>
            <span className="size-3 rounded-[2px] bg-gray-200 dark:bg-dashboard-border" />
            <span className="size-3 rounded-[2px] bg-red-200 dark:bg-red-500/30" />
            <span className="size-3 rounded-[2px] bg-red-400 dark:bg-red-500/60" />
            <span className="size-3 rounded-[2px] bg-red-600 dark:bg-red-500" />
            <span>Banyak</span>
          </div>
        </>
      )}
    </div>
  );
}

function StreakStat({
  value,
  unit,
  label,
  accent,
}: {
  value: string;
  unit: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-baseline gap-1">
        <span
          className={`font-geist-mono text-2xl font-bold leading-none ${
            accent
              ? "text-red-600 dark:text-red-400"
              : "text-foreground dark:text-white"
          }`}
        >
          {value}
        </span>
        <span className="text-[11px] text-gray-500 dark:text-gray-400">
          {unit}
        </span>
      </div>
      <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </span>
    </div>
  );
}

// ===== Skeleton =====

function ProgressSkeleton() {
  return (
    <div className="flex w-full flex-col gap-5 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-3 w-28 rounded bg-gray-200 dark:bg-dashboard-border" />
          <div className="h-7 w-64 rounded bg-gray-200 dark:bg-dashboard-border" />
          <div className="h-3 w-80 rounded bg-gray-200 dark:bg-dashboard-border" />
        </div>
        <div className="h-16 w-40 rounded-md bg-gray-200 dark:bg-dashboard-border" />
      </div>
      <div className="h-48 rounded-lg border border-dashboard-border bg-gray-100 dark:bg-card-bg" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-lg border border-dashboard-border bg-gray-100 dark:bg-card-bg"
          />
        ))}
      </div>
      <div className="h-72 rounded-lg border border-dashboard-border bg-gray-100 dark:bg-card-bg" />
    </div>
  );
}

// ===== Outcome view (?outcome=true) ========================================
// "Program selesai" snapshot. Radar (6 dimensi) di-hardcode untuk Awal vs
// Sekarang karena belum ada endpoint baseline; sisanya pakai data nyata
// (achievements + member).

function OutcomeView({
  firstName,
  fullName,
  jobTitle,
  groupName,
  levelNumber,
  levelName,
  totalXp,
}: {
  firstName: string;
  fullName: string;
  jobTitle: string | null;
  groupName: string | null;
  levelNumber: number;
  levelName: string;
  totalXp: number;
}) {
  const year = dayjs().format("YYYY");
  const certificateId = `AC-L${levelNumber}-${year}-0001`;

  return (
    <div className="flex w-full flex-col gap-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
        <Link
          href="/student"
          className="hover:text-gray-700 dark:hover:text-gray-300"
        >
          Pembelajaran
        </Link>
        <ChevronRight className="size-3" />
        <Link
          href="/student/my-progress"
          className="hover:text-gray-700 dark:hover:text-gray-300"
        >
          Progress Saya
        </Link>
        <ChevronRight className="size-3" />
        <span className="font-medium text-gray-700 dark:text-gray-300">
          Outcome
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-red-500 dark:text-red-400">
            Outcome · Program Selesai
          </div>
          <h1 className="mt-1 text-2xl font-bold leading-tight dark:text-white">
            Perjalanan AI {firstName}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {[fullName, jobTitle, groupName].filter(Boolean).join(" · ")}.
            Mulai dari{" "}
            <span className="font-geist-mono text-gray-700 dark:text-gray-300">
              L0 Searcher
            </span>
            , sekarang{" "}
            <span className="font-semibold text-gray-700 dark:text-gray-200">
              Level {levelNumber} {levelName}
            </span>
            .
          </p>
        </div>
        <ButtonAILN variant="outline">
          <Download className="size-4" />
          Unduh ringkasan PDF
        </ButtonAILN>
      </div>

      {/* Radar (kompetensi terkini, real) + 2x2 stat grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <CompetencyProfileAILN className="h-full" />
        <OutcomeStatsGrid totalXp={totalXp} levelNumber={levelNumber} />
      </div>

      {/* Certificate */}
      <OutcomeCertificateCard
        levelNumber={levelNumber}
        levelName={levelName}
        certificateId={certificateId}
        groupName={groupName}
      />
    </div>
  );
}

function OutcomeStatsGrid({
  totalXp,
  levelNumber,
}: {
  totalXp: number;
  levelNumber: number;
}) {
  const q = trpc.ailene.read.achievements.useQuery();

  if (q.isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-lg border border-dashboard-border bg-gray-100 dark:bg-card-bg"
          />
        ))}
      </div>
    );
  }
  if (q.error || !q.data) {
    return (
      <div className="rounded-lg border border-dashboard-border bg-white p-5 text-sm text-red-500 dark:bg-card-bg dark:text-red-400">
        Gagal memuat capaian.
      </div>
    );
  }

  const a = q.data;

  return (
    <div className="grid grid-cols-2 gap-4">
      <StatCard
        icon={FileText}
        value={fmtInt(a.use_case_count)}
        label="Use Case Dicatat"
        sub={
          a.tools_mastered.length > 0
            ? `${a.tools_mastered.length} tools dikuasai`
            : undefined
        }
      />
      <StatCard
        icon={Sparkles}
        value={fmtInt(a.prompt_count)}
        label="Prompt Dicatat"
      />
      <StatCard
        icon={Star}
        value={totalXp.toLocaleString("id-ID")}
        unit="XP"
        label="Total XP"
        sub={`Level ${levelNumber}`}
      />
      <StatCard
        icon={Timer}
        value={fmtHours(a.hours_saved_total)}
        unit="jam"
        label="Jam Dihemat"
        sub="estimasi"
        accent
      />
    </div>
  );
}

function OutcomeCertificateCard({
  levelNumber,
  levelName,
  certificateId,
  groupName,
}: {
  levelNumber: number;
  levelName: string;
  certificateId: string;
  groupName: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-dashboard-border bg-white p-4 dark:bg-card-bg dark:shadow-[0_0_16px_rgba(239,68,68,0.08)]">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400 dark:shadow-[0_0_12px_rgba(239,68,68,0.4)]">
        <Star className="size-6" fill="currentColor" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-bold dark:text-white">
            Sertifikat Level {levelNumber} {levelName}
          </h3>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
            Tertinggi di program
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Diverifikasi oleh Champion{groupName ? ` ${groupName}` : ""} ·{" "}
          <span className="font-geist-mono">ID {certificateId}</span>
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <ButtonAILN variant="outline" size="small">
          <Download className="size-4" />
          Unduh PDF
        </ButtonAILN>
        <ButtonAILN variant="outline" size="small">
          <Share2 className="size-4" />
          Bagikan
        </ButtonAILN>
      </div>
    </div>
  );
}
