// Single-tenant deployment identity for the Ailene (AILN) platform.
//
// One Ailene deployment serves ONE company running ONE program, so the company
// name and program name are deployment-level config — not per-row data in the
// DB. Override per deployment via env (no code change, no migration):
//
//   NEXT_PUBLIC_AILN_ORG_NAME="Hutama Karya"
//   NEXT_PUBLIC_AILN_PROGRAM_NAME="Program AI Adoption Q2-2026"
//
// If/when Ailene goes multi-tenant, replace these with an `AilOrganization`
// entity + per-org query scoping (see backlog).

export const AILENE_ORG_NAME =
  process.env.NEXT_PUBLIC_AILN_ORG_NAME?.trim() || "";

export const AILENE_PROGRAM_NAME =
  process.env.NEXT_PUBLIC_AILN_PROGRAM_NAME?.trim() || "Program AI Adoption";
