# AILN — Backlog: Hardcoded / Non-Fungsional / Belum Ada Backend

> Hasil audit per halaman (champion / student / sponsor + member detail).
> Tujuan: peta apa yang masih **dummy / hardcoded** atau **non-fungsional** supaya
> bisa diwirekan ke backend. Legenda: ⚠ perlu dikerjakan · ✅ sudah dinamis.

Tanggal audit: 2026-05-31.

---

## 🟥 Champion

### ReportChampionAILN ⚠
- **"Kirim ke Sponsor"** → cuma `toast.success()`, **belum ada mutation**. Butuh endpoint kirim report ke sponsor.
- **Narasi (textarea)** → diedit di state tapi **tidak disimpan** ke backend.
- **Checkbox opsi** → `defaultChecked` saja, no-op (tidak masuk payload).
- ✅ Read report (`read.report.champion`), period toggle, Unduh PDF (client-side) jalan.

### MemberDetailsChampionAILN ⚠
- **"Kirim catatan"** (header) → tombol **tanpa onClick**.
- **Input coaching note + "Kirim"** → input tanpa state binding, tombol tanpa mutation. Butuh endpoint buat catatan coaching.
- **"Semua aktivitas →"** → tanpa `href`.
- **Badge "On track"** → string hardcoded, bukan dari data member.
- ✅ Detail member (`read.memberDetail`), radar, metric cards, aktivitas dari query.
- (Tombol "Promote ke L2" sudah DIHAPUS — promosi tidak lewat sini.)

### Sudah dinamis ✅
- **DashboardChampionAILN** — `list.members` + search/filter.
- **AssignmentChampionAILN** — `list.promptLibrary` / `list.useCaseLibrary` + modal create/assign.
- **SubmissionsChampionAILN** — `list.promptSubmissions` / `list.useCaseSubmissions`.
- **ReviewPromptSubmissionChampionAILN** / **ReviewUseCaseSubmissionChampionAILN** — detail + `update.review...` mutation.

---

## 🟦 Student — **status terkini**

### ✅ Sudah dibereskan (sesi ini, tanpa migrasi)
- **Cohort dates** (MyProgress + StreakCard) → sekarang dari `member.created_at` → hari ini. Tidak hardcoded lagi.
- **Outcome radar** (`OutcomeView`, `?outcome=true`) → pakai `CompetencyProfileAILN` asli (kompetensi terkini). `OUTCOME_PILLAR_*` + `OutcomeRadarCard` + chart.js/Radar dihapus.
- **Recommendations — link kartu** → item asli ke detail spesifik (`/student/practice/prompts/[id]` · `/use-cases/[id]`); sample tetap generic.

### ⛔ Sisa / BLOCKER Student
1. **Recommendations — isi katalog** (`RecommendationsAILN`): masih fallback `SAMPLE_RECS` (badge "data contoh") karena **katalog `AilUseCase`/`AilPrompt` di level user kosong**. → butuh **seed/isi data katalog** (DB write — kena izin/db-drift blocker). Begitu katalog terisi, otomatis pakai data asli.
2. **Recommendations — source tracking + "mandiri real"**: butuh **migrasi** (`ail_work_source` enum + nullable `use_case_id`/`prompt_id` + `custom_title`) → lihat **Migrasi B**. **BLOCKED** oleh aturan no-`db push` (drift) → harus SQL manual.

### 📝 Catatan (bukan blocker fungsional)
- **PreAssessment**: 15 soal + scoring + rekomendasi **hardcoded di `src/lib/pre-assessment-questions.ts`** — kemungkinan **by design** (submit `create.preAssessment` ✅). Pindah ke DB/CMS hanya kalau mau dikelola admin.
- **Dead code** `MyProgressStudentAILN.tsx` (StreakPanel/StatsPanel dkk) — lihat section "Dead code".

### Sudah dinamis ✅
- **DashboardStudentAILN** (streak, competency, announcement, today focus).
- **PracticeStudentAILN** (`list.assignedPrompts` / `assignedUseCases`).
- **MaterialDetailsAILN** (+`create.completeMaterial`).
- **QuizAttempt / QuizDetails / QuizResult** (mutations start/save/submit).
- **TodayFocusCardAILN** (+`create.completeVideo`), **FirstWinCardAILN**, **CompetencyProfileAILN**, **LevelProgressCardAILN**.

