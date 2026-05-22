import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    DOMAIN_MODE: process.env.DOMAIN_MODE ?? null,
    NEXT_PUBLIC_DOMAIN_MODE: process.env.NEXT_PUBLIC_DOMAIN_MODE ?? null,
    VERCEL_ENV: process.env.VERCEL_ENV ?? null,
    VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    VERCEL_URL: process.env.VERCEL_URL ?? null,
  });
}
