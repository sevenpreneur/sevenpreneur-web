"use client";
import ButtonAILN from "@/components/buttons/ButtonAILN";
import PageContainerAILN from "@/components/pages/PageContainerAILN";
import { setSessionToken, trpc } from "@/trpc/client";
import { AlertTriangle, CheckCircle2, Download, Megaphone } from "lucide-react";
import { useEffect, useState } from "react";

const BLUE_DARK = "#00359D";
const ORANGE = "#ec7e3c";

// ---------- Mock data (sourced from PDF stakeholder report, snapshot 26 Mei 2026) ----------

const PERIODS = ["7H", "30H", "Cohort", "YTD"] as const;
type Period = (typeof PERIODS)[number];

const KPIS = [
  {
    label: "TOTAL RESPONDEN",
    value: "2",
    sub: "termasuk 1 test entry",
  },
  {
    label: "DAILY AI USERS",
    value: "50%",
    sub: "1 dari 2",
  },
  {
    label: "SELALU CROSS-CHECK",
    value: "100%",
    sub: "indikator quality habit",
  },
  {
    label: "ATTITUDE SUPPORTIVE",
    value: "100%",
    sub: "readiness sinyal positif",
  },
];

const METHODOLOGY: { dim: string; q: string; type: string }[] = [
  {
    dim: "Usage habit",
    q: "Q1 frequency, Q2 tools, Q7 use cases",
    type: "enum + multi-select",
  },
  {
    dim: "Konseptual",
    q: "Q4 understanding, Q5 limitations",
    type: "enum + multi-select",
  },
  {
    dim: "Skill",
    q: "Q10 prompt comfort, Q9 contoh konkret",
    type: "enum + text",
  },
  {
    dim: "Output quality",
    q: "Q6 review practice, Q11 safety practices",
    type: "enum + multi-select",
  },
  {
    dim: "Organisasi",
    q: "Q3 job role, Q8 team adoption, Q12 attitude",
    type: "text + enum",
  },
  {
    dim: "Readiness",
    q: "Q13 challenge, Q14 expectation, Q15 motivation",
    type: "text + enum",
  },
];

const RESPONDENTS: {
  id: number;
  role: string;
  isTest?: boolean;
  frequency: string;
  understanding: string;
  prompt: string;
  review: string;
  attitude: string;
  motivation: string;
  tools: number;
  useCases: number;
}[] = [
  {
    id: 5,
    role: "Product Manager",
    frequency: "daily",
    understanding: "expert",
    prompt: "structured",
    review: "cross_check",
    attitude: "supportive",
    motivation: "eager",
    tools: 5,
    useCases: 7,
  },
  {
    id: 6,
    role: "asdad",
    isTest: true,
    frequency: "tried",
    understanding: "aware",
    prompt: "structured",
    review: "cross_check",
    attitude: "supportive",
    motivation: "curious",
    tools: 1,
    useCases: 2,
  },
];

const MATURITY: {
  title: string;
  buckets: string[];
  data: number[];
  highlightBucket?: string;
}[] = [
  {
    title: "AI Use Frequency",
    buckets: ["never", "tried", "weekly", "daily", "intensive"],
    data: [0, 1, 0, 1, 0],
  },
  {
    title: "AI Understanding",
    buckets: ["none", "aware", "basic", "explain", "expert"],
    data: [0, 1, 0, 0, 1],
  },
  {
    title: "Prompt Comfort",
    buckets: ["none", "basic", "decent", "structured", "expert"],
    data: [0, 0, 0, 2, 0],
  },
  {
    title: "Output Review Habit",
    buckets: ["no_use", "no_check", "sometimes", "always", "cross_check"],
    data: [0, 0, 0, 0, 2],
    highlightBucket: "cross_check",
  },
];

const TOOLS = [
  { label: "Gemini (Google)", n: 2, highlight: true },
  { label: "ChatGPT (OpenAI)", n: 1 },
  { label: "Claude (Anthropic)", n: 1 },
  { label: "GitHub Copilot", n: 1 },
  { label: "Perplexity AI", n: 1 },
];

const USE_CASES = [
  { label: "Analisis data & insight", n: 2, highlight: true },
  { label: "Membuat presentasi/visual", n: 2, highlight: true },
  { label: "Brainstorming & ideasi", n: 1 },
  { label: "Coding / debugging / otomasi", n: 1 },
  { label: "Menulis email/laporan/dokumen", n: 1 },
  { label: "Meringkas konten panjang", n: 1 },
  { label: "Riset & pengumpulan informasi", n: 1 },
];

