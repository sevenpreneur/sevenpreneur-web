"use client";
import ButtonAILN from "@/components/buttons/ButtonAILN";
import AlertConfirmDialogAILN from "@/components/modals/AlertConfirmDialogAILN";
import { trpc } from "@/trpc/client";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type FocusKind =
  | "Quiz"
  | "Video"
  | "Material"
  | "PromptPractice"
  | "UseCasePractice";

function labelForKind(kind: FocusKind) {
  if (kind === "Quiz") return "Quiz";
  if (kind === "Video") return "Recording";
  if (kind === "PromptPractice") return "Prompt Practice";
  if (kind === "UseCasePractice") return "Use Case Practice";
  return "Materi";
}

function headlineForFocus(focus: {
  kind: FocusKind;
  task_title: string;
  chapter_name: string | null;
}) {
  if (focus.kind === "PromptPractice" || focus.kind === "UseCasePractice") {
    return (
      <>
        Kerjakan {labelForKind(focus.kind).toLowerCase()}{" "}
        <span className="rounded px-1 text-red-600 dark:text-red-400 dark:drop-shadow-[0_0_4px_rgba(239,68,68,0.6)]">
          {focus.task_title}
        </span>
        {focus.chapter_name ? ` di ${focus.chapter_name}.` : "."}
      </>
    );
  }

  return (
    <>
      Selesaikan {labelForKind(focus.kind).toLowerCase()}{" "}
      <span className="rounded px-1 text-red-600 dark:text-red-400 dark:drop-shadow-[0_0_4px_rgba(239,68,68,0.6)]">
        {focus.task_title}
      </span>{" "}
      di Chapter {focus.chapter_name}.
    </>
  );
}

export default function TodayFocusCardAILN() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
  const q = trpc.ailene.read.todayFocus.useQuery();

  const completeVideo = trpc.ailene.create.completeVideo.useMutation({
    onSuccess: () => {
      utils.ailene.read.todayFocus.invalidate();
      utils.ailene.list.tasks.invalidate();
      utils.auth.checkAilMember.invalidate();
    },
  });

  if (q.isLoading) {
    return (
      <CardShell title="● FOKUS HARI INI">
        <CardLoading />
      </CardShell>
    );
  }
  if (q.error || !q.data) {
    return (
      <CardShell title="● FOKUS HARI INI">
        <CardError />
      </CardShell>
    );
  }

  const focus = q.data.focus;

  const detailHref = focus
    ? focus.kind === "PromptPractice" || focus.kind === "UseCasePractice"
      ? focus.level_id != null
        ? `/student/modules?practice=${focus.level_id}`
        : "/student/modules"
      : focus.chapter_id != null
        ? `/student/modules?chapter=${focus.chapter_id}`
        : "/student/modules"
    : "/student/modules";

  if (!focus) {
    return (
      <CardShell title="● FOKUS HARI INI">
        <h2 className="text-xl font-bold leading-snug text-gray-900 dark:text-white">
          Semua task terbaru sudah kamu selesaikan 🎉
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Tunggu chapter berikutnya terbuka, atau lihat ulang materi yang sudah
          dikerjakan.
        </p>
        <div className="mt-2">
          <Link href="/student/modules">
            <ButtonAILN>Lihat modul belajar</ButtonAILN>
          </Link>
        </div>
      </CardShell>
    );
  }

  return (
    <div className="flex h-fit flex-col gap-3 rounded-lg border border-dashboard-border bg-white p-5 dark:bg-card-bg">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-gray-500 dark:text-gray-400">
        <span className="size-2 rounded-full bg-red-500 dark:shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
        FOKUS HARI INI
      </div>
      <h2 className="text-xl font-bold leading-snug text-gray-900 dark:text-white">
        {headlineForFocus(focus)}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {focus.kind === "PromptPractice" || focus.kind === "UseCasePractice"
          ? "Practice dengan deadline terdekat dari Champion kamu."
          : "Pilih task ini sebagai langkah berikutnya supaya progres chapter kamu terus maju."}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {focus.kind === "Video" && (
          <a
            href={focus.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
            onClick={() =>
              completeVideo.mutate({ video_id: Number(focus.task_id) })
            }
          >
            <ButtonAILN>
              Mulai sekarang
              <ArrowRight className="size-3.5" />
            </ButtonAILN>
          </a>
        )}
        {focus.kind === "Material" && (
          <Link href={focus.href}>
            <ButtonAILN>
              Mulai sekarang
              <ArrowRight className="size-3.5" />
            </ButtonAILN>
          </Link>
        )}
        {(focus.kind === "PromptPractice" ||
          focus.kind === "UseCasePractice") && (
          <Link href={focus.href}>
            <ButtonAILN>
              Mulai sekarang
              <ArrowRight className="size-3.5" />
            </ButtonAILN>
          </Link>
        )}
        {focus.kind === "Quiz" && (
          <ButtonAILN onClick={() => setIsQuizDialogOpen(true)}>
            Mulai sekarang
            <ArrowRight className="size-3.5" />
          </ButtonAILN>
        )}
        <Link href={detailHref}>
          <ButtonAILN variant="outline">Lihat detail</ButtonAILN>
        </Link>
      </div>

      {focus.kind === "Quiz" && (
        <AlertConfirmDialogAILN
          isOpen={isQuizDialogOpen}
          alertDialogHeader="Mulai Quiz Sekarang?"
          alertDialogMessage="Waktu akan terus berjalan setelah quiz dimulai dan tidak bisa di-pause walaupun kamu keluar halaman."
          alertCancelLabel="Batal"
          alertConfirmLabel="Mulai sekarang"
          onClose={() => setIsQuizDialogOpen(false)}
          onConfirm={() => {
            setIsQuizDialogOpen(false);
            router.push(focus.href);
          }}
        />
      )}
    </div>
  );
}

function CardShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-fit flex-col gap-3 rounded-lg border border-dashboard-border bg-white p-5 dark:bg-card-bg">
      <div className="text-xs font-medium uppercase tracking-widest text-gray-500 dark:text-gray-400">
        {title}
      </div>
      {children}
    </div>
  );
}

function CardLoading() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      <div className="h-6 w-3/4 rounded bg-gray-200 dark:bg-dashboard-border" />
      <div className="h-4 w-full rounded bg-gray-200 dark:bg-dashboard-border" />
      <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-dashboard-border" />
      <div className="mt-2 flex items-center gap-2">
        <div className="h-9 w-32 rounded-md bg-gray-200 dark:bg-dashboard-border" />
        <div className="h-9 w-24 rounded-md bg-gray-200 dark:bg-dashboard-border" />
      </div>
    </div>
  );
}

function CardError() {
  return (
    <div className="flex h-20 items-center justify-center">
      <span className="text-xs text-red-500 dark:text-red-400">
        Gagal memuat data.
      </span>
    </div>
  );
}
