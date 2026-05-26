"use client";
import { trpc } from "@/trpc/client";
import { Star } from "lucide-react";

function formatTimeSaved(
  hoursSaved: number | null,
  hoursWithoutAi: number | null
): string | null {
  if (hoursSaved === null || hoursWithoutAi === null) return null;
  const savedHours = hoursWithoutAi - hoursSaved;
  if (!Number.isFinite(savedHours) || savedHours <= 0) return null;
  if (savedHours < 1) {
    const m = Math.round(savedHours * 60);
    return `+${m} menit`;
  }
  const integer = savedHours % 1 === 0;
  return `+${integer ? savedHours.toFixed(0) : savedHours.toFixed(1)} jam`;
}

export default function FirstWinCardAILN() {
  const q = trpc.ailene.read.firstWin.useQuery();

  if (q.isLoading || !q.data?.first_win) return null;
  const fw = q.data.first_win;

  let badge: string;
  let headline: React.ReactNode;
  let description: React.ReactNode;

  if (fw.kind === "use_case") {
    const hoursSaved =
      fw.hours_saved !== null && fw.hours_saved !== undefined
        ? Number(fw.hours_saved)
        : null;
    const hoursWithoutAi =
      fw.hours_without_ai !== null && fw.hours_without_ai !== undefined
        ? Number(fw.hours_without_ai)
        : null;
    const timeSaved = formatTimeSaved(hoursSaved, hoursWithoutAi);

    badge = "USE CASE PERTAMA TERCATAT";
    headline = timeSaved ? (
      <>
        <span className="text-amber-600 dark:text-amber-400">{timeSaved}</span>
        <span className="text-foreground dark:text-white"> dihemat </span>
        <span aria-hidden>🎉</span>
      </>
    ) : (
      <span className="text-foreground dark:text-white">
        Use case pertama tercatat <span aria-hidden>🎉</span>
      </span>
    );
    description = (
      <>
        Use case pertama Anda{" "}
        <strong className="font-semibold text-foreground dark:text-white">
          &ldquo;{fw.name}&rdquo;
        </strong>{" "}
        sudah tercatat. Menunggu konfirmasi kualitas output dari Champion.
      </>
    );
  } else {
    badge = "PROMPT PERTAMA TERCATAT";
    headline = (
      <span className="text-foreground dark:text-white">
        Prompt pertama tercatat <span aria-hidden>🎉</span>
      </span>
    );
    description = (
      <>
        Prompt pertama Anda{" "}
        <strong className="font-semibold text-foreground dark:text-white">
          &ldquo;{fw.name}&rdquo;
        </strong>{" "}
        sudah dikirim ke Champion. Tunggu konfirmasi kualitas output.
      </>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-amber-200/70 bg-gradient-to-br from-white via-amber-50 to-amber-100 px-6 py-5 dark:border-amber-500/30 dark:from-amber-500/5 dark:via-amber-500/10 dark:to-yellow-500/15">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
        <Star className="size-3.5" fill="currentColor" />
        {badge}
      </div>
      <h2 className="mt-2 text-3xl font-bold leading-tight md:text-4xl">
        {headline}
      </h2>
      <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
        {description}
      </p>
    </div>
  );
}
