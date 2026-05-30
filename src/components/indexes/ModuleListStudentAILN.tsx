"use client";
import ChapterItemAILN, {
  ChapterItemSkeleton,
} from "@/components/items/ChapterItemAILN";
import LevelDividerAILN from "@/components/items/LevelDividerAILN";
import SkillPracticeModuleAILN from "@/components/items/SkillPracticeModuleAILN";
import type { SkillPracticeItem } from "@/components/items/SkillPracticeItemAILN";
import PageContainerAILN from "@/components/pages/PageContainerAILN";
import AppErrorComponents from "@/components/states/AppErrorComponents";
import { setSessionToken, trpc } from "@/trpc/client";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dayjs from "dayjs";
import "dayjs/locale/id";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

dayjs.locale("id");

interface Level {
  id: number;
  level_number: number;
  name: string;
  icon: string | null;
  min_xp: number;
}

interface Chapter {
  id: number;
  level_id: number;
  name: string;
  description: string | null;
  session_date: string;
  progress: "not_started" | "in_progress" | "completed";
}

export default function ModuleListStudentAILN({
  sessionToken,
}: {
  sessionToken: string;
}) {
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(
    new Set()
  );
  const [expandedModules, setExpandedModules] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    setSessionToken(sessionToken);
  }, [sessionToken]);

  const memberQ = trpc.auth.checkAilMember.useQuery();
  const levelsQ = trpc.ailene.list.levels.useQuery();
  const chaptersQ = trpc.ailene.list.chapters.useQuery();
  const levelProgressQ = trpc.ailene.read.levelProgress.useQuery();
  const promptsQ = trpc.ailene.list.assignedPrompts.useQuery();
  const useCasesQ = trpc.ailene.list.assignedUseCases.useQuery();

  // Auto-expand: URL param wins (?chapter=<id> from "Lihat detail" deep links),
  // else earliest in-progress chapter, else earliest accessible not-started
  // chapter (so fresh members still see their first chapter opened). Runs once
  // after data loads.
  const searchParams = useSearchParams();
  const chapterParam = searchParams.get("chapter");
  const practiceParam = searchParams.get("practice");
  const autoExpandedRef = useRef(false);
  useEffect(() => {
    if (autoExpandedRef.current) return;
    const chapters = chaptersQ.data?.list;
    const member = memberQ.data?.ail_member;
    const levels = levelsQ.data?.list;
    if (!chapters || !member || !levels) return;
    // Practice queries are non-blocking for the main render, but they decide
    // the practice tier — wait until both have settled before deciding.
    if (promptsQ.isLoading || useCasesQ.isLoading) return;
    autoExpandedRef.current = true;

    if (chapterParam) {
      const id = Number(chapterParam);
      if (Number.isFinite(id) && chapters.some((c) => c.id === id)) {
        setExpandedChapters(new Set([id]));
        return;
      }
    }
    if (practiceParam) {
      const id = Number(practiceParam);
      if (Number.isFinite(id)) {
        setExpandedModules(new Set([id]));
        return;
      }
    }

    // chapters are sorted asc by session_date upstream — find() = earliest
    const earliestInProgress = chapters.find(
      (c) => c.progress === "in_progress"
    );
    if (earliestInProgress) {
      setExpandedChapters(new Set([earliestInProgress.id]));
      return;
    }

    const currentLevelNumber = member.current_level?.level_number ?? 0;

    // Earliest unlocked practice module that still has at least one item not
    // yet "accepted" (todo / overdue / rejected / pending review all count as
    // belum kelar). Picks the lowest level_number.
    const levelsWithUnfinished = new Map<number, number>();
    const consider = (
      row: { reviewed_at: string | null; is_accepted: boolean },
      lvl: { id: number; level_number: number }
    ) => {
      const accepted = !!row.reviewed_at && row.is_accepted;
      if (accepted) return;
      if (lvl.level_number > currentLevelNumber) return;
      if (!levelsWithUnfinished.has(lvl.id)) {
        levelsWithUnfinished.set(lvl.id, lvl.level_number);
      }
    };
    for (const r of promptsQ.data?.list ?? []) consider(r, r.prompt.level);
    for (const r of useCasesQ.data?.list ?? []) consider(r, r.use_case.level);
    const earliestPractice = [...levelsWithUnfinished.entries()].sort(
      (a, b) => a[1] - b[1]
    )[0];
    if (earliestPractice) {
      setExpandedModules(new Set([earliestPractice[0]]));
      return;
    }

    // Fallback: earliest chapter the member can actually open right now —
    // level unlocked, session started, not yet completed.
    const levelNumberById = new Map(levels.map((l) => [l.id, l.level_number]));
    const now = dayjs();
    const nextAccessible = chapters.find((c) => {
      if (c.progress === "completed") return false;
      const lvlNum = levelNumberById.get(c.level_id);
      if (lvlNum === undefined || lvlNum > currentLevelNumber) return false;
      if (dayjs(c.session_date).isAfter(now)) return false;
      return true;
    });
    if (nextAccessible) {
      setExpandedChapters(new Set([nextAccessible.id]));
    }
  }, [
    chaptersQ.data,
    memberQ.data,
    levelsQ.data,
    promptsQ.data,
    promptsQ.isLoading,
    useCasesQ.data,
    useCasesQ.isLoading,
    chapterParam,
    practiceParam,
  ]);

  if (
    memberQ.isLoading ||
    levelsQ.isLoading ||
    chaptersQ.isLoading ||
    levelProgressQ.isLoading
  ) {
    return (
      <PageContainerAILN>
        <div className="flex w-full flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-7 w-48 rounded bg-gray-200 dark:bg-dashboard-border animate-pulse" />
              <div className="h-3 w-72 rounded bg-gray-200 dark:bg-dashboard-border animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-14 w-44 rounded-md bg-gray-200 dark:bg-dashboard-border animate-pulse" />
              <div className="h-14 w-32 rounded-md bg-gray-200 dark:bg-dashboard-border animate-pulse" />
            </div>
          </div>
          <div className="relative">
            <div className="absolute top-0 bottom-0 left-4 w-0.5 bg-red-200 dark:bg-red-500/40 dark:shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
            <div className="space-y-4">
              {[0, 1, 2, 3].map((i) => (
                <ChapterItemSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </PageContainerAILN>
    );
  }
  if (
    memberQ.error ||
    levelsQ.error ||
    chaptersQ.error ||
    levelProgressQ.error
  ) {
    return (
      <PageContainerAILN>
        <AppErrorComponents />
      </PageContainerAILN>
    );
  }

  const member = memberQ.data?.ail_member;
  const levels = levelsQ.data?.list ?? [];
  const chapters = chaptersQ.data?.list ?? [];
  const nextLevelUnlockable =
    levelProgressQ.data?.next_level_unlockable ?? false;
  if (!member)
    return (
      <PageContainerAILN>
        <AppErrorComponents />
      </PageContainerAILN>
    );

  const currentLevelNumber = member.current_level?.level_number ?? 0;

  const toggleChapter = (id: number) =>
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleModule = (levelId: number) =>
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(levelId)) next.delete(levelId);
      else next.add(levelId);
      return next;
    });

  // Level-driven timeline: every level shows up as a divider (except the
  // first), with its chapters + one SkillPractice module (prompts & use cases
  // gabungan) nested below. Order within a level: chapter → skill practice.
  type Item =
    | {
        kind: "chapter";
        chapter: Chapter;
        index: number;
        unlocked: boolean;
      }
    | {
        kind: "level";
        level: Level;
        unlocked: boolean;
        claimable: boolean;
      }
    | {
        kind: "skillPractice";
        level: Level;
        levelUnlocked: boolean;
        prompts: SkillPracticeItem[];
        useCases: SkillPracticeItem[];
      };

  const chaptersByLevel = new Map<number, Chapter[]>();
  for (const ch of chapters) {
    const bucket = chaptersByLevel.get(ch.level_id) ?? [];
    bucket.push(ch);
    chaptersByLevel.set(ch.level_id, bucket);
  }

  const allPrompts: SkillPracticeItem[] = (promptsQ.data?.list ?? []).map(
    (r) => ({
      id: r.id,
      ref_id: r.prompt.id,
      level: r.prompt.level,
      name: r.prompt.name,
      body: r.prompt.scenario,
      categories: r.prompt.categories,
      assigned_by: r.assigned_by,
      deadline: r.deadline,
      message: r.message,
      submitted_at: r.submitted_at,
      reviewed_at: r.reviewed_at,
      is_accepted: r.is_accepted,
    })
  );
  const allUseCases: SkillPracticeItem[] = (useCasesQ.data?.list ?? []).map(
    (r) => ({
      id: r.id,
      ref_id: r.use_case.id,
      level: r.use_case.level,
      name: r.use_case.name,
      body: r.use_case.description,
      categories: r.use_case.categories,
      assigned_by: r.assigned_by,
      deadline: r.deadline,
      message: r.message,
      submitted_at: r.submitted_at,
      reviewed_at: r.reviewed_at,
      is_accepted: r.is_accepted,
    })
  );
  const promptsByLevel = new Map<number, SkillPracticeItem[]>();
  for (const p of allPrompts) {
    const bucket = promptsByLevel.get(p.level.id) ?? [];
    bucket.push(p);
    promptsByLevel.set(p.level.id, bucket);
  }
  const useCasesByLevel = new Map<number, SkillPracticeItem[]>();
  for (const u of allUseCases) {
    const bucket = useCasesByLevel.get(u.level.id) ?? [];
    bucket.push(u);
    useCasesByLevel.set(u.level.id, bucket);
  }

  const items: Item[] = [];
  let weekIndex = 0;
  levels.forEach((lvl, lvlIdx) => {
    const levelUnlocked = lvl.level_number <= currentLevelNumber;

    if (lvlIdx > 0) {
      items.push({
        kind: "level",
        level: lvl,
        unlocked: levelUnlocked,
        claimable:
          !levelUnlocked &&
          lvl.level_number === currentLevelNumber + 1 &&
          nextLevelUnlockable,
      });
    }

    const levelChapters = chaptersByLevel.get(lvl.id) ?? [];
    for (const ch of levelChapters) {
      weekIndex += 1;
      const sessionStarted = !dayjs(ch.session_date).isAfter(dayjs());
      items.push({
        kind: "chapter",
        chapter: ch,
        index: weekIndex,
        unlocked: levelUnlocked && sessionStarted,
      });
    }

    const lvlPrompts = promptsByLevel.get(lvl.id) ?? [];
    const lvlUseCases = useCasesByLevel.get(lvl.id) ?? [];
    if (lvlPrompts.length + lvlUseCases.length > 0) {
      items.push({
        kind: "skillPractice",
        level: lvl,
        levelUnlocked,
        prompts: lvlPrompts,
        useCases: lvlUseCases,
      });
    }
  });

  return (
    <PageContainerAILN>
      <div className="flex w-full flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold dark:text-white">
              Modul Belajar AI
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tuntaskan semua tugas mingguan untuk maju ke level berikutnya.
            </p>
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
                  Level Sekarang
                </div>
                <div className="font-bold dark:text-white">
                  Level {member.current_level?.level_number ?? 0}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-md bg-white p-3 shadow-sm dark:border dark:border-red-500/30 dark:bg-red-500/5 dark:shadow-[0_0_16px_rgba(239,68,68,0.15)]">
              <FontAwesomeIcon
                icon={faStar}
                className="text-warning dark:text-amber-400 dark:drop-shadow-[0_0_6px_rgba(251,191,36,0.7)]"
              />
              <div className="flex flex-col">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Reward
                </div>
                <div className="font-bold dark:text-white">
                  {member.total_xp.toLocaleString()} XP
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          <div className="absolute top-0 bottom-0 left-4 w-0.5 bg-red-200 dark:bg-red-500/40 dark:shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
          <div className="space-y-4">
            {items.map((item, i) => {
              if (item.kind === "level") {
                return (
                  <LevelDividerAILN
                    key={`lvl-${item.level.id}-${i}`}
                    level={item.level}
                    unlocked={item.unlocked}
                    claimable={item.claimable}
                  />
                );
              }
              if (item.kind === "chapter") {
                return (
                  <ChapterItemAILN
                    key={item.chapter.id}
                    chapter={item.chapter}
                    chapterNumber={item.index}
                    unlocked={item.unlocked}
                    expanded={expandedChapters.has(item.chapter.id)}
                    onToggle={() => toggleChapter(item.chapter.id)}
                  />
                );
              }
              return (
                <SkillPracticeModuleAILN
                  key={`skill-${item.level.id}`}
                  level={item.level}
                  unlocked={item.levelUnlocked}
                  expanded={expandedModules.has(item.level.id)}
                  onToggle={() => toggleModule(item.level.id)}
                  prompts={item.prompts}
                  useCases={item.useCases}
                />
              );
            })}
          </div>
        </div>
      </div>
    </PageContainerAILN>
  );
}
