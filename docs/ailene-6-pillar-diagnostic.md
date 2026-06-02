# 6 Pillar Diagnostic — Logika Perhitungan (AILN)

> **Tujuan:** Untuk *Champion coaching* dan diagnosa kompetensi AI seorang member —
> **bukan** sumber skor lulus/gate. Gate kelulusan tetap pakai quiz/submission acceptance
> yang terpisah.
>
> **Output:** 6 pilar, masing-masing skala **0.0–5.0** (1 desimal), ditampilkan di radar
> `CompetencyProfileAILN`. Skor rata-rata → label tier (Beginner … Advanced).
>
> **Endpoint:** `ailene.read.competencyProfile` (per-member, `ailMemberProcedure`)
> di `src/trpc/routers/ailene/read.ailene.ts`.

Status keputusan:

- ✅ **Blocker A** — Prompting Quality pakai **rubrik beneran** (skor 5 dimensi saat
  Champion review prompt), bukan proxy acceptance-rate. Perlu tambah kolom DB.
- ✅ **Blocker B** — Tidak ada telemetry / browser extension. Tool Fluency & AI Habit
  pakai data yang ada: `ai_tool`, `outcome_proof`, `hours_*`, dan **streak**.

---

## Prinsip umum

1. Semua pilar dinormalisasi ke **0–5**, lalu `round1` (1 desimal).
2. `clamp(x, 0, 5)` di akhir tiap pilar.
3. Pilar yang **n/a** (belum relevan / belum ada data) **dikecualikan dari rata-rata**,
   tidak dihitung sebagai 0. Di radar ditandai khusus (titik kosong / dashed).
4. Sumber data semuanya milik member yang bersangkutan (`member_id`).

---

## Pilar 1 — AI Foundation

**Sumber:** `AilQuizSubmission` (`is_completed = true`), `score` 0–100.

**Logika:**

```
bestPerQuiz[quiz_id] = MAX(score)          // skor terbaik tiap quiz (adil utk remidi)
avgQuiz              = mean(bestPerQuiz)    // 0–100
AI_Foundation        = clamp(avgQuiz / 20, 0, 5)
```

- **Keputusan:** pakai **best score per quiz** (bukan avg semua attempt) supaya remidi
  tidak menghukum. (Alternatif "avg across attempts" lebih ketat — bisa diaktifkan kalau mau.)
- Belum ada quiz selesai → **n/a**.

---

## Pilar 2 — Prompting Quality  *(rubrik — Blocker A)*