---

## 🟩 Sponsor

### DashboardSponsorAILN ⚠
- **`HEALTH_CARDS`** (Kesehatan Program: 84%/61%/92%/+48) → **hardcoded**.
- **`ACTIVITY`** (Aktivitas terkini: "Champion Adi P." dst) → **hardcoded**.
- **Nama org "Hutama Karya"** + "240 staff aktif · 18 departemen" → hardcoded.
- **"Export PDF"** → no-op.
- ✅ KPI cards (`read.executiveView`), distribusi level, trend mingguan, leaderboard.

### DashboardOutcomeAILN ⚠
- **`PROCESS_CURVE`** → kurva sample ("data contoh") sampai ada endpoint time-series asli (lihat diskusi pilar).
- **Nama program** hardcoded; **"Export PDF"** no-op.
- ✅ `outcome.overview` / `levelDistribution` / `topPerformers`.

### LevelDistributionSponsorAILN (page) ⚠
- **Filter pill** "Departemen: Semua" / "Periode: Bulan ini" → **tidak wired**.
- **Checkbox "Highlight underperform"** → no-op (tidak ke state/filter).
- **"Export PDF"** & **"Drill ke departemen"** → no-op.
- ✅ distribusi (`read.levelDistribution`), donut partisipasi, link "departemen perlu intervensi".

### DashboardPreAssesmentAILN ⚠
- **"Export PDF"** → no-op.
- ✅ 9 query (departments/overview/pillars/usageFrequency/tools/teamMaturity/safetyGaps/topUseCases/voice) + DepartmentFilter jalan.

### GroupDetailsSponsorAILN ⚠
- **"Export"** → no-op.
- ✅ group.* query (overview/levelDistribution/topUseCases/attentionMembers) + dropdown departemen (router.push) jalan.

### Sudah dinamis ✅
- **AnnouncementSponsorAILN** — `read.announcement` + `update.announcement` (form submit penuh).
- **WeeklyTrendsSponsorAILN** (chart) — `read.weeklyTrends` + fallback `SAMPLE_TREND` ("data contoh").
- **LevelDistribution chart**, **OrganizationLeaderboardAILN**, **ScorecardAILN** (props).

---

## 🔁 Lintas-halaman (pola berulang)

- **Tombol "Export PDF" / "Export"** non-fungsional di: DashboardSponsor, Outcome, PreAssessment, GroupDetails, LevelDistribution. (perlu satu util export PDF kalau memang mau diaktifkan)
- **Data contoh/sample** (sengaja, fallback): `SAMPLE_TREND` (trend), `SAMPLE_RECS` (rekomendasi), `PROCESS_CURVE` (outcome). Otomatis ke-replace begitu data asli ada.

---

## ✅ Prioritas perbaikan (urutan saran)

1. **ReportChampion** — mutation "Kirim ke Sponsor" + simpan narasi + checkbox masuk payload.
2. **MemberDetails** — coaching note (input state + mutation) + "Semua aktivitas" href + status badge dinamis.
3. **DashboardSponsor** — `HEALTH_CARDS` / `ACTIVITY` / nama org → endpoint asli.
4. **Cohort dates** hardcoded → ambil dari DB (dipakai MyProgress + StreakCard).
5. **Outcome radar** (MyProgress) → endpoint baseline vs sekarang.
6. **Filter LevelDistribution sponsor** (departemen/periode/highlight) → wire ke query/state.
7. **Export PDF** global (kalau diaktifkan).
8. **Rekomendasi** — isi katalog + source tracking + flow "Mulai" (butuh migrasi — lihat diskusi).

---

## ✅ TODO Checklist (granular)

