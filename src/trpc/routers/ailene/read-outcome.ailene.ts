import { STATUS_OK } from "@/lib/status_code";
import { sponsorProcedure } from "@/trpc/init";

// ---------------------------------------------------------------------------
// Sponsor-facing "Outcome Report" — end-of-program results, current state.
// One endpoint per concern (KPIs / level distribution / top performers).
// ---------------------------------------------------------------------------

// Rupiah value of one hour saved (kept in sync with executiveView).
const ROI_VALUE_PER_HOUR = 250_000;
// Working hours per year used to express saved hours as full-time equivalents.
const WORK_HOURS_PER_YEAR = 1_760;

const round1 = (n: number) => Math.round(n * 10) / 10;
const pct = (n: number, total: number) =>
  total === 0 ? 0 : Math.round((n / total) * 100);

function hoursSaved(
  hoursWithoutAi: { toString(): string } | null,
  hoursWithAi: { toString(): string } | null
): number {
  if (hoursWithoutAi === null || hoursWithAi === null) return 0;
  const saved = Number(hoursWithoutAi) - Number(hoursWithAi);
  return saved > 0 ? saved : 0;
}

export const readOutcome = {
  // KPI tiles: cumulative hours saved, ROI rupiah, current avg level, certified.
  overview: sponsorProcedure.query(async (opts) => {
    const [members, levels, useCaseSubmissions, deptCount] = await Promise.all([
      opts.ctx.prisma.ailMember.findMany({
        select: { current_level: { select: { level_number: true } } },
      }),
      opts.ctx.prisma.ailLevel.findMany({
        where: { status: "ACTIVE" },
        select: { level_number: true },
      }),
      opts.ctx.prisma.ailUseCaseSubmission.findMany({
        where: { submitted_at: { not: null } },
        select: { hours_saved: true, hours_without_ai: true },
      }),
      opts.ctx.prisma.ailGroup.count(),
    ]);

    const memberCount = members.length;
    const avgLevel =
      memberCount === 0
        ? 0
        : members.reduce(
            (sum, m) => sum + (m.current_level?.level_number ?? 0),
            0
          ) / memberCount;
    const certifiedCount = members.filter(
      (m) => (m.current_level?.level_number ?? 0) >= 1
    ).length;

    const hoursSavedTotal = useCaseSubmissions.reduce(
      (sum, row) => sum + hoursSaved(row.hours_without_ai, row.hours_saved),
      0
    );
    const maxLevelNumber = levels.reduce(
      (m, l) => Math.max(m, l.level_number),
      0
    );

    return {
      code: STATUS_OK,
      message: "Success",
      member_count: memberCount,
      department_count: deptCount,
      hours_saved_total: round1(hoursSavedTotal),
      fte_equivalent: round1(hoursSavedTotal / WORK_HOURS_PER_YEAR),
      roi_total: Math.round(hoursSavedTotal * ROI_VALUE_PER_HOUR),
      roi_rate_per_hour: ROI_VALUE_PER_HOUR,
      avg_level: round1(avgLevel),
      max_level_number: maxLevelNumber,
      certified_count: certifiedCount,
      certified_percent: pct(certifiedCount, memberCount),
    };
  }),

  // Current distribution of members across the active levels.
  levelDistribution: sponsorProcedure.query(async (opts) => {
    const [levels, members] = await Promise.all([
      opts.ctx.prisma.ailLevel.findMany({
        where: { status: "ACTIVE" },
        orderBy: { level_number: "asc" },
        select: { level_number: true, name: true },
      }),
      opts.ctx.prisma.ailMember.findMany({
        select: { current_level: { select: { level_number: true } } },
      }),
    ]);

    const total = members.length;
    const countByLevel = new Map<number, number>();
    for (const m of members) {
      const ln = m.current_level?.level_number ?? 0;
      countByLevel.set(ln, (countByLevel.get(ln) ?? 0) + 1);
    }

    const distribution = levels.map((l) => {
      const count = countByLevel.get(l.level_number) ?? 0;
      return {
        level_number: l.level_number,
        code: `L${l.level_number}`,
        name: l.name,
        count,
        percent: pct(count, total),
      };
    });

    return { code: STATUS_OK, message: "Success", total, distribution };
  }),

  // Every member ranked org-wide by a composite of XP, hours, use cases & level.
  topPerformers: sponsorProcedure.query(async (opts) => {
    const [members, levels, xpAgg, useCaseSubmissions] = await Promise.all([
      opts.ctx.prisma.ailMember.findMany({
        where: { role: { not: "SPONSOR" } },
        select: {
          id: true,
          user: { select: { full_name: true, avatar: true } },
          group: { select: { name: true } },
          current_level: { select: { level_number: true, name: true } },
        },
      }),
      opts.ctx.prisma.ailLevel.findMany({
        where: { status: "ACTIVE" },
        select: { level_number: true },
      }),
      opts.ctx.prisma.ailXpEarning.groupBy({
        by: ["member_id"],
        _sum: { xp_earned: true },
      }),
      opts.ctx.prisma.ailUseCaseSubmission.findMany({
        where: { submitted_at: { not: null } },
        select: {
          member_id: true,
          hours_saved: true,
          hours_without_ai: true,
        },
      }),
    ]);

    const xpByMember = new Map<number, number>(
      xpAgg.map((x) => [x.member_id, x._sum.xp_earned ?? 0])
    );
    const ucCountByMember = new Map<number, number>();
    const hoursByMember = new Map<number, number>();
    for (const row of useCaseSubmissions) {
      ucCountByMember.set(
        row.member_id,
        (ucCountByMember.get(row.member_id) ?? 0) + 1
      );
      hoursByMember.set(
        row.member_id,
        (hoursByMember.get(row.member_id) ?? 0) +
          hoursSaved(row.hours_without_ai, row.hours_saved)
      );
    }

    const maxLevelNumber = Math.max(
      1,
      levels.reduce((m, l) => Math.max(m, l.level_number), 0)
    );

    const base = members.map((m) => {
      const xp = xpByMember.get(m.id) ?? 0;
      const useCaseCount = ucCountByMember.get(m.id) ?? 0;
      const hours = round1(hoursByMember.get(m.id) ?? 0);
      const levelNumber = m.current_level?.level_number ?? 0;
      return {
        member_id: m.id,
        full_name: m.user.full_name,
        avatar: m.user.avatar,
        department: m.group?.name ?? "—",
        level_number: levelNumber,
        level_code: `L${levelNumber}`,
        level_name: m.current_level?.name ?? null,
        xp,
        use_case_count: useCaseCount,
        hours,
      };
    });

    // Normalize each signal against the org max so the leader scores full on it.
    const maxXp = Math.max(1, ...base.map((b) => b.xp));
    const maxHours = Math.max(1, ...base.map((b) => b.hours));
    const maxUseCases = Math.max(1, ...base.map((b) => b.use_case_count));

    const list = base
      .map((b) => {
        const composite = Math.round(
          100 *
            (0.4 * (b.xp / maxXp) +
              0.25 * (b.hours / maxHours) +
              0.2 * (b.use_case_count / maxUseCases) +
              0.15 * (b.level_number / maxLevelNumber))
        );
        return { ...b, composite };
      })
      .sort(
        (a, b) =>
          b.composite - a.composite ||
          b.hours - a.hours ||
          a.full_name.localeCompare(b.full_name)
      )
      .map((row, i) => ({ ...row, rank: i + 1 }));

    return {
      code: STATUS_OK,
      message: "Success",
      total: list.length,
      list,
    };
  }),
};