const SAFETY = [
  { label: "Hak cipta konten AI", n: 2 },
  { label: "Review output sebelum dipakai", n: 2 },
  { label: "Jangan input data rahasia", n: 1, highlight: true },
  { label: "Pahami kebijakan AI perusahaan", n: 1, highlight: true },
  { label: "Transparan ke klien/kolega", n: 1, highlight: true },
];

const READINESS: {
  dim: string;
  distribution: string;
  tone: "good" | "watch";
  note: string;
}[] = [
  {
    dim: "Team adoption (Q8)",
    distribution: '100% "policy"',
    tone: "good",
    note: "organisasi punya kebijakan AI eksplisit menurut persepsi peserta",
  },
  {
    dim: "Professional attitude (Q12)",
    distribution: '100% "supportive"',
    tone: "good",
    note: 'tidak ada resistance — kurikulum bisa langsung ke "how", bukan "why"',
  },
  {
    dim: "Motivation (Q15)",
    distribution: "50% eager, 50% curious",
    tone: "good",
    note: "baseline engagement tinggi",
  },
  {
    dim: "Output review (Q6)",
    distribution: "100% cross_check",
    tone: "good",
    note: "habit kualitas sudah ada",
  },
  {
    dim: "Prompt skill (Q10)",
    distribution: '100% "structured"',
    tone: "watch",
    note: "self-rating mungkin over-confident; perlu praktis assessment di sesi awal",
  },
];

const RISKS = [
  {
    title: "Sample sangat kecil (n=2)",
    body: "tidak cukup untuk generalisasi. Setiap kesimpulan di atas perlu re-validate ketika n ≥ 30.",
  },
  {
    title: "Test data contamination",
    body: 'entry ID 6 berisi placeholder ("asdad" di job role & teks bebas). Perlu di-filter sebelum analytics, atau tambahkan flag is_test_entry di schema.',
  },
  {
    title: "Self-rating bias",
    body: '100% mengaku prompt skill "structured". Lazim untuk over-claim — perlu hands-on baseline test di session 1.',
  },
  {
    title: "Gap safety awareness",
    body: "50% awareness terhadap larangan input data rahasia adalah risiko compliance, terutama jika ada peserta yang handle data klien.",
  },
];

const ACTIONS: {
  no: number;
  action: string;
  owner: string;
  priority: "High" | "Medium";
}[] = [
  {
    no: 1,
    action:
      "Genjot response rate ke minimal n=30 sebelum interpretasi strategis",
    owner: "Program lead",
    priority: "High",
  },
  {
    no: 2,
    action:
      "Bersihkan test entries; tambah constraint validasi job_role minimum length & flag is_test",
    owner: "Engineering",
    priority: "High",
  },
  {
    no: 3,
    action:
      'Susun kurikulum 2-track: Foundation (untuk "tried/aware") & Advanced (untuk "daily/expert")',
    owner: "Curriculum",
    priority: "Medium",
  },
  {
    no: 4,
    action:
      "Pasang modul data confidentiality & AI policy sebagai mandatory pre-session",
    owner: "Curriculum",
    priority: "High",
  },
  {
    no: 5,
    action:
      "Tambah hands-on prompt assessment di session 1 untuk validasi self-rating",
    owner: "Curriculum",
    priority: "Medium",
  },
  {
    no: 6,
    action:
      "Re-baseline post-training (post-assessment) di tabel paralel untuk ukur delta",
    owner: "Program lead",
    priority: "Medium",
  },
];

// ---------- Component ----------

