import { Optional } from "@/lib/optional-type";
import GetPrismaClient from "@/lib/prisma";
import { initTRPC, TRPCError } from "@trpc/server";
import dayjs from "dayjs";
import { headers } from "next/headers";

export type createTRPCContextOptions = {
  secretKey: string;
  sessionToken: string;
};

export async function createTRPCContext(
  opts: Optional<createTRPCContextOptions>
) {
  const prisma = GetPrismaClient();

  const secret = opts?.secretKey;

  async function getSessionTokenFromHeader() {
    const heads = await headers();
    const authHeader = heads.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    return authHeader.substring(7);
  }

  async function getUserFromSessionToken(sessionToken: string) {
    const tokenObj = await prisma.token.findUnique({
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
      where: {
        token: sessionToken,
      },
    });
    if (!tokenObj) {
      return null;
    }

    return tokenObj.user;
  }

  const sessionToken =
    opts?.sessionToken || (await getSessionTokenFromHeader());
  let user;
  if (sessionToken !== null) {
    user = await getUserFromSessionToken(sessionToken);
  }

  return { prisma, secret, user };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<TRPCContext>().create();

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;

export const publicProcedure = t.procedure.use(async (opts) => {
  const { ctx } = opts;
  if (!ctx.user) {
    if (!ctx.secret) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    if (ctx.secret !== process.env.SECRET_KEY_PUBLIC_API!) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
  }
  return opts.next(opts);
});

export const loggedInProcedure = t.procedure.use(async (opts) => {
  const { ctx } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return opts.next({
    ctx: {
      prisma: ctx.prisma,
      user: ctx.user, // not-null
    },
  });
});

export const superAdminProcedure = t.procedure.use(async (opts) => {
  const { ctx } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (ctx.user.role.name !== "Super Admin") {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return opts.next({
    ctx: {
      prisma: ctx.prisma,
      user: ctx.user, // not-null
    },
  });
});

export const administratorProcedure = t.procedure.use(async (opts) => {
  const { ctx } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (
    ctx.user.role.name !== "Administrator" &&
    ctx.user.role.name !== "Super Admin"
  ) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return opts.next({
    ctx: {
      prisma: ctx.prisma,
      user: ctx.user, // not-null
    },
  });
});

export const roleBasedProcedure = (roleList: string[]) => {
  return t.procedure.use(async (opts) => {
    const { ctx } = opts;
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    if (!roleList.includes(ctx.user.role.name)) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return opts.next({
      ctx: {
        prisma: ctx.prisma,
        user: ctx.user, // not-null
      },
    });
  });
};

export const ailMemberProcedure = t.procedure.use(async (opts) => {
  const { ctx } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  const ail_member = await ctx.prisma.ailMember.findUnique({
    where: { user_id: ctx.user.id },
    include: { current_level: true },
  });
  if (!ail_member) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Not an Ailene member.",
    });
  }

  const activityNow = dayjs();
  const activityThreshold = activityNow.subtract(10, "minute").toDate();
  if (
    !ail_member.last_active_at ||
    ail_member.last_active_at < activityThreshold
  ) {
    await ctx.prisma.ailMember.updateMany({
      where: {
        id: ail_member.id,
        OR: [
          { last_active_at: null },
          { last_active_at: { lt: activityThreshold } },
        ],
      },
      data: { last_active_at: activityNow.toDate() },
    });
  }

  return opts.next({
    ctx: {
      prisma: ctx.prisma,
      user: ctx.user, // not-null
      ail_member, // not-null
    },
  });
});

export const championProcedure = ailMemberProcedure.use(async (opts) => {
  if (opts.ctx.ail_member.role !== "CHAMPION") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Champion access only.",
    });
  }
  return opts.next(opts);
});

export const sponsorProcedure = ailMemberProcedure.use(async (opts) => {
  if (opts.ctx.ail_member.role !== "SPONSOR") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Sponsor access only." });
  }
  return opts.next(opts);
});
