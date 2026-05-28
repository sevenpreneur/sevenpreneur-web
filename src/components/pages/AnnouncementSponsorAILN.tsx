"use client";

import ButtonAILN from "@/components/buttons/ButtonAILN";
import PageContainerAILN from "@/components/pages/PageContainerAILN";
import AppErrorComponents from "@/components/states/AppErrorComponents";
import { setSessionToken, trpc } from "@/trpc/client";
import dayjs from "dayjs";
import { CalendarDays, Megaphone, Save } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const MAX_MESSAGE_LENGTH = 500;

type Announcement = {
  title: string;
  callout: string | null;
  status: string;
  start_date: string | Date;
  end_date: string | Date;
  updated_at?: string | Date;
};

export default function AnnouncementSponsorAILN({
  sessionToken,
}: {
  sessionToken: string;
}) {
  useEffect(() => {
    setSessionToken(sessionToken);
  }, [sessionToken]);

  const utils = trpc.useUtils();
  const announcementQ = trpc.ailene.read.announcement.useQuery();

  if (announcementQ.isLoading) {
    return (
      <PageContainerAILN>
        <AnnouncementSkeleton />
      </PageContainerAILN>
    );
  }

  if (announcementQ.error) {
    return (
      <PageContainerAILN>
        <AppErrorComponents />
      </PageContainerAILN>
    );
  }

  const announcement = announcementQ.data?.announcement ?? null;

  return (
    <AnnouncementForm
      key={
        announcement?.updated_at
          ? dayjs(announcement.updated_at).toISOString()
          : "empty"
      }
      announcement={announcement}
      invalidateAnnouncement={() => utils.ailene.read.announcement.invalidate()}
    />
  );
}

