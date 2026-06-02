# Sevenpreneur Agent Instructions

## Project Overview

Sevenpreneur adalah multi-platform SaaS untuk entrepreneurship education, event commerce, content management, dan learning platform. Satu codebase Next.js memakai subdomain-based routing ke tiga platform utama:

| Subdomain | Route Group | Suffix Kode | Purpose |
| --- | --- | --- | --- |
| `www` | `(www)` | `SVP` | Public website: marketing, auth, events, cohorts, articles |
| `admin` | `(admin)` | `CMS` | Internal CMS untuk manage konten, user, transaksi, WhatsApp, B2B pipeline |
| `agora` | `(agora)` | `LMS` | Logged-in learning platform: cohorts, playlists, AI tools |

Platform Ailene/AILN dan staging `.net` sudah dihapus. Jangan menambahkan kembali route, komponen, config, schema, atau domain untuk `ailene`, `AILN`, `sevenpreneur.net`, atau env `staging`.

## Dev Commands

```bash
npm run dev       # Start dengan HTTPS via --experimental-https
npm run build     # prisma generate + next build
npm run lint      # ESLint check
```

Dev server wajib HTTPS karena Google OAuth dan subdomain rewrites membutuhkannya.

## Routing

Subdomain routing ditangani di `next.config.mjs` via rewrites:

- `www.sevenpreneur.com` -> `/www/*`
- `admin.sevenpreneur.com` -> `/admin/*`
- `agora.sevenpreneur.com` -> `/agora/*`
- local dev memakai `example.com` subdomains

Navigasi internal tetap path-based (`/admin/...`, `/www/...`, `/agora/...`). Jangan hardcode subdomain URL untuk `<Link>` atau `router.push`.

## API Layer

Semua data fetching internal lewat tRPC.

- Routers: `src/trpc/routers/`
- Main router: `src/trpc/routers/_app.ts`
- Client: `src/trpc/client.tsx`
- Context/procedures: `src/trpc/init.ts`

REST API routes hanya untuk webhooks, public API, atau external integrations seperti Xendit, WhatsApp, n8n, QStash, dan MCP.

### Procedures

- `publicProcedure`: unauthenticated atau public API secret
- `loggedInProcedure`: butuh session token valid
- `administratorProcedure`: Administrator atau Super Admin
- `superAdminProcedure`: Super Admin saja
- `roleBasedProcedure(roleList)`: custom role name check

### Endpoint Granularity

One endpoint = one service concern. Hindari endpoint "kitchen sink" yang menggabungkan banyak query hanya karena dipakai di satu halaman.

Pisahkan query supaya React Query cache/invalidation lebih granular, reusable, dan loading/error state tidak saling mengunci.

## Authentication

Auth memakai token-based session, bukan NextAuth.

- Session token disimpan di tabel `Token`
- Client mengirim `Authorization: Bearer <token>`
- tRPC context membaca token, validasi ke DB, lalu attach `ctx.user`
- Google OAuth callback ada di route `src/app/(www)/www/api/auth/callback/google/route.ts`

## Database

Database memakai Prisma + Supabase Postgres.

- Schema Prisma: `prisma/schema.prisma`
- DDL reference: `docs/db/sevenpreneur-ddl.sql`
- Prisma singleton: `src/lib/prisma.ts`
- Build menjalankan `prisma generate`

Saat mengubah struktur database, update keduanya:

- `prisma/schema.prisma`
- `docs/db/sevenpreneur-ddl.sql`

Jangan jalankan migration production tanpa review eksplisit.

## Background Jobs

- QStash: `src/lib/qstash.ts`
- Redis: `src/lib/redis.ts`
- Scheduled/background API routes ada di `src/app/(api)/api/qstash/`

## Payments

Xendit integration:

- Client/helper: `src/lib/xendit.ts`
- Webhook: `src/app/(api)/api/xendit/`
- Transaction routers: `src/trpc/routers/transaction/`

Selalu verify webhook signature sebelum processing.

## Component Conventions

### Naming Suffix

| Suffix | Dipakai di | Contoh |
| --- | --- | --- |
| `App*` prefix | Semua platform | `AppButton`, `AppModal` |
| `*SVP` | www saja | `HeroHomeSVP`, `FooterSVP` |
| `*CMS` | admin saja | `UserListCMS`, `CreateEventFormCMS` |
| `*LMS` | agora saja | `PlaylistDetailsLMS`, `CourseTabsLMS` |

