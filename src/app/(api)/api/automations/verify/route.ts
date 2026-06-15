import GetPrismaClient from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const VerifyAutomationSchema = z.object({
  key: z.string().trim().min(1),
});

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expectedKey = process.env.SECRET_KEY_PUBLIC_API;
  if (!expectedKey || authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = VerifyAutomationSchema.safeParse(
    await req.json().catch(() => ({}))
  );
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request body",
        issues: parsed.error.issues,
      },
      { status: 400 }
    );
  }

  const prisma = GetPrismaClient();

  const automation = await prisma.automation.findUnique({
    where: { key: parsed.data.key },
    select: {
      key: true,
      description: true,
      status: true,
      tags: true,
      updated_at: true,
    },
  });

  // Unknown key is treated as a tripped kill switch (fail-safe: do not run).
  if (!automation) {
    return NextResponse.json(
      {
        key: parsed.data.key,
        status: null,
        message: "Automation not found",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    key: automation.key,
    status: automation.status,
    description: automation.description,
    tags: automation.tags,
    updated_at: automation.updated_at,
  });
}
