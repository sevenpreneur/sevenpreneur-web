import { STATUS_OK } from "@/lib/status_code";
import { sponsorProcedure } from "@/trpc/init";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Sponsor-facing pre-assessment aggregations (org-level baseline / "T0").
// One endpoint per dashboard concern so each card loads & invalidates on its
// own. Every endpoint accepts an optional `group_id` to scope to a department.
// ---------------------------------------------------------------------------

const groupInput = z
  .object({ group_id: z.number().int().positive().optional() })
  .optional();

const round1 = (n: number) => Math.round(n * 10) / 10;
const pct = (n: number, total: number) =>
  total === 0 ? 0 : Math.round((n / total) * 100);
const mean = (values: number[]) =>
  values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;

// Scope helpers — pre-assessment rows are filtered through their member's group.
const paWhere = (groupId?: number) =>
  groupId ? { member: { group_id: groupId } } : {};
const memberWhere = (groupId?: number) => (groupId ? { group_id: groupId } : {});

// Ordinal 1–5 score maps for the single-choice enums used by the radar pillars.
const UNDERSTANDING_SCORE: Record<string, number> = {
  NONE: 1,
  AWARE: 2,
  BASIC: 3,
  EXPLAIN: 4,
  EXPERT: 5,
};
const PROMPT_SCORE: Record<string, number> = {
  NONE: 1,
  BASIC: 2,
  DECENT: 3,
  STRUCTURED: 4,
  EXPERT: 5,
};
const ADOPTION_SCORE: Record<string, number> = {
  NONE: 1,
  PERSONAL: 2,
  PILOT: 3,
  POLICY: 4,
  INTEGRATED: 5,
};
const ATTITUDE_SCORE: Record<string, number> = {
  TOO_RISKY: 1,
  CAUTIOUS: 2,
  NEUTRAL: 3,
  SUPPORTIVE: 4,
  ESSENTIAL: 5,
};
const MOTIVATION_SCORE: Record<string, number> = {
  MANDATORY: 1,
  CURIOUS: 2,
  TENTATIVE: 3,
  READY: 4,
  EAGER: 5,
};

// q1 — usage frequency. `highlight` marks the "rutin" (daily+) buckets.
const FREQUENCY_BUCKETS: { key: string; label: string; highlight: boolean }[] =
  [
    { key: "NEVER", label: "Belum pernah", highlight: false },
    { key: "TRIED", label: "Pernah, tak rutin", highlight: false },
    { key: "WEEKLY", label: "1–2× / minggu", highlight: false },
    { key: "DAILY", label: "Hampir tiap hari", highlight: true },
    { key: "INTENSIVE", label: "Beberapa kali/hari", highlight: true },
  ];

// q8 — team adoption maturity. `highlight` marks the "formal" buckets.
const ADOPTION_BUCKETS: { key: string; label: string; highlight: boolean }[] = [
  { key: "NONE", label: "Belum ada", highlight: false },
  { key: "PERSONAL", label: "Personal, sporadis", highlight: false },
  { key: "PILOT", label: "Inisiatif kecil", highlight: false },
  { key: "POLICY", label: "Ada kebijakan", highlight: true },
  { key: "INTEGRATED", label: "Terintegrasi rutin", highlight: true },
];

// q2 — canonical option string (stored verbatim) → short display label.
const TOOL_LABELS: Record<string, string> = {
  "ChatGPT (OpenAI)": "ChatGPT",
  "Gemini (Google)": "Gemini",
  "Copilot (Microsoft)": "Copilot (MS)",
  "Midjourney / DALL·E / image generator": "Image gen",
  "Claude (Anthropic)": "Claude",
  "Perplexity AI": "Perplexity",
  "GitHub Copilot (coding)": "GitHub Copilot",
};
const TOOL_NONE = "Belum pernah menggunakan satupun";

// q7 — canonical use-case option → short display label.
const USE_CASE_LABELS: Record<string, string> = {
  "Menulis email, laporan, atau dokumen": "Menulis email & dokumen",
  "Meringkas konten panjang (artikel, notulen, laporan)":
    "Meringkas konten panjang",
  "Riset dan pengumpulan informasi": "Riset & cari informasi",
  "Membuat presentasi atau visual": "Buat presentasi/visual",
  "Analisis data dan insight": "Analisis data & insight",
  "Coding / debugging / otomasi": "Coding & otomasi",
  "Brainstorming dan ideasi": "Brainstorming & ideasi",
  "Layanan pelanggan / customer support": "Customer support",
  "Pemasaran dan pembuatan konten": "Pemasaran & konten",
};

