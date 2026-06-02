"use client";
import { trpc } from "@/trpc/client";
import { FileText, Sparkles } from "lucide-react";
import Link from "next/link";

type RecItem = {
  id: number;
  kind: "use_case" | "prompt";
  title: string;
  description: string;
  category: string | null;
};

// Data contoh — strukturnya niru katalog (AilUseCase/AilPrompt: kind, kategori,
// judul, deskripsi). Dipakai sampai katalog asli terisi.
const SAMPLE_RECS: RecItem[] = [
  {
    id: -1,
    kind: "prompt",
    title: "Generator caption Instagram",
    description:
      "Pakai ChatGPT untuk bikin 10 caption Instagram sesuai brand voice dalam 5 menit.",
    category: "Content Creation",
  },
  {
    id: -2,
    kind: "use_case",
    title: "Analisis kompetitor via NotebookLM",
    description:
      "Upload materi kompetitor ke NotebookLM, dapatkan positioning analysis ringkas.",
    category: "Research",
  },
  {
    id: -3,
    kind: "use_case",
    title: "Analyzer performa campaign",
    description:
      "Analisis data campaign + hasilkan rekomendasi peningkatan otomatis.",
    category: "Data Analysis",
  },
  {
    id: -4,
    kind: "prompt",
    title: "Ringkas meeting jadi action items",
    description:
      "Ubah transkrip meeting jadi keputusan + action item dengan PIC & tenggat.",
    category: "Communication",
  },
  {
    id: -5,
    kind: "use_case",
    title: "Draf balasan email klien",
    description:
      "Susun balasan email follow-up klien yang sopan dan to-the-point.",
    category: "Communication",
  },
  {
    id: -6,
    kind: "prompt",
    title: "Riset tren industri 30 menit",
    description:
      "Kumpulkan tren & insight industri terbaru beserta sumbernya secara cepat.",
    category: "Research",
  },
];

export default function RecommendationsAILN() {
  const q = trpc.ailene.read.recommendations.useQuery();

  if (q.isLoading) {
    return (
      <Shell>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-lg bg-gray-100 dark:bg-dashboard-border"
            />
          ))}
        </div>
      </Shell>
    );
  }

  const real = q.data?.items ?? [];
  const isSample = real.length === 0;
  const items = isSample ? SAMPLE_RECS : real;
  const levelNumber = q.data?.level_number ?? 0;
  const department = q.data?.department ?? null;

  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground dark:text-white">
              Rekomendasi untuk Kamu
            </h2>
            {isSample && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-dashboard-border dark:text-gray-400">
                data contoh
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Use case &amp; prompt mandiri sesuai level L{levelNumber}
            {department ? ` · ${department}` : ""}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {items.map((it) => (
          <RecCard key={`${it.kind}-${it.id}`} item={it} levelNumber={levelNumber} />
        ))}
      </div>
    </Shell>
  );
}

function RecCard({
  item,
  levelNumber,
}: {
  item: RecItem;
  levelNumber: number;
}) {
  const isPrompt = item.kind === "prompt";
  const isSample = item.id < 0; // SAMPLE_RECS pakai id negatif → belum ada di katalog
  const href = isSample
    ? isPrompt
      ? "/student/practice"
      : "/student/modules"
    : isPrompt
      ? `/student/practice/prompts/${item.id}`
      : `/student/practice/use-cases/${item.id}`;
  const Icon = isPrompt ? Sparkles : FileText;

  return (
    <Link
      href={href}
      className="group flex flex-col rounded-lg border border-dashboard-border bg-gray-50/50 p-4 transition hover:border-red-300 hover:bg-white dark:bg-card-inside-bg dark:hover:border-red-500/40"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white text-red-500 shadow-sm dark:bg-card-bg dark:text-red-400">
          <Icon className="size-4" />
        </span>
        {item.category && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:bg-dashboard-border dark:text-gray-400">
            {item.category}
          </span>
        )}
      </div>

      <h3 className="mt-3 text-sm font-semibold leading-snug text-foreground dark:text-white">
        {item.title}
      </h3>
      <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
        {item.description}
      </p>

      <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500">
        <span>
          Level {levelNumber} · {isPrompt ? "Prompt practice" : "Use case"}
        </span>
        <span className="font-medium text-red-600 group-hover:underline dark:text-red-400">
          Mulai →
        </span>
      </div>
    </Link>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashboard-border bg-white p-5 dark:bg-card-bg">
      {children}
    </div>
  );
}