### Champion
- [x] ReportChampion: ~~kirim ke Sponsor~~ → **dihapus** (revisi: fokus ke generation/Unduh PDF). Flow kirim + riwayat terkirim + checkbox dihapus, dead code dibersihin.
- [x] ReportChampion: narasi & checkbox → **selesai** (narasi tetap masuk PDF yang di-generate; tombol kirim/checkbox dihapus, nggak perlu disimpan ke backend lagi).
- [x] MemberDetails: **coaching note** → **KODE SELESAI** (schema `AilCoachingNote` + `create.coachingNote` + `read.memberDetail.notes` + input/list di FE). Tombol "Kirim catatan" header yg non-fungsional dihapus. ⏳ **Tinggal jalanin SQL `CREATE TABLE ail_coaching_notes` di Supabase (lihat Migrasi A) + `prisma generate`.**
- [x] MemberDetails: **"Semua aktivitas →"** → **dihapus** (link nyasar, belum ada route aktivitas-per-member).
- [x] MemberDetails: **badge status** → **dinamis** dari `gate` (Siap naik / On track / Perlu dorongan).
- [x] MemberDetails: tombol **"Promote ke L2"** → **dihapus** (promosi tidak lewat sini).

### Student
- [x] MyProgress + StreakCard: **cohort dates** → **SELESAI**. Sekarang dari `member.created_at` (join) → hari ini, bukan hardcoded. *(catatan: belum ada model cohort khusus AILN; kalau butuh window cohort resmi, tambah `ail_cohorts` — Migrasi D.)*
- [x] MyProgress: **Outcome radar** → **SELESAI (opsi A)**. `OutcomeView` (`?outcome=true`) sekarang pakai `CompetencyProfileAILN` asli (kompetensi terkini/latest). `OUTCOME_PILLAR_*` + `OutcomeRadarCard` + import chart.js/Radar dihapus. *(perbandingan "awal vs sekarang" di-defer sampai ada snapshot baseline — Migrasi.)*
- [ ] Recommendations: **isi katalog** use case/prompt per level → ganti `SAMPLE_RECS`. 🚫 **BLOCKER: butuh seed/isi data katalog ke DB** (DB write — kena aturan no-auto-write ke prod). Begitu katalog terisi, FE otomatis pakai data asli.
- [x] Recommendations: kartu nge-link ke **item spesifik** → **SELESAI** (item asli → `/student/practice/prompts/[id]` atau `/use-cases/[id]`; sample tetap generic).
- [ ] **Student nyatet/nambah prompt & use case sendiri (mandiri)** + source tracking (assigned/recommended/self) + flow "Mulai". Pecahan sub-task:
  - [ ] **#1 Schema (MIGRASI)** 🚫 **BLOCKER UTAMA** — `AilPromptSubmission`/`AilUseCaseSubmission` sekarang: `prompt_id`/`use_case_id` **NOT NULL** (wajib nempel katalog), `@@unique([member_id, prompt_id/use_case_id])`, **gak ada** kolom `source` & `custom_title` (prompt submission gak punya field judul sama sekali). Fix = **Migrasi B** (nullable id + `source` enum + `custom_title`). Blocked no-`db push` → SQL manual.
  - [ ] **#2 Endpoint backend** (no-migrasi, garap setelah schema siap) — semua create submission lewat `championProcedure` (`assignPrompt`/`assignUseCase`); `submitPromptAssignment`/`submitUseCaseAssignment` cuma **update** baris yg udah di-assign ([update.ailene.ts:459](src/trpc/routers/ailene/update.ailene.ts#L459) lempar "Assignment not found" kalau `assigned_by_id` null). **Belum ada** jalan student bikin submission baru sendiri → perlu mutation baru (`create.selfPrompt`/`create.selfUseCase`, `ailMemberProcedure`, `source='self'` + `custom_title` + `prompt_id`/`use_case_id` = null).
  - [ ] **#3 Frontend** — belum ada form "Tambah prompt/use case mandiri" di halaman practice student (input/output utk prompt; hours_saved/ai_tool/deskripsi utk use case). `RecommendationsAILN` baru nge-link item katalog, belum ada CTA "catat kerjaan sendiri".
  - [ ] **#4 Keputusan produk** (putusin dulu) — (a) item mandiri masuk antrian **review champion** (`is_accepted`/`reviewed_by`)? (b) ngitung ke **XP / 6 pilar / kompetensi**? rubriknya gimana tanpa katalog penentu pilar? (c) anti-spam / perlu verifikasi champion sebelum dihitung?
