import { STATUS_NOT_FOUND, STATUS_OK } from "@/lib/status_code";
import { sponsorProcedure } from "@/trpc/init";
import type { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import dayjs from "dayjs";
import { z } from "zod";

const groupInput = z.object({ group_id: z.number().int().positive() });

const round1 = (n: number) => Math.round(n * 10) / 10;
const pct = (n: number, total: number) =>
  total === 0 ? 0 : Math.round((n / total) * 100);

async function ensureGroup(prisma: PrismaClient, groupId: number) {
  const group = await prisma.ailGroup.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      name: true,
      champion: {
        select: {
          id: true,
          job_title: true,
          user: { select: { full_name: true, avatar: true } },
        },
      },
    },
  });

  if (!group) {
    throw new TRPCError({
      code: STATUS_NOT_FOUND,
      message: "Group not found.",
    });
  }

  return group;
}

export const readGroupAilene = {
  departments: sponsorProcedure.query(async (opts) => {
    const groups = await opts.ctx.prisma.ailGroup.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, _count: { select: { members: true } } },
    });

    return {
      code: STATUS_OK,
      message: "Success",
      departments: groups.map((group) => ({
        id: group.id,
        name: group.name,
        member_count: group._count.members,
      })),
    };
  }),

  overview: sponsorProcedure.input(groupInput).query(async (opts) => {
    const groupId = opts.input.group_id;
    const group = await ensureGroup(opts.ctx.prisma, groupId);
    const activeSince = dayjs().subtract(7, "day").toDate();

    const [members, useCaseSubmissions] = await Promise.all([
      opts.ctx.prisma.ailMember.findMany({
        where: { group_id: groupId },
        select: {
          id: true,
          last_active_at: true,
          current_level: { select: { level_number: true } },
        },
      }),
      opts.ctx.prisma.ailUseCaseSubmission.findMany({
        where: {
          member: { group_id: groupId },
          submitted_at: { not: null },
        },
        select: {
          is_accepted: true,
          hours_saved: true,
          hours_without_ai: true,
          submitted_at: true,
        },
      }),
    ]);

    const totalMembers = members.length;
    const activeMembers = members.filter(
      (member) => member.last_active_at && member.last_active_at >= activeSince
    ).length;
    const avgLevel =
      totalMembers === 0
        ? 0
        : round1(
            members.reduce(
              (sum, member) => sum + member.current_level.level_number,
              0
            ) / totalMembers
          );
    const beginnerCount = members.filter(
      (member) => member.current_level.level_number <= 1
    ).length;
    const acceptedUseCases = useCaseSubmissions.filter(
      (submission) => submission.is_accepted
    );
    const hoursSaved = acceptedUseCases.reduce((sum, submission) => {
      if (
        submission.hours_saved === null ||
        submission.hours_without_ai === null
      ) {
        return sum;
      }

      const saved =
        Number(submission.hours_without_ai) - Number(submission.hours_saved);
      return saved > 0 ? sum + saved : sum;
    }, 0);
    const monthStart = dayjs().startOf("month");
    const acceptedThisMonth = acceptedUseCases.filter((submission) =>
      submission.submitted_at
        ? dayjs(submission.submitted_at).isAfter(monthStart)
        : false
    ).length;

    return {
      code: STATUS_OK,
      message: "Success",
      group: {
        ...group,
        champion: {
          id: group.champion.id,
          full_name: group.champion.user.full_name,
          avatar: group.champion.user.avatar,
          job_title: group.champion.job_title,
        },
      },
      metrics: {
        total_members: totalMembers,
        active_members: activeMembers,
        active_percent: pct(activeMembers, totalMembers),
        avg_level: avgLevel,
        beginner_count: beginnerCount,
        beginner_percent: pct(beginnerCount, totalMembers),
        hours_saved_total: round1(hoursSaved),
        accepted_use_cases: acceptedUseCases.length,
        accepted_use_cases_this_month: acceptedThisMonth,
        needs_intervention:
          totalMembers > 0 && pct(beginnerCount, totalMembers) >= 35,
      },
    };
  }),

  levelDistribution: sponsorProcedure.input(groupInput).query(async (opts) => {
    const groupId = opts.input.group_id;
    await ensureGroup(opts.ctx.prisma, groupId);

    const [levels, members] = await Promise.all([
      opts.ctx.prisma.ailLevel.findMany({
        where: { status: "ACTIVE" },
        orderBy: { level_number: "asc" },
        select: { id: true, level_number: true, name: true },
      }),
      opts.ctx.prisma.ailMember.findMany({
        where: { group_id: groupId },
        select: { current_level: { select: { id: true, level_number: true } } },
      }),
    ]);

    const countByLevel = new Map<number, number>();
    for (const member of members) {
      const levelId = member.current_level.id;
      countByLevel.set(levelId, (countByLevel.get(levelId) ?? 0) + 1);
    }

    return {
      code: STATUS_OK,
      message: "Success",
      total_members: members.length,
      levels: levels.map((level) => ({
        id: level.id,
        level_number: level.level_number,
        code: `L${level.level_number}`,
        name: level.name,
        count: countByLevel.get(level.id) ?? 0,
        percent: pct(countByLevel.get(level.id) ?? 0, members.length),
      })),
    };
  }),

  topUseCases: sponsorProcedure.input(groupInput).query(async (opts) => {
    const groupId = opts.input.group_id;
    await ensureGroup(opts.ctx.prisma, groupId);

    const submissions = await opts.ctx.prisma.ailUseCaseSubmission.findMany({
      where: {
        member: { group_id: groupId },
        submitted_at: { not: null },
        is_accepted: true,
      },
      select: {
        use_case_id: true,
        use_case: {
          select: {
            name: true,
            level: { select: { level_number: true, name: true } },
          },
        },
      },
    });

    const total = submissions.length;
    const map = new Map<
      number,
      { name: string; level_code: string; level_name: string; count: number }
    >();

    for (const submission of submissions) {
      const existing = map.get(submission.use_case_id) ?? {
        name: submission.use_case.name,
        level_code: `L${submission.use_case.level.level_number}`,
        level_name: submission.use_case.level.name,
        count: 0,
      };
      existing.count += 1;
      map.set(submission.use_case_id, existing);
    }

    const useCases = Array.from(map.entries())
      .map(([id, row]) => ({
        id,
        ...row,
        percent: pct(row.count, total),
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 5);

    return { code: STATUS_OK, message: "Success", total, use_cases: useCases };
  }),

  attentionMembers: sponsorProcedure.input(groupInput).query(async (opts) => {
    const groupId = opts.input.group_id;
    await ensureGroup(opts.ctx.prisma, groupId);
    const activeSince = dayjs().subtract(7, "day").toDate();

    const members = await opts.ctx.prisma.ailMember.findMany({
      where: { group_id: groupId, role: { not: "SPONSOR" } },
      orderBy: { id: "asc" },
      select: {
        id: true,
        job_title: true,
        last_active_at: true,
        user: { select: { full_name: true, avatar: true } },
        current_level: {
          select: { level_number: true, name: true },
        },
        use_case_submissions: {
          where: { submitted_at: { not: null } },
          select: { is_accepted: true },
        },
      },
    });

    const rows = members
      .map((member) => {
        const inactiveDays = member.last_active_at
          ? dayjs().diff(dayjs(member.last_active_at), "day")
          : null;
        const acceptedCount = member.use_case_submissions.filter(
          (submission) => submission.is_accepted
        ).length;
        const levelNumber = member.current_level.level_number;
        const needsAttention =
          levelNumber <= 1 ||
          acceptedCount === 0 ||
          !member.last_active_at ||
          member.last_active_at < activeSince;

        return {
          id: member.id,
          full_name: member.user.full_name,
          avatar: member.user.avatar,
          job_title: member.job_title,
          level_number: levelNumber,
          level_name: member.current_level.name,
          accepted_use_cases: acceptedCount,
          inactive_days: inactiveDays,
          status:
            !member.last_active_at
              ? "Belum mulai"
              : member.last_active_at < activeSince
                ? `Pasif ${inactiveDays} hari`
                : "Aktif",
          needs_attention: needsAttention,
          score:
            (levelNumber <= 1 ? 3 : 0) +
            (acceptedCount === 0 ? 2 : 0) +
            (!member.last_active_at || member.last_active_at < activeSince
              ? 2
              : 0),
        };
      })
      .sort(
        (a, b) =>
          Number(b.needs_attention) - Number(a.needs_attention) ||
          b.score - a.score ||
          a.level_number - b.level_number ||
          a.full_name.localeCompare(b.full_name)
      );

    return {
      code: STATUS_OK,
      message: "Success",
      lagging_count: rows.filter((member) => member.needs_attention).length,
      members: rows,
    };
  }),
};
