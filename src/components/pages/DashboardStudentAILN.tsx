"use client";
import FirstWinCardAILN from "@/components/cards/FirstWinCardAILN";
import TodayFocusCardAILN from "@/components/cards/TodayFocusCardAILN";
import CompetencyProfileAILN from "@/components/charts/CompetencyProfileAILN";
import LevelProgressCardAILN from "@/components/charts/LevelProgressCardAILN";
import StreakCardAILN from "@/components/charts/StreakCardAILN";
import DeptLeaderboardAILN from "@/components/indexes/DeptLeaderboardAILN";
import PageContainerAILN from "@/components/pages/PageContainerAILN";
import AppErrorComponents from "@/components/states/AppErrorComponents";
import { setSessionToken, trpc } from "@/trpc/client";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { Megaphone, Star } from "lucide-react";
import Image from "next/image";
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

  const cohortStart = "2026-05-10";
  const cohortEnd = "2026-06-23";

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

        {/* Two-column body: left = focus + streak + level progress, right = rank */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <TodayFocusCardAILN />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <StreakCardAILN startDate={cohortStart} endDate={cohortEnd} />
              <LevelProgressCardAILN />
            </div>
          </div>
          <div className="lg:col-span-1">
            <DeptLeaderboardAILN className="h-full" />
          </div>
        </div>

        <CompetencyProfileAILN />
      </div>
    </PageContainerAILN>
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

      {/* Two-column body */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="h-48 rounded-md bg-gray-100 shadow-sm dark:border dark:border-dashboard-border dark:bg-card-bg" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="h-56 rounded-md bg-gray-100 shadow-sm dark:border dark:border-dashboard-border dark:bg-card-bg" />
            <div className="h-56 rounded-md bg-gray-100 shadow-sm dark:border dark:border-dashboard-border dark:bg-card-bg" />
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="h-full min-h-[28rem] rounded-md bg-gray-100 shadow-sm dark:border dark:border-dashboard-border dark:bg-card-bg" />
        </div>
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
