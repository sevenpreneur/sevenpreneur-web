import GetPrismaClient from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_PAGE_SIZE = 20;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expectedKey = process.env.SECRET_KEY_PUBLIC_API;

  if (!expectedKey || authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const rawPage = Number(body?.page);
  const rawPageSize = Number(body?.page_size);
  const page =
    Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const pageSize =
    Number.isFinite(rawPageSize) && rawPageSize >= 1
      ? Math.floor(rawPageSize)
      : DEFAULT_PAGE_SIZE;

  const prisma = GetPrismaClient();

  const where = {
    status: "PUBLISHED" as const,
  };

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      select: {
        id: true,
        title: true,
        insight: true,
        image_url: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        slug_url: true,
        published_at: true,
      },
      where,
      orderBy: {
        published_at: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.article.count({ where }),
  ]);

  const list = articles.map((article) => ({
    ...article,
    status: "published" as const,
  }));

  return NextResponse.json({
    list,
    metapaging: {
      total_data: total,
      total_page: Math.max(1, Math.ceil(total / pageSize)),
      current_page: page,
      page_size: pageSize,
    },
  });
}
