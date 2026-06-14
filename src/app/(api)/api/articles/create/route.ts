import GetPrismaClient from "@/lib/prisma";
import {
  STATUS_CREATED,
  STATUS_INTERNAL_SERVER_ERROR,
} from "@/lib/status_code";
import { createSlugFromTitle } from "@/trpc/utils/slug";
import {
  arrayArticleBodyContent,
  numberIsID,
  stringIsTimestampTz,
  stringIsUUID,
  stringNotBlank,
} from "@/trpc/utils/validation";
import { AStatusEnum } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const CreateArticleSchema = z.object({
  title: stringNotBlank(),
  insight: stringNotBlank(),
  image_url: stringNotBlank(),
  body_content: arrayArticleBodyContent(),
  status: z.enum(AStatusEnum),
  category_id: numberIsID(),
  keywords: z.string(),
  author_id: stringIsUUID(),
  reviewer_id: stringIsUUID(),
  slug_url: stringNotBlank().optional(),
  published_at: stringIsTimestampTz(),
});

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expectedKey = process.env.SECRET_KEY_PUBLIC_API;
  if (!expectedKey || authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = CreateArticleSchema.safeParse(
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
  const slugUrl =
    parsed.data.slug_url ?? createSlugFromTitle(parsed.data.title);

  const createdArticle = await prisma.article.create({
    data: {
      title: parsed.data.title,
      insight: parsed.data.insight,
      image_url: parsed.data.image_url,
      body_content: parsed.data.body_content,
      status: parsed.data.status,
      category_id: parsed.data.category_id,
      keywords: parsed.data.keywords,
      author_id: parsed.data.author_id,
      reviewer_id: parsed.data.reviewer_id,
      slug_url: slugUrl,
      published_at: parsed.data.published_at,
    },
  });

  const theArticle = await prisma.article.findFirst({
    where: { id: createdArticle.id },
  });
  if (!theArticle) {
    return NextResponse.json(
      {
        code: STATUS_INTERNAL_SERVER_ERROR,
        message: "Failed to create a new article.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      code: STATUS_CREATED,
      message: "Success",
      article: theArticle,
    },
    { status: 201 }
  );
}