// q11 — the five "positive" safety practices. The dashboard reports the GAP:
// % of respondents who did NOT select each one (i.e. are not yet aware).
const SAFETY_PRACTICES: { canonical: string; label: string }[] = [
  {
    canonical: "Jangan memasukkan data rahasia perusahaan ke AI publik",
    label: "Jangan unggah data rahasia ke AI publik",
  },
  {
    canonical: "Selalu review output AI sebelum digunakan secara resmi",
    label: "Selalu review output sebelum dipakai resmi",
  },
  {
    canonical: "Perhatikan hak cipta konten yang dihasilkan AI",
    label: "Perhatikan hak cipta konten AI",
  },
  {
    canonical:
      "Transparan kepada klien/kolega jika konten dibuat dengan bantuan AI",
    label: "Transparan ke klien/kolega",
  },
  {
    canonical: "Pahami kebijakan penggunaan AI perusahaan",
    label: "Pahami kebijakan AI perusahaan",
  },
];

// Free-text clustering for q13/q14. A respondent is counted in a cluster when
// their answer contains any of the cluster's keywords (matched once per
// respondent). Best-effort thematic grouping over open-ended text.
const CHALLENGE_CLUSTERS: { label: string; keywords: string[] }[] = [
  {
    label: "Tidak tahu mulai dari mana",
    keywords: ["mulai", "dari mana", "bingung", "awam", "pemula"],
  },
  {
    label: "Ragu akurasi hasil AI",
    keywords: ["akuras", "akurat", "ragu", "halusin", "keliru", "salah hasil"],
  },
  {
    label: "Tidak ada tools approved",
    keywords: ["approved", "akses", "tidak ada tool", "belum ada tool", "lisensi"],
  },
  {
    label: "Takut salah / risiko data",
    keywords: ["takut", "risiko", "rahasia", "keamanan", "bocor", "privasi"],
  },
  {
    label: "Kurang waktu belajar",
    keywords: ["waktu", "sibuk", "sempat", "padat"],
  },
];
const EXPECTATION_CLUSTERS: { label: string; keywords: string[] }[] = [
  {
    label: "Hemat waktu kerja rutin",
    keywords: ["hemat", "cepat", "efisien", "produktif", "menghemat"],
  },
  {
    label: "Prompt lebih efektif",
    keywords: ["prompt", "instruksi", "bertanya", "perintah"],
  },
  {
    label: "Pilih tools yang tepat",
    keywords: ["tools", "alat", "memilih", "pilih tool"],
  },
  {
    label: "Otomasi workflow",
    keywords: ["otomasi", "automasi", "otomatis", "workflow", "alur kerja"],
  },
  {
    label: "Paham batasan & etika",
    keywords: ["etika", "batasan", "aman", "limitasi", "risiko", "kebijakan"],
  },
];

function clusterText(
  texts: string[],
  clusters: { label: string; keywords: string[] }[]
) {
  const counts = clusters.map((c) => ({ label: c.label, count: 0 }));
  for (const raw of texts) {
    const text = raw.toLowerCase();
    clusters.forEach((cluster, i) => {
      if (cluster.keywords.some((kw) => text.includes(kw))) {
        counts[i].count += 1;
      }
    });
  }
  return counts.sort((a, b) => b.count - a.count);
}