- [ ] PreAssessment: pindah **15 soal + scoring + rekomendasi** dari lib ke DB/CMS. ⚪ **Bukan blocker — opsional** (sekarang by design di `src/lib/pre-assessment-questions.ts`, submit jalan). Kerjakan hanya kalau mau dikelola lewat admin/CMS.

### Sponsor
- [x] DashboardSponsor: **`HEALTH_CARDS`** (Kesehatan Program) → **SELESAI**. Endpoint baru `read.programHealth` (sponsor): Lulus L1+, Lulus L2+, Submission diterima (% accepted dari yg direview, prompt+use case), Partisipasi (% staff pernah submit). Semua % asli + detail "X dari Y". **Delta/target palsu (NPS, "+4 vs target") dihapus** — gada baseline historis.
- [x] DashboardSponsor: **`ACTIVITY`** (Aktivitas terkini) → **SELESAI**. Endpoint baru `read.recentActivity`: gabung event asli (kirim use case / review-terima use case / selesai pre-assessment), sort terbaru, top 6, waktu relatif. Skeleton + empty state.
- [x] DashboardSponsor: **"240 staff · 18 departemen"** → **SELESAI** (subline dari `read.organizationStats`: `member_count` + `group_count`).
- [x] DashboardSponsor: **nama org "Hutama Karya"** → **SELESAI (config, bukan migrasi)**. Ailene = **single-tenant** (1 deployment = 1 perusahaan/1 program; semua query sponsor gak ada scoping tenant). Jadi nama org & program = **config per-deployment** via env `NEXT_PUBLIC_AILN_ORG_NAME` / `NEXT_PUBLIC_AILN_PROGRAM_NAME` → `src/lib/ailene-config.ts`. Dipakai di DashboardSponsor (H1 + subline) & Outcome (label program). *(Kalau nanti multi-tenant → baru butuh `AilOrganization` + scoping query, migrasi besar.)*
- [x] DashboardOutcome: **nama program** → **SELESAI** (dari `AILENE_PROGRAM_NAME`, config env yang sama).
- [ ] DashboardOutcome: **`PROCESS_CURVE`** → endpoint time-series asli. 🚫 **BLOCKER: butuh snapshot/historis** (level/kompetensi per periode) yang belum disimpan → butuh migrasi (tabel snapshot) atau job perekam. Sementara tetap "data contoh".
- [x] LevelDistribution (page): **filter departemen** → **SELESAI** (dropdown `<select>` dari `data.groups`, filter baris distribusi client-side + tombol Reset).
- [x] LevelDistribution (page): **"Highlight underperform"** checkbox → **SELESAI** (state; reuse set `groups_needing_intervention` → underperform di-ring amber + badge ⚠, sisanya diredupkan).
- [x] LevelDistribution (page): **"Drill ke departemen"** → **dihapus** (redundant: tiap baris + kartu intervensi udah link ke `/sponsor/groups/[id]`).
- [x] LevelDistribution (page): **filter periode** → **dihapus** (halaman ini SNAPSHOT = kondisi terkini, bukan time-bound; periode-over-time masuk ranah snapshot historis sama seperti `PROCESS_CURVE`).

### Lintas-halaman
- [ ] **Export PDF / Export** → ⚠️ **PERLU REVISI — kualitas hasil export jelek (feedback user 2026-06-01)**. Sudah ada implementasi react-pdf (lihat detail di bawah), TAPI output lintas-halaman **belum bagus / belum layak dipakai**. Dua keputusan/aksi yang ditunda:
  - [ ] **Scope ulang: gak semua halaman perlu export.** Untuk sekarang **kurangi** tombol export — tentuin halaman mana yang beneran butuh (kandidat utama: Outcome Report; sisanya DashboardSponsor/PreAssessment/GroupDetails/LevelDistribution kemungkinan dilepas dulu). *(perlu keputusan halaman mana yg dipertahankan)*
  - [ ] **Perbaiki kualitas layout PDF** — tata letak/spacing/section masih kurang rapi sebagai dokumen. Revisi template `AileneReportPDF` + chart sebelum di-anggap selesai.
  - **Status implementasi sekarang (sudah ada, tinggal dirombak/dirapikan):** komponen `src/components/reports/AileneReportPDF.tsx` (`@react-pdf/renderer`) — header brand + section `kpi`/`table`/`list`/`note`, teks vektor selectable, multi-halaman. Tiap dashboard nyusun data via `buildReport()` → `usePdfReport().generate(report, filename)`. Chart vektor di `report-charts.tsx` (`BarChartPDF`/`TrendChartPDF`/`DonutChartPDF`). Sanitizer `clean()` (glyph non-WinAnsi). Dep: `@react-pdf/renderer`. *(Iterasi approach: window.print → html-to-image screenshot → react-pdf.)*

