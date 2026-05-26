import { STATUS_NOT_FOUND, STATUS_OK } from "@/lib/status_code";
import { ailMemberProcedure, championProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import dayjs from "dayjs";
import { z } from "zod";

export const readAilene = {
  competencyProfile: ailMemberProcedure.query(async (opts) => {
    const memberId = opts.ctx.ail_member.id;

    const [quizSubs, prSubs, ucSubs] = await Promise.all([
      opts.ctx.prisma.ailQuizSubmission.findMany({
        where: { member_id: memberId, is_completed: true },
        select: { quiz_id: true, score: true },
      }),
      opts.ctx.prisma.ailPromptSubmission.findMany({
        where: { member_id: memberId, submitted_at: { not: null } },
        select: { is_accepted: true },
      }),
      opts.ctx.prisma.ailUseCaseSubmission.findMany({
        where: { member_id: memberId, submitted_at: { not: null } },
        select: {
          ai_tool: true,
          frequency: true,
          type: true,
        },
      }),
    ]);

    const round1 = (n: number) => Math.round(n * 10) / 10;
    const clamp = (n: number, min: number, max: number) =>
      Math.max(min, Math.min(max, n));

    // 1. AI Foundation — best quiz score per quiz, averaged, normalized 0-100 → 0-5
    const bestPerQuiz = new Map<string, number>();
    for (const q of quizSubs) {
      const prev = bestPerQuiz.get(q.quiz_id);
      if (prev === undefined || q.score > prev) {
        bestPerQuiz.set(q.quiz_id, q.score);
      }
    }
    const avgQuiz =
      bestPerQuiz.size === 0
        ? 0
        : Array.from(bestPerQuiz.values()).reduce((a, b) => a + b, 0) /
          bestPerQuiz.size;
    const aiFoundation = clamp(avgQuiz / 20, 0, 5);

    // 2. Prompting Quality — acceptance rate across submitted prompts
    const prAcceptedCount = prSubs.filter((p) => p.is_accepted).length;
    const promptingQuality =
      prSubs.length === 0
        ? 0
        : clamp((prAcceptedCount / prSubs.length) * 5, 0, 5);

    // 3. Tool Fluency — unique AI tools used across all use case submissions
    const tools = new Set<string>();
    for (const uc of ucSubs) {
      if (!uc.ai_tool) continue;
      for (const raw of uc.ai_tool.split(",")) {
        const t = raw.trim().toLowerCase();
        if (t) tools.add(t);
      }
    }
    const toolFluency = Math.min(tools.size, 5);

    // 4. Workplace Application — total submitted use cases, capped at 5
    const workplaceApplication = Math.min(ucSubs.length, 5);

    // 5. AI Habit — frequency weighted average across use case submissions
    const freqScore: Record<string, number> = {
      DAILY: 5,
      WEEKLY: 3.5,
      MONTHLY: 2,
      OCCASIONALLY: 1,
    };
    const freqValues = ucSubs
      .map((uc) => (uc.frequency ? freqScore[uc.frequency] ?? 0 : 0))
      .filter((v) => v > 0);
    const aiHabit =
      freqValues.length === 0
        ? 0
        : freqValues.reduce((a, b) => a + b, 0) / freqValues.length;

    // 6. Agentic Capabilities — count of WORKFLOW_AUTOMATION use cases
    const agenticCount = ucSubs.filter(
      (uc) => uc.type === "WORKFLOW_AUTOMATION"
    ).length;
    const agenticCapabilities = Math.min(agenticCount, 5);

    const dimensions = [
      { key: "ai_foundation", name: "AI Foundation", score: round1(aiFoundation) },
      { key: "prompting_quality", name: "Prompting Quality", score: round1(promptingQuality) },
      { key: "tool_fluency", name: "Tool Fluency", score: round1(toolFluency) },
      { key: "workplace_application", name: "Workplace Application", score: round1(workplaceApplication) },
      { key: "ai_habit", name: "AI Habit", score: round1(aiHabit) },
      { key: "agentic_capabilities", name: "Agentic Capabilities", score: round1(agenticCapabilities) },
    ];

    const avg = round1(
      dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length
    );

    // Tier label from overall avg
    let tier_number: number;
    let tier_name: string;
    if (avg < 1) {
      tier_number = 0;
      tier_name = "Beginner";
    } else if (avg < 2) {
      tier_number = 1;
      tier_name = "Explorer";
    } else if (avg < 3) {
      tier_number = 2;
      tier_name = "Operator";
    } else if (avg < 4) {
      tier_number = 3;
      tier_name = "Builder";
    } else {
      tier_number = 4;
      tier_name = "Master";
    }

    // Next tier preview
    const next_tier =
      tier_number >= 4
        ? null
        : {
            number: tier_number + 1,
            name: ["Explorer", "Operator", "Builder", "Master"][tier_number],
            avg_needed: round1(tier_number + 1 - avg),
          };

    return {
      code: STATUS_OK,
      message: "Success",
      profile: {
        dimensions,
        avg,
        tier_number,
        tier_name,
        next_tier,
      },
    };
  }),

  firstWin: ailMemberProcedure.query(async (opts) => {
    const memberId = opts.ctx.ail_member.id;

    // Find the earliest submission across both kinds — this is the user's
    // true "first win" milestone and the card commemorates it permanently.
    const [earliestUc, earliestPr] = await Promise.all([
      opts.ctx.prisma.ailUseCaseSubmission.findFirst({
        where: { member_id: memberId, submitted_at: { not: null } },
        orderBy: { submitted_at: "asc" },
        include: { use_case: { select: { name: true } } },
      }),
      opts.ctx.prisma.ailPromptSubmission.findFirst({
        where: { member_id: memberId, submitted_at: { not: null } },
        orderBy: { submitted_at: "asc" },
        include: { prompt: { select: { name: true } } },
      }),
    ]);

    if (!earliestUc && !earliestPr) {
      return { code: STATUS_OK, message: "Success", first_win: null };
    }

    // Each kind has its own "first" milestone. If both exist, surface the
    // one whose first submission happened most recently — the milestone the
    // user just unlocked.
    const ucWins =
      earliestUc &&
      (!earliestPr ||
        (earliestUc.submitted_at as Date) >
          (earliestPr.submitted_at as Date));

    if (ucWins && earliestUc) {
      return {
        code: STATUS_OK,
        message: "Success",
        first_win: {
          kind: "use_case" as const,
          name: earliestUc.use_case.name,
          hours_saved: earliestUc.hours_saved,
          hours_without_ai: earliestUc.hours_without_ai,
          submitted_at: earliestUc.submitted_at,
        },
      };
    }

    return {
      code: STATUS_OK,
      message: "Success",
      first_win: {
        kind: "prompt" as const,
        name: earliestPr!.prompt.name,
        submitted_at: earliestPr!.submitted_at,
      },
    };
  }),

  announcement: ailMemberProcedure.query(async (opts) => {
    const announcement = await opts.ctx.prisma.aileneAnnouncement.findUnique({
      where: { id: 1 },
    });
    return {
      code: STATUS_OK,
      message: "Success",
      announcement,
    };
  }),

  preAssessment: ailMemberProcedure.query(async (opts) => {
    const memberId = opts.ctx.ail_member.id;
    const pa = await opts.ctx.prisma.ailPreAssessment.findUnique({
      where: { member_id: memberId },
    });
    return {
      code: STATUS_OK,
      message: "Success",
      pre_assessment: pa,
    };
  }),

  materialDetail: ailMemberProcedure
    .input(z.object({ material_id: z.string().min(1) }))
    .query(async (opts) => {
      const memberId = opts.ctx.ail_member.id;
      const { material_id } = opts.input;

      const material = await opts.ctx.prisma.ailMaterial.findUnique({
        where: { id: material_id },
        include: { chapter: { select: { id: true, name: true } } },
      });
      if (!material) {
        throw new TRPCError({
          code: STATUS_NOT_FOUND,
          message: "Material not found.",
        });
      }

      const [completion, xp] = await Promise.all([
        opts.ctx.prisma.ailMaterialCompletion.findUnique({
          where: {
            member_id_material_id: {
              member_id: memberId,
              material_id: material.id,
            },
          },
        }),
        opts.ctx.prisma.ailXpEarning.findUnique({
          where: {
            member_id_learning_type_learning_id: {
              member_id: memberId,
              learning_type: "MATERIAL",
              learning_id: material.id,
            },
          },
        }),
      ]);

      return {
        code: STATUS_OK,
        message: "Success",
        material: {
          id: material.id,
          title: material.title,
          description: material.description,
          content: material.content,
          file_url: material.file_url,
          xp_reward: material.xp_reward,
          chapter: material.chapter,
          created_at: material.created_at,
          updated_at: material.updated_at,
        },
        completed: !!completion,
        completed_at: completion?.completed_at ?? null,
        xp_earned: xp?.xp_earned ?? 0,
      };
    }),

  quizResult: ailMemberProcedure
    .input(z.object({ quiz_id: z.string().min(1) }))
    .query(async (opts) => {
      const memberId = opts.ctx.ail_member.id;
      const { quiz_id } = opts.input;

      const quiz = await opts.ctx.prisma.ailQuiz.findUnique({
        where: { id: quiz_id },
        include: {
          chapter: { select: { id: true, name: true } },
          questions: {
            orderBy: { order_index: "asc" },
            include: { options: { orderBy: { id: "asc" } } },
          },
        },
      });
      if (!quiz) {
        throw new TRPCError({
          code: STATUS_NOT_FOUND,
          message: "Quiz not found.",
        });
      }

      const [latestCompleted, xp] = await Promise.all([
        opts.ctx.prisma.ailQuizSubmission.findFirst({
          where: { member_id: memberId, quiz_id, is_completed: true },
          orderBy: { attempt_number: "desc" },
        }),
        opts.ctx.prisma.ailXpEarning.findUnique({
          where: {
            member_id_learning_type_learning_id: {
              member_id: memberId,
              learning_type: "QUIZ",
              learning_id: quiz_id,
            },
          },
        }),
      ]);

      if (!latestCompleted) {
        throw new TRPCError({
          code: STATUS_NOT_FOUND,
          message: "Quiz submission not found.",
        });
      }

      return {
        code: STATUS_OK,
        message: "Success",
        quiz: {
          id: quiz.id,
          name: quiz.name,
          description: quiz.description,
          chapter: quiz.chapter,
        },
        questions: quiz.questions,
        submission: {
          attempt_number: latestCompleted.attempt_number,
          score: latestCompleted.score,
          answers: latestCompleted.answers,
          submitted_at: latestCompleted.submitted_at,
        },
        xp_earned: xp?.xp_earned ?? 0,
      };
    }),

  todayFocus: ailMemberProcedure.query(async (opts) => {
    const memberId = opts.ctx.ail_member.id;
    const currentLevelNumber =
      opts.ctx.ail_member.current_level?.level_number ?? 0;

    const [chapters, quizSubs, videoComps, materialComps] = await Promise.all([
      opts.ctx.prisma.ailChapter.findMany({
        where: { status: "ACTIVE" },
        orderBy: { session_date: "asc" },
        include: {
          level: true,
          quizzes: {
            where: { status: "ACTIVE" },
            orderBy: { order_index: "asc" },
          },
          videos: {
            where: { status: "ACTIVE" },
            orderBy: { order_index: "asc" },
          },
          materials: {
            where: { status: "ACTIVE" },
            orderBy: { order_index: "asc" },
          },
        },
      }),
      opts.ctx.prisma.ailQuizSubmission.findMany({
        where: { member_id: memberId, is_completed: true },
        select: { quiz_id: true },
      }),
      opts.ctx.prisma.ailVideoCompletion.findMany({
        where: { member_id: memberId },
        select: { video_id: true },
      }),
      opts.ctx.prisma.ailMaterialCompletion.findMany({
        where: { member_id: memberId },
        select: { material_id: true },
      }),
    ]);

    const completedQuizIds = new Set(quizSubs.map((s) => s.quiz_id));
    const completedVideoIds = new Set(videoComps.map((v) => v.video_id));
    const completedMaterialIds = new Set(
      materialComps.map((m) => m.material_id)
    );

    type Focus = {
      kind: "Quiz" | "Video" | "Material";
      task_id: string;
      task_title: string;
      chapter_id: number;
      chapter_name: string;
      href: string;
    };
    let focus: Focus | null = null;

    for (const ch of chapters) {
      if (ch.level.level_number > currentLevelNumber) continue;
      if (dayjs(ch.session_date).isAfter(dayjs())) continue;

      const m = ch.materials.find((x) => !completedMaterialIds.has(x.id));
      if (m) {
        focus = {
          kind: "Material",
          task_id: m.id,
          task_title: m.title,
          chapter_id: ch.id,
          chapter_name: ch.name,
          href: `/student/materials/${m.id}`,
        };
        break;
      }
      const q = ch.quizzes.find((x) => !completedQuizIds.has(x.id));
      if (q) {
        focus = {
          kind: "Quiz",
          task_id: q.id,
          task_title: q.name,
          chapter_id: ch.id,
          chapter_name: ch.name,
          href: `/student/quizzes/${q.id}`,
        };
        break;
      }
      const v = ch.videos.find((x) => !completedVideoIds.has(x.id));
      if (v) {
        focus = {
          kind: "Video",
          task_id: String(v.id),
          task_title: v.title,
          chapter_id: ch.id,
          chapter_name: ch.name,
          href: v.video_url,
        };
        break;
      }
    }

    return { code: STATUS_OK, message: "Success", focus };
  }),

  levelProgress: ailMemberProcedure.query(async (opts) => {
    const memberId = opts.ctx.ail_member.id;
    const currentLevel = opts.ctx.ail_member.current_level;
    const currentLevelNumber = currentLevel?.level_number ?? 0;

    const [xpAgg, levels, currentLevelChapters] = await Promise.all([
      opts.ctx.prisma.ailXpEarning.aggregate({
        _sum: { xp_earned: true },
        where: { member_id: memberId },
      }),
      opts.ctx.prisma.ailLevel.findMany({
        where: { status: "ACTIVE" },
        orderBy: { level_number: "asc" },
        select: {
          id: true,
          level_number: true,
          name: true,
          icon: true,
          min_xp: true,
        },
      }),
      opts.ctx.prisma.ailChapter.findMany({
        where: {
          status: "ACTIVE",
          level: { level_number: currentLevelNumber },
        },
        select: {
          quizzes: { where: { status: "ACTIVE" }, select: { id: true } },
          materials: { where: { status: "ACTIVE" }, select: { id: true } },
        },
      }),
    ]);

    const total_xp = xpAgg._sum.xp_earned ?? 0;
    const max_min_xp = levels.reduce((m, l) => Math.max(m, l.min_xp), 0);

    // Task-based unlock gate: quiz + material across all chapters at current
    // level. Videos don't count.
    const requiredQuizIds = currentLevelChapters.flatMap((c) =>
      c.quizzes.map((q) => q.id)
    );
    const requiredMaterialIds = currentLevelChapters.flatMap((c) =>
      c.materials.map((m) => m.id)
    );
    const tasksRequired = requiredQuizIds.length + requiredMaterialIds.length;

    const [doneQuizzes, doneMaterials] = await Promise.all([
      requiredQuizIds.length === 0
        ? []
        : opts.ctx.prisma.ailQuizSubmission.findMany({
            where: {
              member_id: memberId,
              quiz_id: { in: requiredQuizIds },
              is_completed: true,
            },
            select: { quiz_id: true },
            distinct: ["quiz_id"],
          }),
      requiredMaterialIds.length === 0
        ? []
        : opts.ctx.prisma.ailMaterialCompletion.findMany({
            where: {
              member_id: memberId,
              material_id: { in: requiredMaterialIds },
            },
            select: { material_id: true },
          }),
    ]);
    const tasksDone = doneQuizzes.length + doneMaterials.length;
    const next_level_unlockable = tasksDone >= tasksRequired;

    return {
      code: STATUS_OK,
      message: "Success",
      total_xp,
      max_min_xp,
      levels,
      current_level_number: currentLevelNumber,
      tasks_required: tasksRequired,
      tasks_done: tasksDone,
      next_level_unlockable,
    };
  }),

  achievements: ailMemberProcedure.query(async (opts) => {
    const memberId = opts.ctx.ail_member.id;

    const [ucAllTime, prCount] = await Promise.all([
      opts.ctx.prisma.ailUseCaseSubmission.findMany({
        where: { member_id: memberId, submitted_at: { not: null } },
        select: {
          hours_saved: true,
          hours_without_ai: true,
          ai_tool: true,
        },
      }),
      opts.ctx.prisma.ailPromptSubmission.count({
        where: { member_id: memberId, submitted_at: { not: null } },
      }),
    ]);

    let hours_saved_total = 0;
    for (const uc of ucAllTime) {
      if (uc.hours_saved !== null && uc.hours_without_ai !== null) {
        const saved = Number(uc.hours_without_ai) - Number(uc.hours_saved);
        if (saved > 0) hours_saved_total += saved;
      }
    }

    // Case-insensitive dedup, preserve first-seen casing
    const toolsSeen = new Map<string, string>();
    for (const uc of ucAllTime) {
      if (!uc.ai_tool) continue;
      for (const raw of uc.ai_tool.split(",")) {
        const trimmed = raw.trim();
        if (!trimmed) continue;
        const key = trimmed.toLowerCase();
        if (!toolsSeen.has(key)) toolsSeen.set(key, trimmed);
      }
    }

    return {
      code: STATUS_OK,
      message: "Success",
      use_case_count: ucAllTime.length,
      prompt_count: prCount,
      hours_saved_total: Math.round(hours_saved_total * 10) / 10,
      tools_mastered: Array.from(toolsSeen.values()),
    };
  }),

  streak: ailMemberProcedure
    .input(
      z
        .object({
          from: z.iso.date().optional(),
          to: z.iso.date().optional(),
        })
        .optional()
    )
    .query(async (opts) => {
      const memberId = opts.ctx.ail_member.id;
      const today = dayjs().startOf("day");
      const to = opts.input?.to
        ? dayjs(opts.input.to).startOf("day")
        : today;
      // Default range: last 90 days (~3 months) ending at `to`.
      const from = opts.input?.from
        ? dayjs(opts.input.from).startOf("day")
        : to.subtract(89, "day");

      // We also need a couple extra days back to compute consecutive streak
      // when the requested range starts after recent activity.
      const streakLookback = today.subtract(60, "day");
      const earliestFetch = (
        from.isBefore(streakLookback) ? from : streakLookback
      ).toDate();

      const [quizSubs, videoComps, materialComps] = await Promise.all([
        opts.ctx.prisma.ailQuizSubmission.findMany({
          where: {
            member_id: memberId,
            is_completed: true,
            submitted_at: { gte: earliestFetch },
          },
          select: { submitted_at: true },
        }),
        opts.ctx.prisma.ailVideoCompletion.findMany({
          where: {
            member_id: memberId,
            completed_at: { gte: earliestFetch },
          },
          select: { completed_at: true },
        }),
        opts.ctx.prisma.ailMaterialCompletion.findMany({
          where: {
            member_id: memberId,
            completed_at: { gte: earliestFetch },
          },
          select: { completed_at: true },
        }),
      ]);

      const completionDays = [
        ...quizSubs.map((s) => dayjs(s.submitted_at).startOf("day")),
        ...videoComps.map((v) => dayjs(v.completed_at).startOf("day")),
        ...materialComps.map((m) => dayjs(m.completed_at).startOf("day")),
      ];

      const countByDay = new Map<string, number>();
      for (const d of completionDays) {
        const k = d.format("YYYY-MM-DD");
        countByDay.set(k, (countByDay.get(k) ?? 0) + 1);
      }

      const totalDays = to.diff(from, "day") + 1;
      const days: { date: string; count: number }[] = [];
      for (let i = 0; i < totalDays; i++) {
        const day = from.add(i, "day");
        const k = day.format("YYYY-MM-DD");
        days.push({ date: k, count: countByDay.get(k) ?? 0 });
      }

      // Consecutive streak ending today (or yesterday if today is still empty)
      let current_streak = 0;
      let cursor = today;
      if ((countByDay.get(cursor.format("YYYY-MM-DD")) ?? 0) === 0) {
        cursor = cursor.subtract(1, "day");
      }
      while ((countByDay.get(cursor.format("YYYY-MM-DD")) ?? 0) > 0) {
        current_streak += 1;
        cursor = cursor.subtract(1, "day");
      }

      return {
        code: STATUS_OK,
        message: "Success",
        from: from.format("YYYY-MM-DD"),
        to: to.format("YYYY-MM-DD"),
        days,
        current_streak,
      };
    }),

  groupLeaderboard: ailMemberProcedure.query(async (opts) => {
    const memberId = opts.ctx.ail_member.id;
    const groupId = opts.ctx.ail_member.group_id;

    if (!groupId) {
      return {
        code: STATUS_OK,
        message: "Success",
        group: null,
        my_rank: 0,
        total: 0,
        leaderboard: [],
      };
    }

    const group = await opts.ctx.prisma.ailGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: { select: { id: true, full_name: true, avatar: true } },
          },
        },
      },
    });

    if (!group) {
      return {
        code: STATUS_OK,
        message: "Success",
        group: null,
        my_rank: 0,
        total: 0,
        leaderboard: [],
      };
    }

    const memberIds = group.members.map((m) => m.id);
    const xpAgg = await opts.ctx.prisma.ailXpEarning.groupBy({
      by: ["member_id"],
      _sum: { xp_earned: true },
      where: { member_id: { in: memberIds } },
    });
    const xpByMember = new Map<number, number>(
      xpAgg.map((x) => [x.member_id, x._sum.xp_earned ?? 0])
    );

    const leaderboard = group.members
      .map((m) => ({
        member_id: m.id,
        full_name: m.user.full_name,
        avatar: m.user.avatar,
        total_xp: xpByMember.get(m.id) ?? 0,
        is_me: m.id === memberId,
      }))
      .sort((a, b) => b.total_xp - a.total_xp)
      .map((r, i) => ({ rank: i + 1, ...r }));

    const myEntry = leaderboard.find((r) => r.is_me);

    return {
      code: STATUS_OK,
      message: "Success",
      group: { id: group.id, name: group.name },
      my_rank: myEntry?.rank ?? leaderboard.length,
      total: leaderboard.length,
      leaderboard,
    };
  }),

  promptAssignment: ailMemberProcedure
    .input(z.object({ prompt_id: z.number().int().positive() }))
    .query(async (opts) => {
      const memberId = opts.ctx.ail_member.id;
      const { prompt_id } = opts.input;

      const row = await opts.ctx.prisma.ailPromptSubmission.findUnique({
        where: {
          member_id_prompt_id: { member_id: memberId, prompt_id },
        },
        include: {
          prompt: {
            include: {
              level: {
                select: { id: true, level_number: true, name: true },
              },
              categories: {
                include: { category: { select: { id: true, name: true } } },
              },
            },
          },
          assigned_by: {
            select: {
              id: true,
              user: { select: { full_name: true, avatar: true } },
            },
          },
          reviewed_by: {
            select: {
              id: true,
              user: { select: { full_name: true, avatar: true } },
            },
          },
        },
      });

      if (!row || !row.assigned_by_id) {
        throw new TRPCError({
          code: STATUS_NOT_FOUND,
          message: "Assignment not found.",
        });
      }

      return {
        code: STATUS_OK,
        message: "Success",
        assignment: {
          id: row.id,
          prompt: {
            id: row.prompt.id,
            name: row.prompt.name,
            scenario: row.prompt.scenario,
            expected_output: row.prompt.expected_output,
            level: row.prompt.level,
            categories: row.prompt.categories.map((c) => c.category),
          },
          assigned_by: row.assigned_by
            ? {
                id: row.assigned_by.id,
                full_name: row.assigned_by.user.full_name,
                avatar: row.assigned_by.user.avatar,
              }
            : null,
          reviewed_by: row.reviewed_by
            ? {
                id: row.reviewed_by.id,
                full_name: row.reviewed_by.user.full_name,
                avatar: row.reviewed_by.user.avatar,
              }
            : null,
          deadline: row.deadline,
          message: row.message,
          input: row.input,
          output: row.output,
          submitted_at: row.submitted_at,
          reviewed_at: row.reviewed_at,
          comment: row.comment,
          is_accepted: row.is_accepted,
        },
      };
    }),

  useCaseAssignment: ailMemberProcedure
    .input(z.object({ use_case_id: z.number().int().positive() }))
    .query(async (opts) => {
      const memberId = opts.ctx.ail_member.id;
      const { use_case_id } = opts.input;

      const row = await opts.ctx.prisma.ailUseCaseSubmission.findUnique({
        where: {
          member_id_use_case_id: { member_id: memberId, use_case_id },
        },
        include: {
          use_case: {
            include: {
              level: {
                select: { id: true, level_number: true, name: true },
              },
              categories: {
                include: { category: { select: { id: true, name: true } } },
              },
            },
          },
          assigned_by: {
            select: {
              id: true,
              user: { select: { full_name: true, avatar: true } },
            },
          },
          reviewed_by: {
            select: {
              id: true,
              user: { select: { full_name: true, avatar: true } },
            },
          },
        },
      });

      if (!row || !row.assigned_by_id) {
        throw new TRPCError({
          code: STATUS_NOT_FOUND,
          message: "Assignment not found.",
        });
      }

      return {
        code: STATUS_OK,
        message: "Success",
        assignment: {
          id: row.id,
          use_case: {
            id: row.use_case.id,
            name: row.use_case.name,
            description: row.use_case.description,
            level: row.use_case.level,
            categories: row.use_case.categories.map((c) => c.category),
          },
          assigned_by: row.assigned_by
            ? {
                id: row.assigned_by.id,
                full_name: row.assigned_by.user.full_name,
                avatar: row.assigned_by.user.avatar,
              }
            : null,
          reviewed_by: row.reviewed_by
            ? {
                id: row.reviewed_by.id,
                full_name: row.reviewed_by.user.full_name,
                avatar: row.reviewed_by.user.avatar,
              }
            : null,
          deadline: row.deadline,
          message: row.message,
          outcome_proof: row.outcome_proof,
          hours_saved: row.hours_saved,
          hours_without_ai: row.hours_without_ai,
          description: row.description,
          ai_tool: row.ai_tool,
          frequency: row.frequency,
          type: row.type,
          submitted_at: row.submitted_at,
          reviewed_at: row.reviewed_at,
          comment: row.comment,
          is_accepted: row.is_accepted,
        },
      };
    }),

  championPromptSubmissionDetail: championProcedure
    .input(z.object({ submission_id: z.number().int().positive() }))
    .query(async (opts) => {
      const championId = opts.ctx.ail_member.id;
      const { submission_id } = opts.input;

      const row = await opts.ctx.prisma.ailPromptSubmission.findUnique({
        where: { id: submission_id },
        include: {
          prompt: {
            include: {
              level: {
                select: { id: true, level_number: true, name: true },
              },
              categories: {
                include: { category: { select: { id: true, name: true } } },
              },
            },
          },
          member: {
            select: {
              id: true,
              user: { select: { full_name: true, avatar: true, email: true } },
            },
          },
          reviewed_by: {
            select: {
              id: true,
              user: { select: { full_name: true, avatar: true } },
            },
          },
        },
      });

      if (!row || row.assigned_by_id !== championId) {
        throw new TRPCError({
          code: STATUS_NOT_FOUND,
          message: "Submission not found.",
        });
      }

      return {
        code: STATUS_OK,
        message: "Success",
        submission: {
          id: row.id,
          prompt: {
            id: row.prompt.id,
            name: row.prompt.name,
            scenario: row.prompt.scenario,
            expected_output: row.prompt.expected_output,
            level: row.prompt.level,
            categories: row.prompt.categories.map((c) => c.category),
          },
          member: {
            id: row.member.id,
            full_name: row.member.user.full_name,
            email: row.member.user.email,
            avatar: row.member.user.avatar,
          },
          reviewed_by: row.reviewed_by
            ? {
                id: row.reviewed_by.id,
                full_name: row.reviewed_by.user.full_name,
                avatar: row.reviewed_by.user.avatar,
              }
            : null,
          deadline: row.deadline,
          message: row.message,
          input: row.input,
          output: row.output,
          submitted_at: row.submitted_at,
          reviewed_at: row.reviewed_at,
          comment: row.comment,
          is_accepted: row.is_accepted,
        },
      };
    }),

  championUseCaseSubmissionDetail: championProcedure
    .input(z.object({ submission_id: z.number().int().positive() }))
    .query(async (opts) => {
      const championId = opts.ctx.ail_member.id;
      const { submission_id } = opts.input;

      const row = await opts.ctx.prisma.ailUseCaseSubmission.findUnique({
        where: { id: submission_id },
        include: {
          use_case: {
            include: {
              level: {
                select: { id: true, level_number: true, name: true },
              },
              categories: {
                include: { category: { select: { id: true, name: true } } },
              },
            },
          },
          member: {
            select: {
              id: true,
              user: { select: { full_name: true, avatar: true, email: true } },
            },
          },
          reviewed_by: {
            select: {
              id: true,
              user: { select: { full_name: true, avatar: true } },
            },
          },
        },
      });

      if (!row || row.assigned_by_id !== championId) {
        throw new TRPCError({
          code: STATUS_NOT_FOUND,
          message: "Submission not found.",
        });
      }

      return {
        code: STATUS_OK,
        message: "Success",
        submission: {
          id: row.id,
          use_case: {
            id: row.use_case.id,
            name: row.use_case.name,
            description: row.use_case.description,
            level: row.use_case.level,
            categories: row.use_case.categories.map((c) => c.category),
          },
          member: {
            id: row.member.id,
            full_name: row.member.user.full_name,
            email: row.member.user.email,
            avatar: row.member.user.avatar,
          },
          reviewed_by: row.reviewed_by
            ? {
                id: row.reviewed_by.id,
                full_name: row.reviewed_by.user.full_name,
                avatar: row.reviewed_by.user.avatar,
              }
            : null,
          deadline: row.deadline,
          message: row.message,
          outcome_proof: row.outcome_proof,
          hours_saved: row.hours_saved,
          hours_without_ai: row.hours_without_ai,
          description: row.description,
          ai_tool: row.ai_tool,
          frequency: row.frequency,
          type: row.type,
          submitted_at: row.submitted_at,
          reviewed_at: row.reviewed_at,
          comment: row.comment,
          is_accepted: row.is_accepted,
        },
      };
    }),
};
