"use client";
import ButtonAILN from "@/components/buttons/ButtonAILN";
import PageContainerSVP from "@/components/pages/PageContainerSVP";
import AppErrorComponents from "@/components/states/AppErrorComponents";
import AppLoadingComponents from "@/components/states/AppLoadingComponents";
import {
  PRE_ASSESSMENT_CATEGORY_COLORS,
  PRE_ASSESSMENT_QUESTIONS,
  PRE_ASSESSMENT_TYPE_LABELS,
  PreAssessmentQuestion,
} from "@/lib/pre-assessment-questions";
import { setSessionToken, trpc } from "@/trpc/client";
import type { AilPreAssessment } from "@prisma/client";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ArrowRight, BookOpen, Check, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import AlertConfirmDialogAILN from "../modals/AlertConfirmDialogAILN";

type AnswerValue = string | string[] | null;
type AnswerMap = Record<string, AnswerValue>;
type PreAssessmentResultData = Omit<AilPreAssessment, "created_at"> & {
  created_at: string | Date;
};

interface PreAssessmentAILNProps {
  sessionToken: string;
}

function isAnswered(q: PreAssessmentQuestion, v: AnswerValue): boolean {
  if (v == null) return false;
  if (q.type === "multi") return Array.isArray(v) && v.length > 0;
  return typeof v === "string" && v.trim().length > 0;
}