export default function DashboardPreAssesmentAILN({
  sessionToken,
}: {
  sessionToken: string;
}) {
  useEffect(() => {
    setSessionToken(sessionToken);
  }, [sessionToken]);

  const [period, setPeriod] = useState<Period>("Cohort");
  const orgStatsQ = trpc.ailene.read.organizationStats.useQuery();

  return (
    <PageContainerAILN>
      <div className="flex w-full flex-col gap-6">
        {/* Header — preserved from DashboardSponsorAILN */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold tracking-widest text-gray-500 dark:text-gray-400">
              SPONSOR · EXECUTIVE VIEW
            </div>
            <h1 className="mt-1 text-3xl font-bold leading-tight text-gray-900 dark:text-white">
              Hutama Karya
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {orgStatsQ.data
                ? `${orgStatsQ.data.member_count} karyawan · ${orgStatsQ.data.group_count} departemen`
                : "— member · — departemen"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <PeriodToggle period={period} onChange={setPeriod} />
            <ButtonAILN variant="light" size="medium">
              <Download className="size-4" />
              Export PDF
            </ButtonAILN>
            <ButtonAILN variant="primary" size="medium">
              <Megaphone className="size-4" />
              Kirim pengumuman
            </ButtonAILN>
          </div>
        </div>

        {/* Section heading — Pre-Assessment Report */}
        <div className="flex flex-col gap-1">
          <div className="text-[11px] font-semibold tracking-widest text-gray-500 dark:text-gray-400">
            AI LITERACY PROGRAM · PRE-ASSESSMENT
          </div>
          <h2 className="text-2xl font-bold leading-tight text-gray-900 dark:text-white">
            Pre-Assessment Report
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Stakeholder briefing — baseline AI maturity peserta sebelum program
            training.
          </p>
        </div>

        {/* 4 KPI tiles */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {KPIS.map((k) => (
            <KpiTile key={k.label} {...k} />
          ))}
        </div>

        {/* Headline insight strip */}
        <div className="rounded-lg border-l-4 border-l-amber-500 bg-amber-50 px-4 py-3 text-sm dark:border-l-amber-400 dark:bg-amber-500/10">
          <span className="font-semibold text-amber-900 dark:text-amber-200">
            Headline buat stakeholder:
          </span>{" "}
          <span className="text-gray-700 dark:text-gray-300">
            sampel masih terlalu kecil untuk strategic decision — prioritas
            pertama adalah{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              menggenjot response rate
            </span>{" "}
            (target minimal n=30) dan{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              membersihkan test entries
            </span>
            . Sinyal awal mengindikasikan{" "}
            <Pill tone="good">positif & willing</Pill> tapi{" "}
            <Pill tone="watch">heterogeneous maturity</Pill>, artinya kurikulum
            kemungkinan perlu di-track (foundation vs advanced).
          </span>
        </div>

        {/* Methodology + Respondent snapshot */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Section title="Methodology & Coverage">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="pb-2 font-semibold">Dimensi</th>
                  <th className="pb-2 font-semibold">Pertanyaan</th>
                  <th className="pb-2 font-semibold">Tipe</th>
                </tr>
              </thead>
              <tbody>
                {METHODOLOGY.map((m) => (
                  <tr
                    key={m.dim}
                    className="border-t border-dashboard-border align-top"
                  >
                    <td className="py-2 font-medium text-gray-900 dark:text-white">
                      {m.dim}
                    </td>
                    <td className="py-2 text-gray-700 dark:text-gray-300">
                      {m.q}
                    </td>
                    <td className="py-2 text-gray-500 dark:text-gray-400">
                      {m.type}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="Respondent Snapshot">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <th className="pb-2 pr-3 font-semibold">ID</th>
                    <th className="pb-2 pr-3 font-semibold">Role</th>
                    <th className="pb-2 pr-3 font-semibold">Freq</th>
                    <th className="pb-2 pr-3 font-semibold">Attitude</th>
                    <th className="pb-2 pr-3 text-right font-semibold">
                      Tools
                    </th>
                    <th className="pb-2 text-right font-semibold">Use cases</th>
                  </tr>
                </thead>
                <tbody>
                  {RESPONDENTS.map((r) => (
                    <tr
                      key={r.id}
                      className="border-t border-dashboard-border align-top"
                    >
                      <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">
                        {r.id}
                      </td>
                      <td className="py-2 pr-3">
                        {r.isTest ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-red-300 px-2 py-0.5 text-[11px] text-red-700 dark:border-red-500/40 dark:text-red-300">
                            “{r.role}” — test
                          </span>
                        ) : (
                          <span className="text-gray-900 dark:text-white">
                            {r.role}
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">
                        {r.frequency}
                      </td>
                      <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">
                        {r.attitude}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums text-gray-900 dark:text-white">
                        {r.tools}
                      </td>
                      <td className="py-2 text-right tabular-nums text-gray-900 dark:text-white">
                        {r.useCases}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </div>

        {/* Maturity snapshot — 4 mini bar charts */}
        <Section
          title="Maturity Snapshot"
          subtitle="Empat dimensi inti — frekuensi, pemahaman, prompt skill, review habit"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {MATURITY.map((m) => (
              <MaturityChart key={m.title} {...m} />
            ))}
          </div>
          <SoWhat>
            jurang antar peserta lebar — bagian <em>review habit</em> dan{" "}
            <em>prompt skill</em> justru sudah seragam di tingkat sehat
            (cross-check, structured). Yang melebar adalah{" "}
            <em>frekuensi pakai</em> dan <em>pemahaman konseptual</em> → fokus
            training:{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              conceptual scaffolding
            </span>{" "}
            untuk pemula,{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              advanced workflow
            </span>{" "}
            untuk yang sudah daily.
          </SoWhat>
        </Section>

        {/* Tools + Use cases */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Section title="Tools yang digunakan">
            <HBarList items={TOOLS} />
            <Insight>
              <span className="font-semibold text-gray-900 dark:text-white">
                Gemini
              </span>{" "}
              adalah satu-satunya tools yang dipakai semua responden — sinyal
              bahwa ekosistem Google paling familiar. Tools lain hanya muncul
              pada power user.
            </Insight>
          </Section>

          <Section title="Use case AI">
            <HBarList items={USE_CASES} />
            <Insight>
              Dua use case dominan adalah{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                analisis data
              </span>{" "}
              dan{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                pembuatan presentasi
              </span>{" "}
              — keduanya quick-win modules untuk sesi awal training.
            </Insight>
          </Section>
        </div>

        {/* Safety awareness */}
        <Section title="Awareness terhadap praktik keamanan">
          <HBarList items={SAFETY} />
          <div className="mt-4 rounded-lg border-l-4 border-l-red-500 bg-red-50 px-4 py-3 text-sm dark:border-l-red-400 dark:bg-red-500/10">
            <span className="inline-flex items-center gap-1.5 font-semibold text-red-800 dark:text-red-300">
              <AlertTriangle className="size-4" />
              Risk signal:
            </span>{" "}
            <span className="text-gray-700 dark:text-gray-300">
              awareness untuk &ldquo;jangan input data rahasia perusahaan ke AI
              publik&rdquo; hanya 50% — padahal ini adalah safety practice yang
              paling impactful dari sisi compliance.{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                Rekomendasi:
              </span>{" "}
              jadikan modul data confidentiality & AI policy mandatory di awal
              program.
            </span>
          </div>
        </Section>

        {/* Readiness signals */}
        <Section title="Readiness Signals">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="pb-2 pr-3 font-semibold">Dimensi</th>
                <th className="pb-2 pr-3 font-semibold">Distribusi (n=2)</th>
                <th className="pb-2 font-semibold">Interpretasi</th>
              </tr>
            </thead>
            <tbody>
              {READINESS.map((r) => (
                <tr
                  key={r.dim}
                  className="border-t border-dashboard-border align-top"
                >
                  <td className="py-2 pr-3 font-medium text-gray-900 dark:text-white">
                    {r.dim}
                  </td>
                  <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">
                    {r.distribution}
                  </td>
                  <td className="py-2 text-gray-700 dark:text-gray-300">
                    <span className="mr-2 inline-flex items-center">
                      <Pill tone={r.tone === "good" ? "good" : "watch"}>
                        {r.tone === "good" ? "Positif" : "Periksa"}
                      </Pill>
                    </span>
                    {r.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* Risks + Recommended actions */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <Section title="Risks & Data Quality">
            <ul className="flex flex-col gap-3 text-sm">
              {RISKS.map((r, i) => (
                <li
                  key={i}
                  className="rounded-md border border-dashboard-border bg-card-inside-bg px-3 py-2.5 dark:bg-card-inside-bg/60"
                >
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {i + 1}. {r.title}
                  </div>
                  <div className="mt-0.5 text-gray-700 dark:text-gray-300">
                    {r.body}
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Recommended Actions">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="pb-2 pr-2 font-semibold">#</th>
                  <th className="pb-2 pr-3 font-semibold">Aksi</th>
                  <th className="pb-2 pr-3 font-semibold">Owner</th>
                  <th className="pb-2 font-semibold">Prioritas</th>
                </tr>
              </thead>
              <tbody>
                {ACTIONS.map((a) => (
                  <tr
                    key={a.no}
                    className="border-t border-dashboard-border align-top"
                  >
                    <td className="py-2 pr-2 tabular-nums text-gray-500 dark:text-gray-400">
                      {a.no}
                    </td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">
                      {a.action}
                    </td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">
                      {a.owner}
                    </td>
                    <td className="py-2">
                      <PriorityChip priority={a.priority} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      </div>
    </PageContainerAILN>
  );
}

// ---------- Sub-components ----------

function PeriodToggle({
  period,
  onChange,
}: {
  period: Period;
  onChange: (p: Period) => void;
}) {
  return (
    <div className="inline-flex h-9 items-center rounded-md border border-dashboard-border bg-white p-0.5 text-sm dark:bg-card-bg">
      {PERIODS.map((p) => {
        const active = p === period;
        return (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`h-full rounded px-3 text-xs font-semibold transition-colors ${
              active
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            }`}
          >
            {p}
          </button>
        );
      })}
    </div>
  );
}

function KpiTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex flex-col rounded-lg border border-dashboard-border bg-white p-4 shadow-sm dark:bg-card-bg dark:shadow-[0_0_16px_rgba(0,53,157,0.06)]">
      <div className="text-[10px] font-semibold tracking-widest text-gray-500 dark:text-gray-400">
        {label}
      </div>
      <div className="mt-2 text-3xl font-bold leading-none text-gray-900 dark:text-white">
        {value}
      </div>
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">{sub}</div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashboard-border bg-white p-5 shadow-sm dark:bg-card-bg dark:shadow-[0_0_16px_rgba(0,53,157,0.06)]">
      <div className="mb-3 flex flex-col gap-0.5">
        <div className="text-base font-bold text-gray-900 dark:text-white">
          {title}
        </div>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function Pill({
  tone,
  children,
}: {
  tone: "good" | "watch";
  children: React.ReactNode;
}) {
  const cls =
    tone === "good"
      ? "border-emerald-300 text-emerald-700 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300"
      : "border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}
    >
      {tone === "good" && <CheckCircle2 className="size-3" />}
      {children}
    </span>
  );
}

function PriorityChip({ priority }: { priority: "High" | "Medium" }) {
  const cls =
    priority === "High"
      ? "border-red-300 text-red-700 bg-red-50 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300"
      : "border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}
    >
      {priority}
    </span>
  );
}

function MaturityChart({
  title,
  buckets,
  data,
  highlightBucket,
}: {
  title: string;
  buckets: string[];
  data: number[];
  highlightBucket?: string;
}) {
  const max = Math.max(...data, 2);
  return (
    <div className="rounded-md border border-dashboard-border bg-card-inside-bg p-3 dark:bg-card-inside-bg/60">
      <div className="mb-3 text-xs font-semibold text-gray-700 dark:text-gray-300">
        {title}
      </div>
      <div className="flex h-28 items-end gap-1.5">
        {data.map((v, i) => {
          const h = (v / max) * 100;
          const isHighlight = buckets[i] === highlightBucket;
          const barColor = isHighlight
            ? "bg-emerald-500 dark:bg-emerald-400"
            : "bg-[#00359D] dark:bg-blue-500/80";
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">
                {v > 0 ? v : ""}
              </span>
              <div className="relative flex h-full w-full items-end">
                <div
                  className={`w-full rounded-sm ${barColor}`}
                  style={{ height: `${Math.max(h, v > 0 ? 6 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5">
        {buckets.map((b) => (
          <div
            key={b}
            className="flex-1 truncate text-center text-[9px] text-gray-500 dark:text-gray-400"
            title={b}
          >
            {b}
          </div>
        ))}
      </div>
    </div>
  );
}

function HBarList({
  items,
}: {
  items: { label: string; n: number; highlight?: boolean }[];
}) {
  const max = Math.max(...items.map((i) => i.n), 2);
  return (
    <div className="flex flex-col gap-2">
      {items.map((it) => {
        const w = (it.n / max) * 100;
        const color = it.highlight ? ORANGE : BLUE_DARK;
        return (
          <div
            key={it.label}
            className="grid grid-cols-[minmax(0,180px)_1fr_auto] items-center gap-3 text-sm"
          >
            <span className="truncate text-gray-700 dark:text-gray-300">
              {it.label}
            </span>
            <div className="h-2.5 w-full overflow-hidden rounded-sm bg-gray-100 dark:bg-dashboard-border">
              <div
                className="h-full rounded-sm"
                style={{ width: `${w}%`, backgroundColor: color }}
              />
            </div>
            <span className="w-6 text-right tabular-nums text-xs font-semibold text-gray-900 dark:text-white">
              {it.n}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Insight({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-md bg-[#eef2fb] px-3 py-2 text-xs text-gray-700 dark:bg-blue-500/10 dark:text-gray-300">
      <span className="font-semibold text-[#00359D] dark:text-blue-200">
        Insight:
      </span>{" "}
      {children}
    </div>
  );
}

function SoWhat({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-md border-l-4 border-l-[#00359D] bg-[#eef2fb] px-3 py-2 text-xs text-gray-700 dark:border-l-blue-400 dark:bg-blue-500/10 dark:text-gray-300">
      <span className="font-semibold text-[#00359D] dark:text-blue-200">
        So-what:
      </span>{" "}
      {children}
    </div>
  );
}
