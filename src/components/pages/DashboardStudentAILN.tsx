"use client";
import FirstWinCardAILN from "@/components/cards/FirstWinCardAILN";
import TodayFocusCardAILN from "@/components/cards/TodayFocusCardAILN";
import RecommendationsAILN from "@/components/indexes/RecommendationsAILN";
import PageContainerAILN from "@/components/pages/PageContainerAILN";
import AppErrorComponents from "@/components/states/AppErrorComponents";
import { setSessionToken, trpc } from "@/trpc/client";
import dayjs from "dayjs";
import "dayjs/locale/id";
import {
  BookOpen,
  ClipboardList,
  Flame,
  LineChart,
  Megaphone,
  Star,
  Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

dayjs.locale("id");

export default function DashboardStudentAILN({
  sessionToken,
}: {
  sessionToken: string;
}) {
  useEffect(() => {
    setSessionToken(sessionToken);
  }, [sessionToken]);

  const userQ = trpc.auth.checkSession.useQuery();
  const memberQ = trpc.auth.checkAilMember.useQuery();

  if (userQ.isLoading || memberQ.isLoading) {
    return (
      <PageContainerAILN>
        <DashboardStudentSkeleton />
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
  const dateLabel = dayjs().format("dddd, D MMMM YYYY").toUpperCase();

  return (
    <PageContainerAILN>
      <div className="flex w-full flex-col gap-4">
        <AnnouncementTickerAILN />

        {/* Greeting + Current Level + Total XP */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-medium tracking-widest text-gray-500 dark:text-gray-400">
              {dateLabel}
            </div>
            <h1 className="mt-1 text-2xl font-bold leading-tight dark:text-white">
              Halo, {firstName}.
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-md bg-white p-3 shadow-sm dark:border dark:border-red-500/30 dark:bg-red-500/5 dark:shadow-[0_0_16px_rgba(239,68,68,0.15)]">
              {member.current_level?.icon && (
                <Image
                  src={member.current_level.icon}
                  alt={member.current_level.name}
                  width={32}
                  height={32}
                  className="h-8 w-8"
                />
              )}
              <div className="flex flex-col">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Current Level
                </div>
                <div className="font-bold dark:text-white">
                  Level {member.current_level?.level_number ?? 0}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-md bg-white p-3 shadow-sm dark:border dark:border-red-500/30 dark:bg-red-500/5 dark:shadow-[0_0_16px_rgba(239,68,68,0.15)]">
              <Star
                className="size-5 text-amber-500 dark:text-amber-400 dark:drop-shadow-[0_0_6px_rgba(251,191,36,0.7)]"
                fill="currentColor"
              />
              <div className="flex flex-col">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Total XP
                </div>
                <div className="font-bold dark:text-white">
                  {member.total_xp.toLocaleString()} XP
                </div>
              </div>
            </div>
          </div>
        </div>

        <FirstWinCardAILN />

        <TodayFocusCardAILN />

        {/* Momentum hari ini — ringkas & memicu aksi. Analitik lengkap
            (radar, streak heatmap, level journey, leaderboard) ada di Progress Saya. */}
        <MomentumStrip />

        {/* Aksi cepat — jadikan halaman ini pusat aktivitas harian */}
        <QuickActions />

        {/* Rekomendasi use case / prompt mandiri dari katalog (level + role/dept) */}
        <RecommendationsAILN />
      </div>
    </PageContainerAILN>
  );
}

// ===== Momentum strip (Hari Ini) — streak ringkas + nudge pilar terlemah =====

function MomentumStrip() {
  const streakQ = trpc.ailene.read.streak.useQuery();
  const compQ = trpc.ailene.read.competencyProfile.useQuery();

  const streak = streakQ.data?.current_streak ?? 0;
  const dims = compQ.data?.profile?.dimensions ?? [];
  const weakest = dims.length
    ? dims.reduce((min, d) => (d.score < min.score ? d : min), dims[0])
    : null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* Streak ringkas */}
      <div className="flex items-center gap-4 rounded-lg border border-dashboard-border bg-white p-5 dark:bg-card-bg">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-400">
          <Flame className="size-6" fill="currentColor" />
        </span>
        <div className="min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="font-geist-mono text-3xl font-bold leading-none text-foreground dark:text-white">
              {streak}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              hari berjalan
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {streak > 0
              ? "Mantap! Selesaikan 1 aktivitas hari ini biar streak nggak putus."
              : "Mulai streak-mu — selesaikan 1 aktivitas hari ini."}
          </p>
        </div>
      </div>

      {/* Nudge: fokus pilar terlemah */}
      <Link
        href="/student/practice"
        className="group flex flex-col justify-center gap-1 rounded-lg border border-dashboard-border bg-white p-5 transition hover:border-red-300 dark:bg-card-bg dark:hover:border-red-500/40"
      >
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
          <Target className="size-3.5" />
          Fokus hari ini
        </div>
        {weakest ? (
          <>
            <p className="text-sm text-gray-700 dark:text-gray-200">
              Perkuat{" "}
              <span className="font-semibold text-foreground dark:text-white">
                {weakest.name}
              </span>{" "}
              <span className="text-gray-400 dark:text-gray-500">
                ({weakest.score}/5)
              </span>
            </p>
            <span className="text-xs font-medium text-red-600 group-hover:underline dark:text-red-400">
              Latihan sekarang →
            </span>
          </>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Selesaikan beberapa aktivitas dulu untuk dapat rekomendasi fokus.
          </p>
        )}
      </Link>
    </div>
  );
}

// ===== Aksi cepat (Hari Ini) =====

function QuickActions() {
  return (
    <div className="rounded-lg border border-dashboard-border bg-white p-5 dark:bg-card-bg">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
        Aksi Cepat
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <ActionTile
          href="/student/modules"
          icon={BookOpen}
          title="Lanjutkan Belajar"
          desc="Modul & materi level kamu"
        />
        <ActionTile
          href="/student/practice"
          icon={ClipboardList}
          title="Latihan Prompt"
          desc="Skill practice dari Champion"
        />
        <ActionTile
          href="/student/my-progress"
          icon={LineChart}
          title="Lihat Progres"
          desc="Level, streak & kompetensi"
        />
      </div>
    </div>
  );
}

function ActionTile({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-lg border border-dashboard-border bg-gray-50/60 p-4 transition hover:border-red-300 hover:bg-white dark:bg-card-inside-bg dark:hover:border-red-500/40"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-white text-red-500 shadow-sm dark:bg-card-bg dark:text-red-400">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground dark:text-white">
          {title}
        </span>
        <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
          {desc}
        </span>
      </span>
    </Link>
  );
}

// ===== Skeleton =====

function DashboardStudentSkeleton() {
  return (
    <div className="flex w-full flex-col gap-4 animate-pulse">
      {/* Greeting + Current Level + Total XP */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <div className="h-3 w-40 rounded bg-gray-200 dark:bg-dashboard-border" />
          <div className="h-7 w-56 rounded bg-gray-200 dark:bg-dashboard-border" />
        </div>
        <div className="flex items-center gap-3">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-md bg-white p-3 shadow-sm dark:border dark:border-red-500/30 dark:bg-red-500/5 dark:shadow-[0_0_16px_rgba(239,68,68,0.15)]"
            >
              <div className="h-8 w-8 rounded bg-gray-200 dark:bg-dashboard-border" />
              <div className="flex flex-col gap-1.5">
                <div className="h-2.5 w-20 rounded bg-gray-200 dark:bg-dashboard-border" />
                <div className="h-4 w-16 rounded bg-gray-200 dark:bg-dashboard-border" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="h-36 rounded-lg border border-dashboard-border bg-gray-100 dark:bg-card-bg" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="h-[360px] rounded-lg border border-dashboard-border bg-gray-100 dark:bg-card-bg" />
        <div className="h-[360px] rounded-lg border border-dashboard-border bg-gray-100 dark:bg-card-bg" />
        <div className="h-[360px] rounded-lg border border-dashboard-border bg-gray-100 dark:bg-card-bg" />
      </div>
    </div>
  );
}

// ===== Announcement Ticker (AILN) =====

function AnnouncementTickerAILN() {
  const announcementQ = trpc.ailene.read.announcement.useQuery();

  if (announcementQ.isLoading || !announcementQ.data?.announcement) return null;

  const ann = announcementQ.data.announcement;
  const now = dayjs();
  const active =
    ann.status === "ACTIVE" &&
    now.isAfter(dayjs(ann.start_date)) &&
    now.isBefore(dayjs(ann.end_date));
  if (!active) return null;

  const segment = (
    <div className="flex shrink-0 items-center">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex shrink-0 items-center gap-3 px-8">
          <span className="text-sm text-white">{ann.title}</span>
          <span className="text-white/30">•</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex w-full items-stretch overflow-hidden rounded-md bg-black">
      {/* Fixed left badge */}
      <div className="flex shrink-0 items-center gap-2 bg-black px-4 py-3">
        <Megaphone className="h-4 w-4 text-white" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white">
          {ann.callout ?? "PENGUMUMAN"}
        </span>
        <span className="ml-1 h-4 w-px bg-white/15" />
      </div>

      {/* Moving marquee */}
      <div className="relative flex-1 overflow-hidden py-3">
        <div
          className="flex items-center"
          style={{
            animation: "cat-marquee 60s linear infinite",
            width: "max-content",
          }}
        >
          {segment}
          {segment}
        </div>
      </div>
    </div>
  );
}