### Dead code (cleanup, no-migrasi)
- [ ] **`MyProgressStudentAILN.tsx`** — sisa dari iterasi layout, tidak dirender lagi: `StreakPanel`, `StatsPanel`, `StatCard`, `StreakStat`, `computeStats`, `buildMonthCalendars`, `tierClass`, `DOW_INITIALS`, `STREAK_MONTHS`, `WINDOW_OPTIONS`, `DayCell` + import yg cuma kepakai mereka (`MuiTooltip`, `Flame`, `useTheme`, `Timer`, `Star`, dll). ~250 baris mati (build jalan, cuma warning). Hapus saat cleanup pass.

### DB / Infra (BLOCKER)
- [ ] ⛔ **`db push`/`migrate` tidak bisa dipakai** — schema drift (akan drop/recreate banyak FK). Semua migrasi **manual via SQL** dulu. (lihat section Migrasi)
- [ ] ⏳ **Apply SQL `ail_coaching_notes`** di Supabase (Migrasi A) → unblock fitur coaching note yg kodenya sudah selesai.
- [ ] 🔧 (besar) **Rekonsiliasi `schema.prisma` ↔ DB** (`prisma db pull` + rapikan) supaya migrations bisa dipakai aman ke depan.

---

## 🛠 Migrasi yang dibutuhkan (cara apply)

> **Repo ini TIDAK pakai `prisma migrate`** (tidak ada folder `prisma/migrations`) — build cuma `prisma generate`. Perubahan schema masuk ke Supabase via **`prisma db push`** ATAU **paste SQL di Supabase SQL Editor**.
>
> **Proses tiap migrasi:**
> 1. Edit `prisma/schema.prisma` (tambah model/kolom).
> 2. **Update DDL** `sevenpreneur-ddl` & `ailene-ddl` (wajib per CLAUDE.md).
> 3. Apply ke DB: **paste SQL `ALTER/CREATE` di Supabase SQL Editor** (paling aman, additive = zero-downtime) ATAU `npx prisma db push`.
> 4. `npx prisma generate` (regenerate client).
>
> ⚠️ Semua SQL di bawah **additive + nullable/DEFAULT** → aman, tidak menghapus/merusak data lama. **Jangan** `db push --force-reset`. Eksekusi ke DB dilakukan oleh kamu / setelah review (jangan auto-apply ke prod).

> ## ⛔ BLOCKER — `prisma db push` / `migrate` TIDAK BISA dipakai
>
> `schema.prisma` **drift jauh** dari DB Supabase (repo ini kelola DB manual, tanpa folder `prisma/migrations`). Hasil `prisma migrate diff` menunjukkan `db push` akan **DROP & RECREATE puluhan foreign key** di hampir semua tabel (ai_chats, ail_members, ail_prompt_submissions, ail_quizzes, dst) — **bukan cuma** menambah tabel/kolom yang kita mau. Itu berisiko nge-lock & merusak relasi di prod.
>
> **Konsekuensi / aturan:**
> - **Semua migrasi WAJIB di-apply manual** sebagai SQL `CREATE/ALTER` bertarget (Supabase SQL Editor), **bukan** `db push`/`migrate`.
> - Setelah apply SQL: `npx prisma generate` (regenerate client) + update DDL `sevenpreneur-ddl`/`ailene-ddl`.
> - **TODO terpisah (besar):** rekonsiliasi `schema.prisma` ↔ DB asli (introspect `prisma db pull` lalu rapikan) supaya ke depannya bisa pakai migrations dengan aman. Sampai itu beres, jangan pernah `db push`.
>
> Status fitur yang nunggu SQL ini di-apply:
> - **Coaching note** (Champion): kode SELESAI, **nunggu `CREATE TABLE ail_coaching_notes`** (Migrasi A) dijalankan manual. Sebelum itu fitur catatan error saat dipakai.