export const readPreAssessment = {
  // List of departments for the header filter dropdown.
  departments: sponsorProcedure.query(async (opts) => {
    const [groups, totalMembers] = await Promise.all([
      opts.ctx.prisma.ailGroup.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, _count: { select: { members: true } } },
      }),
      opts.ctx.prisma.ailMember.count(),
    ]);
    return {
      code: STATUS_OK,
      message: "Success",
      total_members: totalMembers,
      departments: groups.map((g) => ({
        id: g.id,
        name: g.name,
        member_count: g._count.members,
      })),
    };
  }),

  // KPI tiles: participation, routine-user rate, basic-literacy rate.
  overview: sponsorProcedure.input(groupInput).query(async (opts) => {
    const groupId = opts.input?.group_id;
    const [totalMembers, rows] = await Promise.all([
      opts.ctx.prisma.ailMember.count({ where: memberWhere(groupId) }),
      opts.ctx.prisma.ailPreAssessment.findMany({
        where: paWhere(groupId),
        select: {
          q1_ai_use_frequency: true,
          q4_ai_understanding: true,
          created_at: true,
        },
      }),
    ]);

    const respondents = rows.length;
    const routineUsers = rows.filter(
      (r) =>
        r.q1_ai_use_frequency === "DAILY" ||
        r.q1_ai_use_frequency === "INTENSIVE"
    ).length;
    const literate = rows.filter((r) =>
      ["BASIC", "EXPLAIN", "EXPERT"].includes(r.q4_ai_understanding)
    ).length;
    const measuredAt = rows.reduce<Date | null>(
      (acc, r) => (!acc || r.created_at > acc ? r.created_at : acc),
      null
    );

    return {
      code: STATUS_OK,
      message: "Success",
      total_members: totalMembers,
      completed_count: respondents,
      participation_percent: pct(respondents, totalMembers),
      routine_users_percent: pct(routineUsers, respondents),
      basic_literacy_percent: pct(literate, respondents),
      measured_at: measuredAt,
    };
  }),

  // 6-pillar readiness radar + org average (the "Kesiapan rata-rata pillar" KPI).
  pillars: sponsorProcedure.input(groupInput).query(async (opts) => {
    const groupId = opts.input?.group_id;
    const rows = await opts.ctx.prisma.ailPreAssessment.findMany({
      where: paWhere(groupId),
      select: {
        q4_ai_understanding: true,
        q10_prompt_comfort: true,
        q8_team_adoption: true,
        q2_ai_tools_used: true,
        q11_safety_practices: true,
        q12_professional_attitude: true,
        q15_motivation: true,
      },
    });

    const positiveSafety = new Set(SAFETY_PRACTICES.map((p) => p.canonical));

    const foundations: number[] = [];
    const prompting: number[] = [];
    const workplace: number[] = [];
    const tooling: number[] = [];
    const ethicsSafety: number[] = [];
    const mindset: number[] = [];

    for (const r of rows) {
      foundations.push(UNDERSTANDING_SCORE[r.q4_ai_understanding] ?? 0);
      prompting.push(PROMPT_SCORE[r.q10_prompt_comfort] ?? 0);
      workplace.push(ADOPTION_SCORE[r.q8_team_adoption] ?? 0);
      tooling.push(
        Math.min(
          r.q2_ai_tools_used.filter((t) => t !== TOOL_NONE).length,
          5
        )
      );
      ethicsSafety.push(
        Math.min(
          r.q11_safety_practices.filter((s) => positiveSafety.has(s)).length,
          5
        )
      );
      mindset.push(
        ((ATTITUDE_SCORE[r.q12_professional_attitude] ?? 0) +
          (MOTIVATION_SCORE[r.q15_motivation] ?? 0)) /
          2
      );
    }

    const pillars = [
      { key: "foundations", name: "Foundations", score: round1(mean(foundations)) },
      { key: "prompting", name: "Prompting", score: round1(mean(prompting)) },
      { key: "workplace", name: "Workplace", score: round1(mean(workplace)) },
      { key: "tooling", name: "Tooling", score: round1(mean(tooling)) },
      {
        key: "ethics_safety",
        name: "Ethics & Safety",
        score: round1(mean(ethicsSafety)),
      },
      { key: "mindset", name: "Mindset", score: round1(mean(mindset)) },
    ];

    return {
      code: STATUS_OK,
      message: "Success",
      respondents: rows.length,
      pillars,
      org_avg: round1(mean(pillars.map((p) => p.score))),
    };
  }),

  // q1 — AI usage frequency distribution.
  usageFrequency: sponsorProcedure.input(groupInput).query(async (opts) => {
    const groupId = opts.input?.group_id;
    const rows = await opts.ctx.prisma.ailPreAssessment.findMany({
      where: paWhere(groupId),
      select: { q1_ai_use_frequency: true },
    });
    const respondents = rows.length;
    const counts = new Map<string, number>();
    for (const r of rows) {
      counts.set(
        r.q1_ai_use_frequency,
        (counts.get(r.q1_ai_use_frequency) ?? 0) + 1
      );
    }

    const buckets = FREQUENCY_BUCKETS.map((b) => {
      const count = counts.get(b.key) ?? 0;
      return {
        key: b.key,
        label: b.label,
        count,
        percent: pct(count, respondents),
        highlight: b.highlight,
      };
    });
    const routinePercent = pct(
      buckets
        .filter((b) => b.highlight)
        .reduce((s, b) => s + b.count, 0),
      respondents
    );

    return {
      code: STATUS_OK,
      message: "Success",
      respondents,
      buckets,
      routine_percent: routinePercent,
    };
  }),

  // q2 — AI tool penetration (multi-select), as % of respondents who tried each.
  tools: sponsorProcedure.input(groupInput).query(async (opts) => {
    const groupId = opts.input?.group_id;
    const rows = await opts.ctx.prisma.ailPreAssessment.findMany({
      where: paWhere(groupId),
      select: { q2_ai_tools_used: true },
    });
    const respondents = rows.length;
    const counts = new Map<string, number>();
    for (const r of rows) {
      for (const tool of r.q2_ai_tools_used) {
        if (tool === TOOL_NONE) continue;
        counts.set(tool, (counts.get(tool) ?? 0) + 1);
      }
    }

    const tools = Array.from(counts.entries())
      .map(([canonical, count]) => ({
        label: TOOL_LABELS[canonical] ?? canonical,
        count,
        percent: pct(count, respondents),
      }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

    return { code: STATUS_OK, message: "Success", respondents, tools };
  }),

  // q8 — team adoption maturity distribution + share with a formal policy.
  teamMaturity: sponsorProcedure.input(groupInput).query(async (opts) => {
    const groupId = opts.input?.group_id;
    const rows = await opts.ctx.prisma.ailPreAssessment.findMany({
      where: paWhere(groupId),
      select: { q8_team_adoption: true },
    });
    const respondents = rows.length;
    const counts = new Map<string, number>();
    for (const r of rows) {
      counts.set(r.q8_team_adoption, (counts.get(r.q8_team_adoption) ?? 0) + 1);
    }

    const buckets = ADOPTION_BUCKETS.map((b) => {
      const count = counts.get(b.key) ?? 0;
      return {
        key: b.key,
        label: b.label,
        count,
        percent: pct(count, respondents),
        highlight: b.highlight,
      };
    });
    const formalPercent = pct(
      buckets.filter((b) => b.highlight).reduce((s, b) => s + b.count, 0),
      respondents
    );

    return {
      code: STATUS_OK,
      message: "Success",
      respondents,
      buckets,
      formal_percent: formalPercent,
    };
  }),

  // q11 — safety awareness GAP: % of respondents NOT aware of each practice.
  safetyGaps: sponsorProcedure.input(groupInput).query(async (opts) => {
    const groupId = opts.input?.group_id;
    const rows = await opts.ctx.prisma.ailPreAssessment.findMany({
      where: paWhere(groupId),
      select: { q11_safety_practices: true },
    });
    const respondents = rows.length;

    const gaps = SAFETY_PRACTICES.map((p) => {
      const aware = rows.filter((r) =>
        r.q11_safety_practices.includes(p.canonical)
      ).length;
      const gap = respondents - aware;
      return {
        label: p.label,
        gap_count: gap,
        gap_percent: pct(gap, respondents),
      };
    });

    return { code: STATUS_OK, message: "Success", respondents, gaps };
  }),

  // q7 — most-wanted use cases (multi-select), ranked, top 6.
  topUseCases: sponsorProcedure.input(groupInput).query(async (opts) => {
    const groupId = opts.input?.group_id;
    const rows = await opts.ctx.prisma.ailPreAssessment.findMany({
      where: paWhere(groupId),
      select: { q7_use_cases: true },
    });
    const respondents = rows.length;
    const counts = new Map<string, number>();
    for (const r of rows) {
      for (const uc of r.q7_use_cases) {
        counts.set(uc, (counts.get(uc) ?? 0) + 1);
      }
    }

    const useCases = Array.from(counts.entries())
      .map(([canonical, count]) => ({
        label: USE_CASE_LABELS[canonical] ?? canonical,
        count,
        percent: pct(count, respondents),
      }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
      .slice(0, 6)
      .map((u, i) => ({ ...u, rank: i + 1, highlight: i < 2 }));

    return { code: STATUS_OK, message: "Success", respondents, useCases };
  }),

  // Voice of employees: clustered q13 challenges & q14 expectations + readiness.
  voice: sponsorProcedure.input(groupInput).query(async (opts) => {
    const groupId = opts.input?.group_id;
    const rows = await opts.ctx.prisma.ailPreAssessment.findMany({
      where: paWhere(groupId),
      select: {
        q13_biggest_challenge: true,
        q14_training_expectation: true,
        q12_professional_attitude: true,
        q15_motivation: true,
      },
    });
    const respondents = rows.length;

    const challenges = clusterText(
      rows.map((r) => r.q13_biggest_challenge),
      CHALLENGE_CLUSTERS
    );
    const expectations = clusterText(
      rows.map((r) => r.q14_training_expectation),
      EXPECTATION_CLUSTERS
    );

    const motivated = rows.filter((r) =>
      ["READY", "EAGER"].includes(r.q15_motivation)
    ).length;
    const supportive = rows.filter((r) =>
      ["SUPPORTIVE", "ESSENTIAL"].includes(r.q12_professional_attitude)
    ).length;

    return {
      code: STATUS_OK,
      message: "Success",
      respondents,
      challenges,
      expectations,
      motivated_percent: pct(motivated, respondents),
      supportive_percent: pct(supportive, respondents),
    };
  }),
};
