"use client";
import { trpc } from "@/trpc/client";
import { Tooltip as MuiTooltip } from "@mui/material";
import dayjs from "dayjs";
import "dayjs/locale/id";

dayjs.locale("id");

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];
// Inisial hari (Senin-start) untuk header kolom tiap blok bulan.
const DOW_INITIALS = ["S", "S", "R", "K", "J", "S", "M"];

interface StreakCardAILNProps {
  startDate: string; // YYYY-MM-DD — cohort start
  endDate: string; // YYYY-MM-DD — cohort end
  className?: string;
}

type DayCell = { date: string; count: number };

function levelClass(count: number): string {
  if (count <= 0) return "bg-gray-200 dark:bg-dashboard-border";
  if (count === 1) return "bg-red-200 dark:bg-red-500/30";
  if (count === 2) return "bg-red-300 dark:bg-red-500/50";
  if (count === 3) return "bg-red-400 dark:bg-red-500/70";
  return "bg-red-600 dark:bg-red-500";
}

// Kalender multi-bulan: tiap bulan jadi blok (hari = kolom Sen..Min, minggu =
// baris ke bawah); blok bulan disusun berdampingan ke samping.
type MonthCal = { key: string; label: string; weeks: (DayCell | null)[][] };
function buildMonthCalendars(days: DayCell[]): MonthCal[] {
  const countByDate = new Map(days.map((d) => [d.date, d.count]));
  const inRange = new Set(days.map((d) => d.date));
  const monthKeys = [...new Set(days.map((d) => d.date.slice(0, 7)))].sort();

  return monthKeys.map((mk) => {
    const monthIdx = Number(mk.slice(5, 7)) - 1;
    const daysInMonth = dayjs(`${mk}-01`).daysInMonth();
    const lead = (dayjs(`${mk}-01`).day() + 6) % 7; // Monday-start offset
    const cells: (DayCell | null)[] = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let dnum = 1; dnum <= daysInMonth; dnum++) {
      const date = `${mk}-${String(dnum).padStart(2, "0")}`;
      cells.push(inRange.has(date) ? { date, count: countByDate.get(date) ?? 0 } : null);
    }
    while (cells.length % 7 !== 0) cells.push(null);
    const weeks: (DayCell | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return { key: mk, label: MONTHS[monthIdx], weeks };
  });
}

const fmtCount = (n: number) =>
  n.toLocaleString("id-ID", { maximumFractionDigits: 0 });

const fmtHours = (n: number) =>
  n.toLocaleString("id-ID", {
    minimumFractionDigits: n % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });

export default function StreakCardAILN({
  startDate,
  endDate,
  className,
}: StreakCardAILNProps) {
  const achievementsQ = trpc.ailene.read.achievements.useQuery();
  // Standar tampil 3 bulan: kalau cohort lebih pendek, mundur ke awal 3 bulan
  // terakhir; kalau lebih panjang, tetap pakai rentang cohort penuh.
  const threeMonthFloor = dayjs(endDate)
    .subtract(2, "month")
    .startOf("month");
  const fetchFrom = (
    dayjs(startDate).isBefore(threeMonthFloor) ? dayjs(startDate) : threeMonthFloor
  ).format("YYYY-MM-DD");
  const streakQ = trpc.ailene.read.streak.useQuery({
    from: fetchFrom,
    to: endDate,
  });

  if (achievementsQ.isLoading || streakQ.isLoading) {
    return (
      <Shell className={className}>
        <div className="h-full min-h-[420px] animate-pulse rounded-md bg-gray-100 dark:bg-dashboard-border" />
      </Shell>
    );
  }
  if (
    achievementsQ.error ||
    streakQ.error ||
    !achievementsQ.data ||
    !streakQ.data
  ) {
    return (
      <Shell className={className}>
        <div className="flex h-full min-h-[420px] items-center justify-center text-sm text-red-500">
          Gagal memuat data.
        </div>
      </Shell>
    );
  }

  const a = achievementsQ.data;
  const days = streakQ.data.days as DayCell[];
  const todayKey = dayjs().format("YYYY-MM-DD");
  const monthCals = buildMonthCalendars(days);

  return (
    <Shell className={className}>
      {/* Top: lifetime achievements */}
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-bold text-foreground dark:text-white">
          Capaian Kamu
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Ringkasan aktivitas dan streak selama cohort.
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        <StatLine
          value={fmtCount(a.use_case_count + a.prompt_count)}
          label="use case + prompt dicatat"
        />
        <StatLine
          value={fmtHours(a.hours_saved_total)}
          label="jam dihemat (estimasi)"
          accent="emerald"
        />
      </div>

      {a.tools_mastered.length > 0 && (
        <div className="mt-5">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Telah Menguasai Tools
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {a.tools_mastered.map((t) => (
              <span
                key={t}
                className="rounded-full border border-dashboard-border bg-white px-2.5 py-1 text-xs text-foreground dark:bg-card-inside-bg dark:text-gray-200"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="my-5 h-px bg-dashboard-border" />

      {/* Bottom: streak — hari = kolom (ke kanan), minggu = baris ke bawah */}
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
          Streak Cohort
        </div>
        {days.length === 0 ? (
          <div className="mt-3 flex h-24 items-center justify-center text-sm text-gray-400 dark:text-gray-500">
            Rentang cohort belum tersedia.
          </div>
        ) : (
          <>
            <div className="mt-3 overflow-x-auto pb-1">
              <div className="flex gap-4">
                {monthCals.map((month) => (
                  <div key={month.key} className="flex shrink-0 flex-col gap-1">
                    <div className="text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                      {month.label}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {DOW_INITIALS.map((d, i) => (
                        <div
                          key={i}
                          className="size-5 text-center text-[9px] leading-5 text-gray-400 dark:text-gray-500"
                        >
                          {d}
                        </div>
                      ))}
                    </div>
                    {month.weeks.map((week, wi) => (
                      <div key={wi} className="grid grid-cols-7 gap-1">
                        {week.map((cell, di) =>
                          cell ? (
                            <MuiTooltip
                              key={cell.date}
                              arrow
                              title={`${dayjs(cell.date).format("D MMM YYYY")} · ${cell.count} task`}
                            >
                              <div
                                className={`size-5 rounded-[4px] ${levelClass(cell.count)} ${
                                  cell.date === todayKey
                                    ? "ring-1 ring-red-600 dark:ring-red-400"
                                    : ""
                                }`}
                              />
                            </MuiTooltip>
                          ) : (
                            <div key={`pad-${month.key}-${wi}-${di}`} className="size-5" />
                          )
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
              <span>Sedikit</span>
              <span className="size-3 rounded-[2px] bg-gray-200 dark:bg-dashboard-border" />
              <span className="size-3 rounded-[2px] bg-red-200 dark:bg-red-500/30" />
              <span className="size-3 rounded-[2px] bg-red-400 dark:bg-red-500/70" />
              <span className="size-3 rounded-[2px] bg-red-600 dark:bg-red-500" />
              <span>Banyak</span>
            </div>
          </>
        )}
      </div>
    </Shell>
  );
}

function StatLine({
  value,
  label,
  accent,
}: {
  value: string;
  label: string;
  accent?: "emerald";
}) {
  const valColor =
    accent === "emerald"
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-foreground dark:text-white";
  return (
    <div className="flex items-baseline gap-2">
      <span className={`font-geist-mono text-3xl font-bold ${valColor}`}>
        {value}
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
    </div>
  );
}

function Shell({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col rounded-lg border border-dashboard-border bg-white p-5 dark:bg-card-bg ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
