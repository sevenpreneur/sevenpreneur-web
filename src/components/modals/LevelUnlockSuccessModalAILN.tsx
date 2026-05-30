"use client";
import { Check, FileText, Library, Send, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";

export type LevelUnlockSuccessData = {
  member_name: string;
  group_name: string | null;
  completed_at: string | Date;
  previous_level: {
    level_number: number;
    name: string;
  };
  unlocked_level: {
    level_number: number;
    name: string;
  };
  final_quiz_score: number;
  quiz_threshold: number;
  modules_done: number;
  modules_total: number;
  elapsed_days: number;
  cohort_avg_days: number;
};

interface LevelUnlockSuccessModalAILNProps {
  isOpen: boolean;
  data: LevelUnlockSuccessData | null;
  onClose: () => void;
}

export default function LevelUnlockSuccessModalAILN({
  isOpen,
  data,
  onClose,
}: LevelUnlockSuccessModalAILNProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen || !data) return null;

  const completedDate = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(data.completed_at));

  const previousLabel = `Level ${data.previous_level.level_number} ${data.previous_level.name}`;
  const unlockedLabel = `Level ${data.unlocked_level.level_number} ${data.unlocked_level.name}`;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-white/80 px-4 py-8 backdrop-blur-md dark:bg-black/80"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-4xl flex-col gap-5 rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/5 dark:bg-card-bg dark:ring-dashboard-border md:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full px-3 py-1 text-sm font-semibold text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-card-inside-bg dark:hover:text-white"
        >
          Tutup
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-[0_18px_40px_rgba(16,113,88,0.35)]">
            <Check className="size-9" strokeWidth={3} />
          </div>
          <div className="mt-5 text-[11px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
            Level {data.previous_level.level_number} - selesai
          </div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Anda lulus{" "}
            <span className="text-emerald-700 dark:text-emerald-300">
              {previousLabel}
            </span>
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
            {data.member_name}
            {data.group_name ? ` - ${data.group_name}` : ""} - diselesaikan{" "}
            {completedDate}. First win - fondasi AI dasar Anda sudah terpasang.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <ScoreCard
            label="Skor quiz akhir"
            value={`${data.final_quiz_score}`}
            unit="/ 100"
            sub={`Lulus - ambang ${data.quiz_threshold}`}
          />
          <ScoreCard
            label="Modul selesai"
            value={`${data.modules_done}`}
            unit={`/ ${data.modules_total}`}
            sub={`100% ${previousLabel}`}
          />
          <ScoreCard
            label="Waktu tempuh"
            value={`${data.elapsed_days}`}
            unit="hari"
            sub={`Cohort avg ${data.cohort_avg_days} hari`}
          />
        </div>

        <section className="overflow-hidden rounded-lg border border-dashboard-border bg-white dark:bg-card-bg">
          <div className="border-b border-dashboard-border px-5 py-4 text-base font-bold text-gray-900 dark:text-white">
            Yang baru Anda buka
          </div>
          <UnlockedRow
            icon={<FileText className="size-4" />}
            title={`Modul ${unlockedLabel}`}
            description="8 modul baru - workflow nyata di pekerjaan Anda"
          />
          <UnlockedRow
            icon={<Send className="size-4" />}
            title="Submit Pekerjaan"
            description="Kirim prompt & use case ke Champion untuk di-review"
          />
          <UnlockedRow
            icon={<Library className="size-4" />}
            title="Prompt Vault tim"
            description="Akses prompt terkurasi dari Champion dan tim"
          />
        </section>
        {/* 
        <section className="grid grid-cols-1 overflow-hidden rounded-lg border border-dashboard-border bg-white dark:bg-card-bg md:grid-cols-[12rem_1fr]">
          <div className="flex items-center justify-center border-b border-dashboard-border bg-gray-50 p-5 dark:bg-card-inside-bg md:border-b-0 md:border-r">
            <div className="flex h-28 w-36 flex-col items-center justify-center rounded-sm border border-dashboard-border bg-white text-center shadow-sm dark:bg-card-bg">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Sertifikat
              </div>
              <div className="mt-2 text-sm font-bold text-gray-900 dark:text-white">
                {previousLabel}
              </div>
              <div className="mt-3 text-[10px] text-gray-400">
                Atlas LMS
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center p-5">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Sertifikat {previousLabel}
            </h3>
            <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
              Bukti formal kelulusan level - bisa diunduh PDF atau dibagikan ke
              profil internal.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ButtonAILN variant="light" size="medium">
                <Download className="size-4" />
                Unduh PDF
              </ButtonAILN>
              <ButtonAILN variant="outline" size="medium">
                <ArrowRight className="size-4" />
                Bagikan
              </ButtonAILN>
            </div>
          </div>
        </section> */}
      </div>
    </div>
  );
}

function ScoreCard({
  label,
  value,
  unit,
  sub,
}: {
  label: string;
  value: string;
  unit: string;
  sub: string;
}) {
  return (
    <div className="rounded-lg border border-dashboard-border bg-white p-5 shadow-sm dark:bg-card-bg">
      <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
        {label}
      </div>
      <div className="mt-4 flex items-end gap-2">
        <span className="font-geist-mono text-4xl font-bold leading-none text-gray-900 dark:text-white">
          {value}
        </span>
        <span className="pb-1 text-sm font-semibold text-gray-500">{unit}</span>
      </div>
      <div className="mt-3 text-xs text-gray-400">{sub}</div>
    </div>
  );
}

function UnlockedRow({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_4rem] items-center gap-3 border-b border-dashboard-border px-5 py-4 last:border-b-0">
      <div className="flex size-9 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-bold text-gray-900 dark:text-white">
          {title}
        </div>
        <div className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
          {description}
        </div>
      </div>
      <span className="inline-flex items-center justify-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300">
        <Sparkles className="size-3" />
        Aktif
      </span>
    </div>
  );
}