export default function PreAssessmentAILN({
  sessionToken,
}: PreAssessmentAILNProps) {
  const utils = trpc.useUtils();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  const isDark = mounted && resolvedTheme === "dark";
  const nextVariant = isDark ? "outline" : "primary";

  useEffect(() => {
    if (sessionToken) setSessionToken(sessionToken);
  }, [sessionToken]);

  const { data, isLoading, isError } =
    trpc.ailene.read.preAssessment.mine.useQuery();

  const submittedRef = useRef(false);

  const [answers, setAnswers] = useState<AnswerMap>(() => {
    const init: AnswerMap = {};
    for (const q of PRE_ASSESSMENT_QUESTIONS) {
      init[q.field] = q.type === "multi" ? [] : null;
    }
    return init;
  });
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  const totalQuestions = PRE_ASSESSMENT_QUESTIONS.length;
  const currentQ = PRE_ASSESSMENT_QUESTIONS[currentIdx];

  const answeredCount = useMemo(
    () =>
      PRE_ASSESSMENT_QUESTIONS.filter((q) => isAnswered(q, answers[q.field]))
        .length,
    [answers]
  );

  const missingRequired = useMemo(
    () =>
      PRE_ASSESSMENT_QUESTIONS.filter(
        (q) => q.required && !isAnswered(q, answers[q.field])
      ),
    [answers]
  );

  const submitMutation = trpc.ailene.create.preAssessment.useMutation({
    onSuccess: () => {
      utils.ailene.read.preAssessment.mine.invalidate();
      toast.success("Pre-assessment berhasil dikirim.");
    },
    onError: (err) => {
      submittedRef.current = false;
      toast.error(err.message || "Gagal mengirim pre-assessment.");
    },
  });

  if (isLoading) {
    return (
      <PageContainerSVP className="flex min-h-screen justify-center">
        <AppLoadingComponents />
      </PageContainerSVP>
    );
  }
  if (isError || !data) {
    return (
      <PageContainerSVP className="flex min-h-screen justify-center">
        <AppErrorComponents />
      </PageContainerSVP>
    );
  }

  if (data.pre_assessment) {
    return <PreAssessmentCompletedAILN preAssessment={data.pre_assessment} />;
  }

  const handleSelectSingle = (code: string) => {
    setAnswers((prev) => ({ ...prev, [currentQ.field]: code }));
  };

  const handleToggleMulti = (label: string) => {
    setAnswers((prev) => {
      const cur = (prev[currentQ.field] as string[] | null) ?? [];
      const next = cur.includes(label)
        ? cur.filter((x) => x !== label)
        : [...cur, label];
      return { ...prev, [currentQ.field]: next };
    });
  };

  const handleTextChange = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQ.field]: value.length > 0 ? value : null,
    }));
  };

  const handlePrev = () => setCurrentIdx((i) => Math.max(0, i - 1));
  const handleNext = () =>
    setCurrentIdx((i) => Math.min(totalQuestions - 1, i + 1));

  const requestSubmit = () => {
    if (missingRequired.length > 0) {
      toast.error(
        `Masih ada ${missingRequired.length} pertanyaan wajib yang belum dijawab.`
      );
      setCurrentIdx(
        PRE_ASSESSMENT_QUESTIONS.findIndex(
          (q) => q.id === missingRequired[0].id
        )
      );
      return;
    }
    setIsSubmitDialogOpen(true);
  };

  const confirmSubmit = () => {
    if (submittedRef.current) return;
    setIsSubmitDialogOpen(false);
    submittedRef.current = true;

    const payload = {
      q1_ai_use_frequency: answers.q1_ai_use_frequency as
        | "NEVER"
        | "TRIED"
        | "WEEKLY"
        | "DAILY"
        | "INTENSIVE",
      q2_ai_tools_used: (answers.q2_ai_tools_used as string[]) ?? [],
      q3_job_role: (answers.q3_job_role as string) ?? "",
      q4_ai_understanding: answers.q4_ai_understanding as
        | "NONE"
        | "AWARE"
        | "BASIC"
        | "EXPLAIN"
        | "EXPERT",
      q5_ai_limitations: (answers.q5_ai_limitations as string[]) ?? [],
      q6_output_review: answers.q6_output_review as
        | "NO_CHECK"
        | "SOMETIMES"
        | "ALWAYS"
        | "CROSS_CHECK"
        | "NO_USE",
      q7_use_cases: (answers.q7_use_cases as string[]) ?? [],
      q8_team_adoption: answers.q8_team_adoption as
        | "NONE"
        | "PERSONAL"
        | "PILOT"
        | "POLICY"
        | "INTEGRATED",
      q9_concrete_example:
        (answers.q9_concrete_example as string | null) ?? null,
      q10_prompt_comfort: answers.q10_prompt_comfort as
        | "NONE"
        | "BASIC"
        | "DECENT"
        | "STRUCTURED"
        | "EXPERT",
      q11_safety_practices: (answers.q11_safety_practices as string[]) ?? [],
      q12_professional_attitude: answers.q12_professional_attitude as
        | "TOO_RISKY"
        | "CAUTIOUS"
        | "NEUTRAL"
        | "SUPPORTIVE"
        | "ESSENTIAL",
      q13_biggest_challenge: (answers.q13_biggest_challenge as string) ?? "",
      q14_training_expectation:
        (answers.q14_training_expectation as string) ?? "",
      q15_motivation: answers.q15_motivation as
        | "MANDATORY"
        | "CURIOUS"
        | "TENTATIVE"
        | "READY"
        | "EAGER",
    };

    submitMutation.mutate(payload);
  };

  const isLast = currentIdx === totalQuestions - 1;
  const progressPct = Math.round((answeredCount / totalQuestions) * 100);

  return (
    <PageContainerSVP className="flex min-h-screen justify-center">
      <div className="flex w-full flex-col gap-4 my-10">
        {/* Header */}
        <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 dark:border-dashboard-border dark:bg-card-bg dark:shadow-[0_0_18px_rgba(239,68,68,0.08)]">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1">
              <h1 className="text-base font-semibold dark:text-white">
                Pre-Assessment AI Readiness
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Bantu kami memahami posisi awalmu sebelum pelatihan. Jawaban
                kamu hanya disimpan satu kali — tidak bisa diubah setelah
                dikirim.
              </p>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-dashboard-border dark:text-gray-300">
              Soal {currentIdx + 1} / {totalQuestions}
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border dark:border-emerald-500/40">
              {answeredCount} / {totalQuestions} terjawab ({progressPct}%)
            </span>
          </div>
          <div className="flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full">
            {PRE_ASSESSMENT_QUESTIONS.map((q, idx) => {
              const ans = isAnswered(q, answers[q.field]);
              return (
                <div
                  key={idx}
                  className={`h-full flex-1 ${
                    ans
                      ? "bg-emerald-600 dark:bg-emerald-500 dark:shadow-[0_0_6px_rgba(16,185,129,0.6)]"
                      : "bg-gray-200 dark:bg-dashboard-border"
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Main body */}
        <div className="flex flex-1 gap-4">
          {/* Left: question */}
          <div className="flex flex-1 flex-col gap-4 rounded-xl border bg-white p-6 dark:border-dashboard-border dark:bg-card-bg dark:shadow-[0_0_18px_rgba(239,68,68,0.08)]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                SOAL {currentIdx + 1}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  PRE_ASSESSMENT_CATEGORY_COLORS[currentQ.category]
                }`}
              >
                {currentQ.category}
              </span>
              <span className="rounded-full border border-dashboard-border bg-gray-50 px-2.5 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-card-bg dark:text-gray-300">
                {PRE_ASSESSMENT_TYPE_LABELS[currentQ.type]}
              </span>
              {!currentQ.required && (
                <span className="rounded-full border border-dashboard-border bg-white px-2.5 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-card-bg dark:text-gray-400">
                  Opsional
                </span>
              )}
            </div>

            <p className="text-[17px] font-semibold leading-snug text-gray-900 dark:text-white">
              {currentQ.question}
              {currentQ.required && (
                <span className="ml-1 text-red-500 dark:text-red-400">*</span>
              )}
            </p>

            <QuestionBody
              question={currentQ}
              value={answers[currentQ.field]}
              onSelectSingle={handleSelectSingle}
              onToggleMulti={handleToggleMulti}
              onTextChange={handleTextChange}
            />

            <div className="mt-auto flex items-center justify-between border-t pt-4 dark:border-dashboard-border">
              <ButtonAILN
                variant="outline"
                onClick={handlePrev}
                disabled={currentIdx === 0}
              >
                <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
                Sebelumnya
              </ButtonAILN>
              <ButtonAILN
                variant={nextVariant}
                onClick={handleNext}
                disabled={isLast}
              >
                Berikutnya
                <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />
              </ButtonAILN>
            </div>
          </div>

          {/* Right: navigation panel */}
          <div className="flex w-80 shrink-0 flex-col gap-4">
            <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 dark:border-dashboard-border dark:bg-card-bg dark:shadow-[0_0_18px_rgba(239,68,68,0.08)]">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                NAVIGASI
              </span>
              <div className="grid grid-cols-5 gap-2">
                {PRE_ASSESSMENT_QUESTIONS.map((q, idx) => {
                  const isCurrent = idx === currentIdx;
                  const ans = isAnswered(q, answers[q.field]);

                  let cls = "";
                  if (isCurrent) {
                    cls =
                      "bg-red-500 text-white dark:shadow-[0_0_10px_rgba(239,68,68,0.7)]";
                  } else if (ans) {
                    cls =
                      "bg-black text-white dark:bg-red-500/20 dark:text-red-100 dark:border dark:border-red-500/40";
                  } else {
                    cls =
                      "border border-dashboard-border bg-gray-100 text-gray-500 dark:bg-card-inside-bg dark:text-gray-400";
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIdx(idx)}
                      className={`flex aspect-square items-center justify-center rounded-md text-xs font-semibold transition hover:opacity-80 ${cls}`}
                      title={q.question}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-col gap-1.5 border-t pt-3 text-xs text-gray-600 dark:border-dashboard-border dark:text-gray-400">
                <LegendItem
                  color="bg-black dark:bg-red-500/20 dark:border dark:border-red-500/40"
                  label="Terjawab"
                />
                <LegendItem
                  color="bg-red-500 dark:shadow-[0_0_6px_rgba(239,68,68,0.6)]"
                  label="Saat ini"
                />
                <LegendItem
                  color="bg-gray-100 border border-dashboard-border dark:bg-card-inside-bg"
                  label="Belum"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 rounded-xl border bg-white p-4 dark:border-dashboard-border dark:bg-card-bg dark:shadow-[0_0_18px_rgba(239,68,68,0.08)]">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                STATUS
              </span>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Terjawab
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {answeredCount} / {totalQuestions}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Wajib belum diisi
                </span>
                <span
                  className={`font-semibold ${
                    missingRequired.length === 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {missingRequired.length}
                </span>
              </div>
            </div>

            <ButtonAILN
              variant="primary"
              onClick={requestSubmit}
              disabled={submitMutation.isPending}
              className="w-full"
            >
              {submitMutation.isPending ? "Mengirim..." : "Kirim Jawaban"}
            </ButtonAILN>
          </div>
        </div>
      </div>

      <AlertConfirmDialogAILN
        isOpen={isSubmitDialogOpen}
        alertDialogHeader="Kirim pre-assessment sekarang?"
        alertDialogMessage="Jawaban hanya bisa dikirim satu kali dan tidak bisa diubah setelahnya. Pastikan semua jawabanmu sudah sesuai."
        alertCancelLabel="Periksa lagi"
        alertConfirmLabel="Kirim sekarang"
        onClose={() => setIsSubmitDialogOpen(false)}
        onConfirm={confirmSubmit}
      />
    </PageContainerSVP>
  );
}

function QuestionBody({
  question,
  value,
  onSelectSingle,
  onToggleMulti,
  onTextChange,
}: {
  question: PreAssessmentQuestion;
  value: AnswerValue;
  onSelectSingle: (code: string) => void;
  onToggleMulti: (label: string) => void;
  onTextChange: (value: string) => void;
}) {
  if (question.type === "single") {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Pilih satu jawaban yang paling tepat.
        </p>
        {question.options.map((opt, idx) => {
          const code = question.valueCodes[idx];
          const selected = value === code;
          return (
            <button
              key={code}
              type="button"
              onClick={() => onSelectSingle(code)}
              className={`flex items-center gap-3 rounded-lg border-[1.5px] px-4 py-3 text-left text-sm transition ${
                selected
                  ? "border-emerald-500 bg-emerald-50 dark:border-emerald-500/60 dark:bg-emerald-500/10 dark:text-white dark:shadow-[0_0_10px_rgba(16,185,129,0.25)]"
                  : "border-dashboard-border bg-white hover:border-black/30 hover:bg-gray-50 dark:bg-card-bg dark:text-gray-200 dark:hover:border-red-500/30 dark:hover:bg-card-inside-bg"
              }`}
            >
              <div
                className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  selected
                    ? "bg-emerald-500 text-white dark:shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                    : "bg-gray-200 text-gray-700 dark:bg-dashboard-border dark:text-gray-300"
                }`}
              >
                {String.fromCharCode(65 + idx)}
              </div>
              <span className="flex-1">{opt}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === "multi") {
    const arr = (value as string[] | null) ?? [];
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Pilih semua jawaban yang sesuai (boleh lebih dari satu).
        </p>
        {question.options.map((opt) => {
          const selected = arr.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggleMulti(opt)}
              className={`flex items-center gap-3 rounded-lg border-[1.5px] px-4 py-3 text-left text-sm transition ${
                selected
                  ? "border-emerald-500 bg-emerald-50 dark:border-emerald-500/60 dark:bg-emerald-500/10 dark:text-white dark:shadow-[0_0_10px_rgba(16,185,129,0.25)]"
                  : "border-dashboard-border bg-white hover:border-black/30 hover:bg-gray-50 dark:bg-card-bg dark:text-gray-200 dark:hover:border-red-500/30 dark:hover:bg-card-inside-bg"
              }`}
            >
              <div
                className={`flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                  selected
                    ? "bg-emerald-500 text-white dark:shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                    : "border border-gray-300 bg-white text-gray-700 dark:border-dashboard-border dark:bg-card-bg dark:text-gray-300"
                }`}
              >
                {selected ? "✓" : ""}
              </div>
              <span className="flex-1">{opt}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === "short") {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Tuliskan jawaban singkat.
        </p>
        <input
          type="text"
          value={(value as string | null) ?? ""}
          onChange={(e) => onTextChange(e.target.value)}
          maxLength={255}
          placeholder={question.placeholder}
          className="w-full rounded-lg border border-dashboard-border px-4 py-3 text-sm transition focus:border-emerald-500 focus:outline-none dark:bg-card-bg dark:text-white dark:placeholder:text-gray-500 dark:focus:border-emerald-500/60 dark:focus:shadow-[0_0_10px_rgba(16,185,129,0.2)]"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Tuliskan jawabanmu dengan lebih lengkap.
      </p>
      <textarea
        value={(value as string | null) ?? ""}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder={question.placeholder}
        rows={6}
        className="w-full resize-none rounded-lg border border-dashboard-border px-4 py-3 text-sm transition focus:border-emerald-500 focus:outline-none dark:bg-card-bg dark:text-white dark:placeholder:text-gray-500 dark:focus:border-emerald-500/60 dark:focus:shadow-[0_0_10px_rgba(16,185,129,0.2)]"
      />
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`size-3 rounded ${color}`} />
      <span>{label}</span>
    </div>
  );
}

function PreAssessmentCompletedAILN({
  preAssessment,
}: {
  preAssessment: PreAssessmentResultData;
}) {
  const router = useRouter();
  const userQ = trpc.auth.checkSession.useQuery();
  const firstName = userQ.data?.user?.full_name?.split(" ")[0] ?? "teman";
  const result = useMemo(
    () => buildPreAssessmentResult(preAssessment),
    [preAssessment]
  );

  return (
    <PageContainerSVP className="flex min-h-screen justify-center">
      <div className="flex w-full flex-col gap-6 py-8 lg:py-12">
        <div className="flex items-center justify-between border-b border-emerald-600 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-black text-sm font-bold text-white">
              A
            </div>
            <div className="text-base font-bold text-gray-900 dark:text-white">
              Atlas LMS
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300">
              <span className="size-2 rounded-full bg-emerald-600" />
              Pre-Assessment selesai
            </span>
          </div>
          <div className="hidden items-center gap-4 text-sm text-gray-500 dark:text-gray-400 md:flex">
            <span>Langkah 3 / 3</span>
            <span className="h-5 w-px bg-gray-200 dark:bg-dashboard-border" />
            <span>Tersimpan - baru saja</span>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              Onboarding - selesai
            </div>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-gray-900 dark:text-white md:text-4xl">
              Ini titik berangkat kamu, {firstName}.
            </h1>
            <p className="mt-4 max-w-4xl text-base leading-7 text-gray-600 dark:text-gray-300">
              Pre-assessment bukan ujian dan <b>bukan nilai</b> - ini cermin di
              mana kamu sekarang di tiap pillar. Kami pakai untuk menyusun fokus
              belajar yang pas buatmu. Kamu bisa lihat lagi perkembangannya
              kapan saja di <b>Progress Saya</b>.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,1fr)]">
            <section className="rounded-lg border border-dashboard-border bg-white p-6 shadow-sm dark:bg-card-bg">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Kesiapan kamu per pillar
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Self-rating - skala 0-5 - 6 dimensi
                  </p>
                </div>
                <span className="rounded-full border border-dashboard-border bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-card-inside-bg dark:text-gray-300">
                  Titik berangkat
                </span>
              </div>

              <PreAssessmentRadar dimensions={result.dimensions} />

              <div className="mx-auto mt-4 flex w-fit items-center gap-3 rounded-full border border-dashboard-border bg-gray-50 px-5 py-3 dark:bg-card-inside-bg">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Kesiapan rata-rata
                </span>
                <span className="font-geist-mono text-2xl font-bold text-gray-900 dark:text-white">
                  {formatScore(result.average)}
                </span>
                <span className="text-gray-400">/ 5</span>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-4">
              <InsightCard
                icon={<Check className="size-5" />}
                label="Paling siap"
                title={result.strongest.label}
                value={result.strongest.score}
                description={result.strongest.description}
                tone="green"
              />
              <InsightCard
                icon={<Sparkles className="size-5" />}
                label="Fokus pertama kamu"
                title={result.focus.label}
                value={result.focus.score}
                description={result.focus.description}
                tone="amber"
              />
              <section className="rounded-lg border border-dashboard-border bg-white p-6 shadow-sm dark:bg-card-bg">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  Pemahaman dasar AI
                </div>
                <div className="mt-5 flex items-end gap-3">
                  <span className="font-geist-mono text-4xl font-bold text-gray-900 dark:text-white">
                    {result.literacyScore}
                  </span>
                  <span className="pb-1 text-lg text-gray-500 dark:text-gray-400">
                    / 15 paham
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  Dari kuis literasi singkat. Ini konteks awal, bukan skor
                  kelulusan - semua materi tetap kamu pelajari dari awal.
                </p>
              </section>
            </div>
          </div>

          <section className="rounded-lg border border-dashboard-border bg-white p-6 shadow-sm dark:bg-card-bg">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Yang kamu tulis sendiri
            </h2>
            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              <QuoteBlock
                label="Yang ingin kamu capai"
                text={preAssessment.q14_training_expectation}
              />
              <QuoteBlock
                label="Tantangan yang kamu rasa"
                text={preAssessment.q13_biggest_challenge}
              />
            </div>
            <p className="mt-5 text-sm text-gray-400 dark:text-gray-500">
              Tujuan ini kami simpan - nanti kami tunjukkan lagi di akhir
              program untuk lihat seberapa jauh kamu sampai.
            </p>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Mulai dari sini
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Disusun dari fokus pillar + kebutuhan yang kamu pilih
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {result.recommendations.map((item, index) => (
                <RecommendationRow
                  key={item.code}
                  item={item}
                  primary={index === 0}
                  onClick={() => router.push(item.href)}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </PageContainerSVP>
  );
}

function PreAssessmentRadar({
  dimensions,
}: {
  dimensions: ResultDimension[];
}) {
  const center = 150;
  const radius = 100;
  const points = dimensions.map((dimension, index) => {
    const angle = -Math.PI / 2 + (index / dimensions.length) * Math.PI * 2;
    const axisX = center + Math.cos(angle) * radius;
    const axisY = center + Math.sin(angle) * radius;
    const valueRadius = (dimension.score / 5) * radius;
    return {
      ...dimension,
      axis: `${axisX},${axisY}`,
      value: `${center + Math.cos(angle) * valueRadius},${center + Math.sin(angle) * valueRadius}`,
      labelX: center + Math.cos(angle) * (radius + 45),
      labelY: center + Math.sin(angle) * (radius + 45),
    };
  });
  const rings = [0.25, 0.5, 0.75, 1].map((scale) =>
    dimensions
      .map((_, index) => {
        const angle = -Math.PI / 2 + (index / dimensions.length) * Math.PI * 2;
        return `${center + Math.cos(angle) * radius * scale},${center + Math.sin(angle) * radius * scale}`;
      })
      .join(" ")
  );

  return (
    <div className="mt-6 flex justify-center overflow-hidden">
      <svg viewBox="0 0 300 300" className="h-[360px] w-full max-w-[540px]">
        {rings.map((ring) => (
          <polygon
            key={ring}
            points={ring}
            fill="none"
            stroke="rgba(148,163,184,0.28)"
            strokeWidth="1"
          />
        ))}
        {points.map((point) => (
          <line
            key={point.axis}
            x1={center}
            y1={center}
            x2={point.axis.split(",")[0]}
            y2={point.axis.split(",")[1]}
            stroke="rgba(148,163,184,0.2)"
            strokeWidth="1"
          />
        ))}
        <polygon
          points={points.map((point) => point.value).join(" ")}
          fill="rgba(16,113,88,0.16)"
          stroke="#00785f"
          strokeWidth="3"
        />
        {points.map((point) => (
          <circle
            key={point.key}
            cx={point.value.split(",")[0]}
            cy={point.value.split(",")[1]}
            r="5"
            fill="white"
            stroke="#00785f"
            strokeWidth="3"
          />
        ))}
        {points.map((point) => (
          <g key={`${point.key}-label`}>
            <text
              x={point.labelX}
              y={point.labelY}
              textAnchor={point.labelX < center - 10 ? "end" : point.labelX > center + 10 ? "start" : "middle"}
              className="fill-gray-700 text-[11px] font-semibold dark:fill-gray-200"
            >
              {point.shortLabel}
            </text>
            <text
              x={point.labelX}
              y={point.labelY + 15}
              textAnchor={point.labelX < center - 10 ? "end" : point.labelX > center + 10 ? "start" : "middle"}
              className="fill-gray-400 text-[10px] dark:fill-gray-500"
            >
              {formatScore(point.score)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function InsightCard({
  icon,
  label,
  title,
  value,
  description,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  value: number;
  description: string;
  tone: "green" | "amber";
}) {
  const toneCls =
    tone === "green"
      ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300"
      : "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300";

  return (
    <section className="flex items-center gap-4 rounded-lg border border-dashboard-border bg-white p-6 shadow-sm dark:bg-card-bg">
      <div
        className={`flex size-11 shrink-0 items-center justify-center rounded-lg border ${toneCls}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
          {label}
        </div>
        <div className="mt-1 flex flex-wrap items-baseline gap-2">
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            {title}
          </span>
          <span
            className={`font-geist-mono text-2xl font-bold ${
              tone === "green"
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-amber-700 dark:text-amber-300"
            }`}
          >
            {formatScore(value)}
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
    </section>
  );
}

function QuoteBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="border-l-4 border-emerald-700 pl-5">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
        {label}
      </div>
      <p className="mt-3 text-lg italic leading-7 text-gray-900 dark:text-white">
        &ldquo;{text}&rdquo;
      </p>
    </div>
  );
}

function RecommendationRow({
  item,
  primary,
  onClick,
}: {
  item: RecommendationItem;
  primary: boolean;
  onClick: () => void;
}) {
  return (
    <div className="grid grid-cols-[3.5rem_minmax(0,1fr)_4rem_6rem] items-center gap-4 rounded-lg border border-dashboard-border bg-white p-4 shadow-sm dark:bg-card-bg">
      <div
        className={`flex size-11 items-center justify-center rounded-lg border font-geist-mono text-sm font-bold ${
          primary
            ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
            : "border-dashboard-border bg-gray-50 text-gray-700 dark:bg-card-inside-bg dark:text-gray-200"
        }`}
      >
        {item.code}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <BookOpen className="size-4 text-gray-500" />
          <h3 className="truncate text-lg font-bold text-gray-900 dark:text-white">
            {item.title}
          </h3>
          <span className="rounded-full border border-dashboard-border bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-card-inside-bg dark:text-gray-300">
            {item.pillar}
          </span>
        </div>
        <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
          {item.description}
        </p>
      </div>
      <span className="text-right text-sm text-gray-400">{item.duration}</span>
      <ButtonAILN
        variant={primary ? "secondary" : "outline"}
        size="medium"
        onClick={onClick}
      >
        {primary ? "Mulai" : "Lihat"}
        <ArrowRight className="size-4" />
      </ButtonAILN>
    </div>
  );
}

type ResultDimension = {
  key: string;
  label: string;
  shortLabel: string;
  score: number;
  description: string;
};

type RecommendationItem = {
  code: string;
  title: string;
  pillar: string;
  description: string;
  duration: string;
  href: string;
};

function buildPreAssessmentResult(preAssessment: PreAssessmentResultData) {
  const scoreMap = {
    frequency: { NEVER: 0.6, TRIED: 1.5, WEEKLY: 2.6, DAILY: 3.8, INTENSIVE: 4.6 },
    understanding: { NONE: 0.5, AWARE: 1.5, BASIC: 3, EXPLAIN: 4, EXPERT: 5 },
    review: { NO_CHECK: 0.6, SOMETIMES: 2, ALWAYS: 3.6, CROSS_CHECK: 4.6, NO_USE: 1 },
    adoption: { NONE: 0.6, PERSONAL: 1.7, PILOT: 2.8, POLICY: 4, INTEGRATED: 5 },
    prompt: { NONE: 0.7, BASIC: 1.8, DECENT: 3, STRUCTURED: 4.2, EXPERT: 5 },
    attitude: { TOO_RISKY: 1, CAUTIOUS: 2.4, NEUTRAL: 3, SUPPORTIVE: 4.2, ESSENTIAL: 5 },
    motivation: { MANDATORY: 1, CURIOUS: 2.2, TENTATIVE: 3, READY: 4.2, EAGER: 5 },
  } as const;

  const toolCount = preAssessment.q2_ai_tools_used.filter(
    (tool) => tool !== "Belum pernah menggunakan satupun"
  ).length;
  const safetyCount = preAssessment.q11_safety_practices.filter(
    (practice) => practice !== "Saya belum memikirkan aspek keamanan ini"
  ).length;
  const useCaseCount = preAssessment.q7_use_cases.length;
  const limitationCount = preAssessment.q5_ai_limitations.filter(
    (item) => item !== "Saya belum tahu keterbatasan spesifiknya"
  ).length;

  const dimensions: ResultDimension[] = [
    {
      key: "foundations",
      label: "AI Foundations",
      shortLabel: "Foundations",
      score: avg([
        scoreMap.understanding[preAssessment.q4_ai_understanding],
        scoreMap.review[preAssessment.q6_output_review],
      ]),
      description: "Pemahaman konsep dan kebiasaan review output.",
    },
    {
      key: "prompting",
      label: "Prompting",
      shortLabel: "Prompting",
      score: scoreMap.prompt[preAssessment.q10_prompt_comfort],
      description: "Kenyamanan memberi instruksi ke AI.",
    },
    {
      key: "workplace",
      label: "Workplace Use",
      shortLabel: "Workplace",
      score: avg([
        scoreMap.frequency[preAssessment.q1_ai_use_frequency],
        scoreMap.adoption[preAssessment.q8_team_adoption],
        Math.min(5, useCaseCount * 0.65),
      ]),
      description: "Aplikasi nyata di kerjaan harian.",
    },
    {
      key: "tooling",
      label: "Tooling",
      shortLabel: "Tooling",
      score: Math.min(5, toolCount * 0.85),
      description: "Eksplorasi dan pilihan tools AI.",
    },
    {
      key: "ethics",
      label: "Ethics & Safety",
      shortLabel: "Ethics & Safety",
      score: avg([
        Math.min(5, safetyCount),
        scoreMap.attitude[preAssessment.q12_professional_attitude],
      ]),
      description: "Keamanan, etika, dan verifikasi output.",
    },
    {
      key: "mindset",
      label: "Mindset",
      shortLabel: "Mindset",
      score: avg([
        scoreMap.motivation[preAssessment.q15_motivation],
        scoreMap.attitude[preAssessment.q12_professional_attitude],
      ]),
      description: "Kesiapan mencoba dan menerapkan AI.",
    },
  ].map((dimension) => ({
    ...dimension,
    score: round1(dimension.score),
  }));

  const strongest = [...dimensions].sort((a, b) => b.score - a.score)[0];
  const focus = [...dimensions].sort((a, b) => a.score - b.score)[0];
  const average = round1(avg(dimensions.map((dimension) => dimension.score)));
  const literacyScore = Math.min(
    15,
    Math.round(
      scoreMap.understanding[preAssessment.q4_ai_understanding] +
        Math.min(5, limitationCount) +
        scoreMap.review[preAssessment.q6_output_review]
    )
  );

  return {
    dimensions,
    strongest,
    focus,
    average,
    literacyScore,
    recommendations: buildRecommendations(focus, preAssessment),
  };
}

function buildRecommendations(
  focus: ResultDimension,
  preAssessment: PreAssessmentResultData
): RecommendationItem[] {
  const map: Record<string, RecommendationItem> = {
    ethics: {
      code: "ES-1",
      title: "Keamanan data & menghindari hallucination",
      pillar: "Ethics & Safety",
      description: "Dari pillar paling perlu dikuatkan: Ethics & Safety",
      duration: "18 mnt",
      href: "/student/modules",
    },
    prompting: {
      code: "PR-2",
      title: "Prompting untuk email & dokumen kerja",
      pillar: "Prompting",
      description: "Cocok dengan kebutuhan: menulis email & laporan",
      duration: "22 mnt",
      href: "/student/modules",
    },
    workplace: {
      code: "WU-1",
      title: "Meringkas konten panjang jadi 1 halaman",
      pillar: "Workplace Use",
      description: "Cocok dengan kebutuhan: meringkas notulen & laporan",
      duration: "14 mnt",
      href: "/student/modules",
    },
    foundations: {
      code: "AF-1",
      title: "Dasar cara kerja AI tanpa jargon",
      pillar: "AI Foundations",
      description: "Mulai dari konsep dasar, limitasi, dan cara memakai output.",
      duration: "16 mnt",
      href: "/student/modules",
    },
    tooling: {
      code: "TL-1",
      title: "Memilih tools AI yang tepat untuk pekerjaan",
      pillar: "Tooling",
      description: "Bantu pilih tools sesuai kebutuhan dan risiko data.",
      duration: "20 mnt",
      href: "/student/modules",
    },
    mindset: {
      code: "MS-1",
      title: "Membangun kebiasaan eksperimen AI mingguan",
      pillar: "Mindset",
      description: "Mulai kecil, ukur dampak, lalu ulangi di workflow nyata.",
      duration: "12 mnt",
      href: "/student/modules",
    },
  };

  const byUseCase = preAssessment.q7_use_cases.includes(
    "Meringkas konten panjang (artikel, notulen, laporan)"
  )
    ? map.workplace
    : map.prompting;
  const ordered = [map[focus.key], byUseCase, map.ethics, map.foundations];
  const seen = new Set<string>();
  return ordered.filter((item) => {
    if (seen.has(item.code)) return false;
    seen.add(item.code);
    return true;
  }).slice(0, 3);
}

function avg(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function formatScore(value: number) {
  return value.toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