### A. Coaching note (Champion — MemberDetails) #4
```sql
CREATE TABLE ail_coaching_notes (
  id          serial PRIMARY KEY,
  member_id   integer NOT NULL REFERENCES ail_members(id),
  champion_id integer NOT NULL REFERENCES ail_members(id),
  text        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ail_coaching_notes_member_idx ON ail_coaching_notes(member_id);
```
Prisma: model `AilCoachingNote` + back-relation di `AilMember`
(`coaching_notes_received` / `coaching_notes_given`).
Lalu: endpoint `create.coachingNote` (championProcedure) + `list.coachingNotes(member_id)`, wire input "Kirim catatan" + list di MemberDetails.

### B. Rekomendasi: source tracking + mandiri real (Student) #6 — *= student nyatet prompt/use case sendiri*
```sql
CREATE TYPE ail_work_source AS ENUM ('assigned', 'recommended', 'self');

ALTER TABLE ail_use_case_submissions
  ADD COLUMN source       ail_work_source NOT NULL DEFAULT 'self',
  ADD COLUMN custom_title  varchar,          -- judul item "mandiri" (tanpa katalog)
  ALTER COLUMN use_case_id DROP NOT NULL;     -- boleh di luar katalog

ALTER TABLE ail_prompt_submissions
  ADD COLUMN source        ail_work_source NOT NULL DEFAULT 'self',
  ADD COLUMN custom_title  varchar,          -- prompt submission blm punya field judul
  ALTER COLUMN prompt_id   DROP NOT NULL;

-- backfill: tandai yg dari Champion
UPDATE ail_use_case_submissions SET source = 'assigned' WHERE assigned_by_id IS NOT NULL;
UPDATE ail_prompt_submissions   SET source = 'assigned' WHERE assigned_by_id IS NOT NULL;
```
Catatan: `@@unique([member_id, use_case_id])` & `[member_id, prompt_id]` aman dgn nullable — banyak baris dgn id NULL dianggap distinct di Postgres, jadi student bisa punya >1 item mandiri. Unik tetap berlaku utk item katalog (id NOT NULL).
Jangan lupa update `prisma/schema.prisma` (nullable + `source AilWorkSource` + `custom_title`) + file `sevenpreneur-ddl` / `ailene-ddl`. **BLOCKED** oleh aturan no-`db push` (drift) → SQL manual + review.

### C. Prompting Quality rubrik (Blocker A — spec 6-pilar)
> Lihat `docs/ailene-6-pillar-diagnostic.md`.
```sql
ALTER TABLE ail_prompt_submissions
  ADD COLUMN rubric_specificity smallint,   -- 1..5
  ADD COLUMN rubric_context     smallint,
  ADD COLUMN rubric_constraints smallint,
  ADD COLUMN rubric_examples    smallint,
  ADD COLUMN rubric_iteration   smallint;
```
Lalu: UI review Champion isi skor 1–5 × 5 dimensi + update endpoint `competencyProfile`.

### D. Cohort dates AILN (Student) #5 — *opsional, perlu keputusan*
Belum ada model cohort khusus AILN. Dua opsi:
- **Tanpa migrasi:** pakai `ail_members.created_at` sebagai start + durasi tetap (mis. 6 minggu) → cukup util di FE/endpoint.
- **Dengan migrasi:**
```sql
CREATE TABLE ail_cohorts (
  id         serial PRIMARY KEY,
  name       varchar NOT NULL,
  start_date date NOT NULL,
  end_date   date NOT NULL
);
ALTER TABLE ail_members ADD COLUMN cohort_id integer REFERENCES ail_cohorts(id);
```

### E. Outcome radar awal vs sekarang (Student) #2 — *tidak perlu migrasi*
Data sudah ada: **awal** dari `AilPreAssessment` (baseline), **sekarang** dari `competencyProfile`. Yang dibutuhkan: **keputusan pillar-set** + endpoint yang balikin dua set skor pada pillar yang sama (bukan migrasi). Lihat `docs/ailene-6-pillar-diagnostic.md`.