Komponen dengan prefix `App` boleh lintas platform. Komponen dengan suffix spesifik hanya boleh dipakai di platform yang sesuai.

### Folder Structure

Komponen berada di `src/components/` berdasarkan purpose:

| Folder | Isi |
| --- | --- |
| `ui/` | Primitive shadcn/ui components |
| `buttons/` | Button variants |
| `cards/` | Card-shaped UI blocks |
| `charts/` | Data visualization wrappers |
| `customs/` | Customisasi library eksternal |
| `elements/` | Reusable UI elements |
| `emails/` | React Email templates |
| `fields/` | Form inputs, rich editor, file upload, select |
| `forms/` | Full form layout components |
| `gateways/` | Complex interactive sections |
| `heroes/` | Hero/banner sections |
| `indexes/` | List/index page components |
| `items/` | Line-item/list-row components |
| `labels/` | Label, badge, tag components |
| `messages/` | Message/notification/alert components |
| `modals/` | Dialog and drawer components |
| `navigations/` | Nav bars and sidebars |
| `pages/` | Full-page layout components |
| `reports/` | AI tool result report components |
| `states/` | Loading skeletons and empty states |
| `static-sections/` | Static marketing sections |
| `steppers/` | Multi-step wizard/stepper components |
| `svg-logos/` | Brand logos as React SVG components |
| `tables/` | Table components |
| `tabs/` | Tab panel components |
| `titles/` | Heading/title section components |

## Library Guidelines

Sebelum membuat helper baru, cek `src/lib/` dulu. Jika helper dipakai global, taruh di `src/lib/`. Jika hanya dipakai satu router/feature, simpan dekat feature itu.

File penting:

| File | Purpose |
| --- | --- |
| `actions.ts` | Next.js Server Actions |
| `after-payment.ts` | Post-payment enrollment |
| `app-types.ts` | Shared TypeScript types |
| `currency.ts` | Currency formatting |
| `date-time-manipulation.ts` | Date/time helper |
| `mailtrap.ts` | Email sender |
| `markdown-to-html.ts` | Markdown to HTML |
| `optional-type.ts` | Optional/nullable type helper |
| `price-calc.ts` | Price and discount calculation |
| `prisma.ts` | Prisma client singleton |
| `qstash.ts` | QStash client |
| `redis.ts` | Upstash Redis client |
| `status_code.ts` | HTTP/TRPC status constants |
| `supabase.ts` | Supabase Storage upload |
| `valid-redirect.ts` | Redirect URL allowlist guard |
| `whatsapp.ts` | WhatsApp API integration |
| `whatsapp-types.ts` | WhatsApp payload types |
| `whatsapp-utils.tsx` | WhatsApp formatting helpers |
| `xendit.ts` | Xendit payment gateway |

## Styling

- Tailwind CSS v4, tokens di `src/app/globals.css`
- Dark mode via `next-themes`
- Prefer Tailwind + Radix/shadcn primitives untuk UI
- MUI dipakai terutama untuk charts/data visualization
- Jangan tambahkan kembali color token khusus AILN

## Common Patterns

### Mutation Invalidation

```tsx
const utils = trpc.useUtils();
const mutation = trpc.something.create.useMutation({
  onSuccess: () => utils.something.list.invalidate(),
});
```

### React Email

- Templates di `src/components/emails/`
- Render HTML dengan `render()` dari `@react-email/render`
- Kirim via `sendEmail()` dari `src/lib/mailtrap.ts`
- Di file `.ts`, pakai `createElement()` dari React untuk instantiate component

### File Uploads

- Upload ke Supabase Storage via `src/lib/supabase.ts`
- Simpan public URL di field DB

### Date and Time

Gunakan `dayjs` untuk manipulasi dan formatting tanggal. Cek helper di `src/lib/date-time-manipulation.ts` sebelum membuat logic baru.

## What To Avoid

- Jangan pakai `fetch` langsung untuk data internal. Pakai tRPC.
- Jangan hardcode subdomain URL untuk navigasi internal.
- Jangan bypass procedure auth untuk protected data.
- Jangan pakai raw SQL kecuali Prisma tidak bisa express query tersebut.
- Jangan simpan secrets di kode.
- Jangan menambahkan staging `.net` domain atau Ailene/AILN references.
- Jangan import komponen platform-specific di luar route group/platform-nya.
