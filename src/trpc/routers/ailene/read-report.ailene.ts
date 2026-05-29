import { STATUS_OK } from "@/lib/status_code";
import { championProcedure } from "@/trpc/init";
import dayjs from "dayjs";
import { z } from "zod";

const reportInput = z
  .object({
    period: z.enum(["weekly", "monthly"]).default("weekly"),
  })
  .optional();

const pct = (n: number, total: number) =>
  total === 0 ? 0 : Math.round((n / total) * 100);
const round1 = (n: number) => Math.round(n * 10) / 10;

type LevelHistoryEntry = {
  level_id?: number;
  unlocked_at?: string;
};

function parseLevelHistory(history: unknown): LevelHistoryEntry[] {
  if (!Array.isArray(history)) return [];
  return history.filter((entry): entry is LevelHistoryEntry => {
    if (!entry || typeof entry !== "object") return false;
    const row = entry as Record<string, unknown>;
    return typeof row.unlocked_at === "string";
  });
}

export const readReportAilene = {
  championReport: championProcedure.input(reportInput).query(async (opts) => {
    const championId = opts.ctx.ail_member.id;
    const period = opts.input?.period ?? "weekly";
    const now = dayjs();
    const periodStart =
      period === "monthly" ? now.startOf("month") : now.startOf("week");
    const previousStart =
      period === "monthly"
        ? periodStart.subtract(1, "month")
        : periodStart.subtract(1, "week");

    const [champion, members, promptSubs, useCaseSubs, levels, sponsor] =
      await Promise.all([
        opts.ctx.prisma.ailMember.findUnique({
          where: { id: championId },
          include: {
            user: { select: { full_name: true, avatar: true } },
            championed_groups: { select: { id: true, name: true } },
          },
        }),
        opts.ctx.prisma.ailMember.findMany({
          where: { group: { champion_id: championId } },
          include: {
            user: { select: { full_name: true } },
            current_level: { select: { id: true, level_number: true, name: true } },
          },
        }),
        opts.ctx.prisma.ailPromptSubmission.findMany({
          where: { assigned_by_id: championId },
          include: {
            member: { select: { user: { select: { full_name: true } } } },
            prompt: {
              select: {
                name: true,
                level: { select: { level_number: true, name: true } },
              },
            },
          },
        }),
        opts.ctx.prisma.ailUseCaseSubmission.findMany({
          where: { assigned_by_id: championId },
          include: {
            member: { select: { user: { select: { full_name: true } } } },
            use_case: {
              select: {
                name: true,
                level: { select: { level_number: true, name: true } },
              },
            },
          },
        }),
        opts.ctx.prisma.ailLevel.findMany({
          where: { status: "ACTIVE" },
          orderBy: { level_number: "asc" },
          select: { id: true, level_number: true, name: true },
        }),
        opts.ctx.prisma.ailMember.findFirst({
          where: { role: "SPONSOR" },
          include: { user: { select: { full_name: true, avatar: true } } },
        }),
      ]);

    const periodPromptSubs = promptSubs.filter((submission) =>
      submission.submitted_at
        ? dayjs(submission.submitted_at).isAfter(periodStart)
        : false
    );
    const periodUseCaseSubs = useCaseSubs.filter((submission) =>
      submission.submitted_at
        ? dayjs(submission.submitted_at).isAfter(periodStart)
        : false
    );
    const acceptedUseCases = periodUseCaseSubs.filter((submission) => submission.is_accepted);
    const acceptedPrompts = periodPromptSubs.filter((submission) => submission.is_accepted);
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

    const activeMembers = members.filter(
      (member) =>
        member.last_active_at && dayjs(member.last_active_at).isAfter(periodStart)
    );

    const levelById = new Map(levels.map((level) => [level.id, level]));
    const movementCounts = levels.slice(0, -1).map((level) => {
      const next = levels.find((row) => row.level_number === level.level_number + 1);
      const fromLabel = `L${level.level_number}`;
      const toLabel = next ? `L${next.level_number}` : `L${level.level_number + 1}`;
      const memberNames = members
        .filter((member) =>
          parseLevelHistory(member.level_history).some((entry) => {
            if (!entry.level_id || !entry.unlocked_at) return false;
            const unlockedAt = dayjs(entry.unlocked_at);
            const unlockedLevel = levelById.get(entry.level_id);
            return (
              unlockedLevel?.level_number === level.level_number + 1 &&
              unlockedAt.isAfter(periodStart)
            );
          })
        )
        .map((member) => member.user.full_name);

      return {
        from: fromLabel,
        to: toLabel,
        count: memberNames.length,
        note:
          memberNames.length === 0
            ? "Belum ada perpindahan"
            : memberNames.slice(0, 3).join(", ") +
              (memberNames.length > 3 ? `, +${memberNames.length - 3}` : ""),
      };
    });

    const totalLevelUps = movementCounts.reduce((sum, row) => sum + row.count, 0);
    const topAcceptedUseCase = acceptedUseCases[0];
    const lowActivity = members.filter(
      (member) =>
        !member.last_active_at || dayjs(member.last_active_at).isBefore(periodStart)
    );
    const reportTitle =
      period === "monthly"
        ? `Laporan Bulanan - ${now.format("MMMM YYYY")}`
        : `Laporan Mingguan - ${periodStart.format("DD MMM")} - ${now.format("DD MMM YYYY")}`;
    const teamName =
      champion?.championed_groups.map((group) => group.name).join(", ") ??
      "Tim Champion";
    const narrativeParts = [
      `Momentum tim ${teamName} ${period === "monthly" ? "bulan" : "minggu"} ini berjalan ${
        acceptedUseCases.length + acceptedPrompts.length > 0 ? "positif" : "stabil"
      }.`,
      `${acceptedUseCases.length + acceptedPrompts.length} submission diterima dan estimasi ${round1(hoursSaved)} jam kerja berhasil dihemat.`,
      totalLevelUps > 0
        ? `${totalLevelUps} anggota naik level; fokus berikutnya menjaga konsistensi praktik.`
        : "Belum ada kenaikan level; fokus berikutnya mempercepat penyelesaian gate level.",
      topAcceptedUseCase
        ? `Use case menonjol: ${topAcceptedUseCase.use_case.name}.`
        : "Belum ada use case diterima pada periode ini.",
      lowActivity.length > 0
        ? `${lowActivity.length} anggota perlu coaching 1-on-1 karena aktivitas rendah.`
        : "Seluruh anggota aktif dalam periode ini.",
    ];

    const sentReports = [1, 2, 3].map((offset) => {
      const date =
        period === "monthly"
          ? now.subtract(offset, "month").endOf("month")
          : now.subtract(offset, "week").endOf("week");
      return {
        id: `${period}-${offset}`,
        title:
          period === "monthly"
            ? `Laporan Bulanan - ${date.format("MMM YYYY")}`
            : `Laporan Mingguan - ${date.format("DD MMM YYYY")}`,
        sent_at: date.toDate(),
        recipient: sponsor?.user.full_name ?? "Sponsor",
      };
    });

    return {
      code: STATUS_OK,
      message: "Success",
      period,
      generated_at: now.toDate(),
      report: {
        title: reportTitle,
        team_name: teamName,
        champion_name: champion?.user.full_name ?? "Champion",
        status: "draft_auto_generated" as const,
      },
      recipient: sponsor
        ? {
            id: sponsor.id,
            full_name: sponsor.user.full_name,
            avatar: sponsor.user.avatar,
            job_title: sponsor.job_title,
          }
        : null,
      metrics: {
        active_members: activeMembers.length,
        total_members: members.length,
        active_percent: pct(activeMembers.length, members.length),
        accepted_submissions: acceptedUseCases.length + acceptedPrompts.length,
        hours_saved: round1(hoursSaved),
        level_ups: totalLevelUps,
      },
      level_movements: movementCounts,
      narrative: narrativeParts.join(" "),
      sent_reports: sentReports,
      previous_period_start: previousStart.toDate(),
    };
  }),
};