**Sumber:** `AilPromptSubmission` + **kolom rubrik baru** (lihat [Perubahan Schema](#perubahan-schema)).
Diisi oleh reviewer (Champion) saat review prompt: skor **1–5** untuk tiap dimensi.

5 dimensi rubrik:

| Dimensi | Maksud |
| --- | --- |
| `rubric_specificity` | Sespesifik apa instruksinya |
| `rubric_context` | Konteks yang diberikan cukup/relevan |
| `rubric_constraints` | Batasan/format output didefinisikan |
| `rubric_examples` | Pakai contoh/few-shot bila perlu |
| `rubric_iteration` | Bukti iterasi/penyempurnaan prompt |

**Logika:**

```
reviewed = prompt submissions yg punya skor rubrik (semua 5 dim terisi),
           urut reviewed_at DESC, ambil 3 TERAKHIR
perSubmission = mean(5 dimensi)            // 1–5 per submission
Prompting_Quality = mean(perSubmission over ≤3 terakhir)   // 0–5
```

- Ambil **3 prompt terakhir** (recency) → mencerminkan kemampuan terkini.
- Breakdown 5 dimensi juga di-_expose_ (buat detail/radar rubrik bila perlu).
- Belum ada prompt yang ter-skor rubrik → **n/a** (sementara, sampai ada review berskor).

---

## Pilar 3 — Tool Fluency

**Sumber:** `AilUseCaseSubmission` (`submitted_at != null`): `ai_tool`, `outcome_proof`.

Tiga komponen, masing-masing diskala ke **0–5**, lalu dibobot:

```
tool_breadth = clamp(distinct_tools, 0, 5)
               // distinct dari ai_tool (di-split koma, lowercase, trim)

artifact     = total_uc == 0 ? 0
             : clamp((uc_dgn_outcome_proof / total_uc) * 5, 0, 5)
               // proporsi use case yg punya bukti artifact

multi_model  = distinct_tools >= 3 ? 5
             : distinct_tools == 2 ? 3
             : 0
               // reward pakai >1 tool/model

Tool_Fluency = clamp(0.4*tool_breadth + 0.4*artifact + 0.2*multi_model, 0, 5)
```

- `telemetry` di proposal **diganti** `artifact` + `multi_model` dari data use case (Blocker B).
- Tanpa use case → 0.

---

## Pilar 4 — Use Case Diversity

**Sumber:** `AilUseCaseSubmission`: `type` (8 kategori enum), `is_accepted`.

```
distinct_categories = jumlah type unik yg pernah disubmit   // 0–8
base                = min(5, distinct_categories * 0.7)      // 7 kategori → 4.9
outcome_bonus       = min(1.0, accepted_count * 0.25)        // bonus dampak nyata
Use_Case_Diversity  = clamp(base + outcome_bonus, 0, 5)
```

- **Ganti** pilar lama "Workplace Application" (yg cuma hitung *jumlah* use case = volume)
  → **diversity** (lintas kategori) sesuai proposal.
- `outcome_bonus` dari jumlah use case yang **diterima** (`is_accepted`) — proksi dampak.
- Tanpa use case → 0.

> Catatan: nama `key`/label dimensi di endpoint perlu diubah dari
> `workplace_application` → `use_case_diversity`. Sinkronkan dengan label radar.

---

## Pilar 5 — AI Habit

**Sumber:** `AilUseCaseSubmission` (`hours_saved`, `hours_without_ai`) + **streak**
(aktivitas harian: quiz/video/material completion).

```
total_hours_saved = Σ max(0, hours_without_ai - hours_saved)   // jam dihemat
hours_score       = clamp(total_hours_saved / 8, 0, 5)         // 8 jam → 1, 40 jam → 5

active_days       = jumlah hari dgn ≥1 aktivitas (window analisa, mis. 90 hari)
window_days       = total hari di window
consistency       = clamp((active_days / max(window_days,1)) * 5, 0, 5)

AI_Habit = clamp(0.6*hours_score + 0.4*consistency, 0, 5)
```

- **Ganti** sumber lama (self-declared `frequency`) → `hours` nyata + `consistency` dari streak (Blocker B).
- `window` default **90 hari** terakhir (samakan dgn default streak panel). Bisa di-tune.

---

## Pilar 6 — Agentic Capabilities

**Sumber:** portfolio/demo komponen L4 (binary per komponen).

```
JIKA member.level < 4:
    Agentic = n/a   // DIKECUALIKAN dari rata-rata, bukan 0
SELAIN ITU (level >= 4):
    completed = jumlah komponen L4 yg lulus (binary)
    total     = jumlah komponen L4 (mis. 3: sistem multi-langkah, custom GPT, eval A/B)
    Agentic   = clamp((completed / total) * 5, 0, 5)
```

- **Keputusan:** untuk member **< L4 → n/a** dan **dikecualikan dari rata-rata** (lebih adil,
  tidak menyeret turun skor pemula). Di radar ditandai (dashed / titik kosong).
- Definisi komponen L4 menyusul saat fitur L4 dibangun (saat ini praktis selalu n/a).

---

## Rata-rata & tier

```
avg = mean(skor pilar yg TIDAK n/a)
```

Label tier dari `avg` (sesuai mapping existing): `<1` Beginner, `<2` …, dst sampai Advanced.

---

## Perubahan Schema  *(Blocker A)*

Tambah kolom rubrik di `AilPromptSubmission` (nullable, diisi saat review):

```prisma
model AilPromptSubmission {
  // ...field existing...
  rubric_specificity Int? @db.SmallInt   // 1–5
  rubric_context     Int? @db.SmallInt   // 1–5
  rubric_constraints Int? @db.SmallInt   // 1–5
  rubric_examples    Int? @db.SmallInt   // 1–5
  rubric_iteration   Int? @db.SmallInt   // 1–5
}
```

Yang perlu disentuh:

1. `prisma/schema.prisma` — tambah 5 kolom di atas.
2. **Update DDL** `sevenpreneur-ddl` & `ailene-ddl` (wajib per konvensi repo).
3. **UI review prompt (Champion)** — input skor 1–5 per 5 dimensi saat accept/review.
4. **Endpoint** `competencyProfile`:
   - Pilar 2 → baca rubrik 3 prompt terakhir (bukan acceptance-rate).
   - Pilar 4 → ganti ke distinct categories + outcome bonus, rename key/label.
   - Pilar 5 → hours + consistency (butuh data streak/active-days).
   - Pilar 6 → n/a sampai L4 + dikecualikan dari rata-rata.

---

## Keputusan default yang dipakai (bisa diubah)

| Item | Default | Alternatif |
| --- | --- | --- |
| AI Foundation | best score per quiz | avg across attempts |
| hours_score target | 40 jam = 5 (÷8) | sesuaikan target program |
| consistency window | 90 hari | 30 hari / rentang cohort |
| outcome_bonus | `min(1, accepted×0.25)` | bobot lain |
| Agentic < L4 | n/a, dikecualikan dari avg | tampil 0 |