function AnnouncementForm({
  announcement,
  invalidateAnnouncement,
}: {
  announcement: Announcement | null;
  invalidateAnnouncement: () => Promise<unknown>;
}) {
  const updateAnnouncement = trpc.ailene.update.announcement.useMutation({
    onSuccess: async () => {
      await invalidateAnnouncement();
      toast.success("Pengumuman berhasil diperbarui.");
    },
    onError: (error) => {
      toast.error(error.message || "Gagal memperbarui pengumuman.");
    },
  });

  const [message, setMessage] = useState(announcement?.title ?? "");
  const [startDate, setStartDate] = useState(
    announcement ? dayjs(announcement.start_date).format("YYYY-MM-DD") : ""
  );
  const [endDate, setEndDate] = useState(
    announcement ? dayjs(announcement.end_date).format("YYYY-MM-DD") : ""
  );

  const isActive = useMemo(() => {
    if (!announcement) return false;
    const now = dayjs();
    return (
      announcement.status === "ACTIVE" &&
      now.isAfter(dayjs(startDate).startOf("day")) &&
      now.isBefore(dayjs(endDate).endOf("day"))
    );
  }, [announcement, startDate, endDate]);

  const dateRangeLabel = useMemo(() => {
    if (!startDate || !endDate) return "Tanggal belum lengkap";
    return `${dayjs(startDate).format("DD MMM YYYY")} - ${dayjs(endDate).format("DD MMM YYYY")}`;
  }, [startDate, endDate]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateAnnouncement.mutate({
      message,
      start_date: startDate,
      end_date: endDate,
    });
  };

  return (
    <PageContainerAILN>
      <div className="flex w-full flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              SPONSOR - KOMUNIKASI
            </div>
            <h1 className="mt-1 text-3xl font-bold leading-tight text-gray-900 dark:text-white">
              Pengumuman
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Atur banner pengumuman yang tampil di halaman Hari Ini untuk
              semua peserta.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
          <form
            onSubmit={handleSubmit}
            className="rounded-lg border border-dashboard-border bg-white p-5 shadow-sm dark:bg-card-bg dark:shadow-[0_0_16px_rgba(0,53,157,0.06)]"
          >
            <div className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
              <Megaphone className="size-4" />
              Update pengumuman
            </div>

            <div className="mt-5 flex flex-col gap-5">
              <label className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Isi pesan
                </span>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  maxLength={MAX_MESSAGE_LENGTH}
                  rows={7}
                  required
                  className="min-h-40 resize-none rounded-md border border-dashboard-border bg-white px-3 py-3 text-sm leading-6 text-gray-900 outline-none transition focus:border-black dark:bg-dashboard-bg dark:text-white dark:focus:border-blue-400"
                  placeholder="Tulis pengumuman untuk peserta..."
                />
                <span className="text-right text-xs text-gray-400">
                  {message.length} / {MAX_MESSAGE_LENGTH}
                </span>
              </label>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Start date
                  </span>
                  <div className="flex items-center gap-2 rounded-md border border-dashboard-border bg-white px-3 dark:bg-dashboard-bg">
                    <CalendarDays className="size-4 shrink-0 text-gray-400" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(event) => setStartDate(event.target.value)}
                      required
                      className="h-11 w-full bg-transparent text-sm text-gray-900 outline-none dark:text-white"
                    />
                  </div>
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    End date
                  </span>
                  <div className="flex items-center gap-2 rounded-md border border-dashboard-border bg-white px-3 dark:bg-dashboard-bg">
                    <CalendarDays className="size-4 shrink-0 text-gray-400" />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(event) => setEndDate(event.target.value)}
                      required
                      className="h-11 w-full bg-transparent text-sm text-gray-900 outline-none dark:text-white"
                    />
                  </div>
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <ButtonAILN
                type="submit"
                variant="primary"
                size="medium"
                disabled={updateAnnouncement.isPending}
              >
                <Save className="size-4" />
                {updateAnnouncement.isPending ? "Menyimpan..." : "Simpan"}
              </ButtonAILN>
            </div>
          </form>

          <aside className="flex flex-col gap-4">
            <div className="rounded-lg border border-dashboard-border bg-white p-5 shadow-sm dark:bg-card-bg dark:shadow-[0_0_16px_rgba(0,53,157,0.06)]">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Pratinjau di halaman Hari Ini
              </div>

              <div className="mt-4 overflow-hidden rounded-md border border-dashboard-border bg-gray-50 dark:bg-dashboard-bg">
                <div className="flex w-full items-stretch overflow-hidden bg-black">
                  <div className="flex shrink-0 items-center gap-2 bg-black px-4 py-3">
                    <Megaphone className="h-4 w-4 text-white" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-white">
                      {announcement?.callout ?? "PENGUMUMAN"}
                    </span>
                    <span className="ml-1 h-4 w-px bg-white/15" />
                  </div>
                  <div className="flex min-h-11 flex-1 items-center overflow-hidden px-4">
                    <span className="line-clamp-2 text-sm leading-5 text-white">
                      {message.trim() || "Pesan pengumuman akan tampil di sini."}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="h-2 w-28 rounded bg-gray-200 dark:bg-dashboard-border" />
                  <div className="mt-4 h-20 rounded-md border border-dashboard-border bg-white dark:bg-card-bg" />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span
                  className={`rounded-full px-2 py-1 font-semibold ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300"
                  }`}
                >
                  {isActive ? "Aktif" : "Tidak aktif saat ini"}
                </span>
                <span>{dateRangeLabel}</span>
              </div>
            </div>

            <div className="rounded-lg border border-dashboard-border bg-white p-5 text-sm text-gray-600 shadow-sm dark:bg-card-bg dark:text-gray-300 dark:shadow-[0_0_16px_rgba(0,53,157,0.06)]">
              <div className="font-bold text-gray-900 dark:text-white">
                Catatan
              </div>
              <p className="mt-2 leading-6">
                Form ini hanya mengubah isi pesan, start date, dan end date.
                Status dan label pengumuman tetap mengikuti data yang sudah ada.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </PageContainerAILN>
  );
}

function AnnouncementSkeleton() {
  return (
    <div className="grid w-full grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
      <div className="h-[480px] rounded-lg border border-dashboard-border bg-gray-100 dark:bg-card-bg" />
      <div className="h-[320px] rounded-lg border border-dashboard-border bg-gray-100 dark:bg-card-bg" />
    </div>
  );
}
