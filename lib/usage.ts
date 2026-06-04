import { prisma } from "@/lib/prisma";

export type GenerationType = "launch-copy" | "playable-game" | "sandbox-update";

export const PLAN_LIMITS: Record<string, number> = {
  FREE: Number(process.env.FREE_DAILY_GENERATIONS || 3),
  CREATOR: Number(process.env.CREATOR_DAILY_GENERATIONS || 25),
  PRO: Number(process.env.PRO_DAILY_GENERATIONS || 100),
  TESTER: Number(process.env.TESTER_DAILY_GENERATIONS || 999999),
  ADMIN: Number(process.env.ADMIN_DAILY_GENERATIONS || 999999),
};

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function anonymousIdFromRequest(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0]?.trim() || "unknown";
  const agent = req.headers.get("user-agent") || "unknown";
  return `${ip}:${agent}`.slice(0, 240);
}

function isDevUnlimited(req: Request) {
  const enabled = process.env.DEV_UNLIMITED_GENERATIONS === "true";
  if (!enabled) return false;

  const host = req.headers.get("host") || "";
  const isLocal =
    host.includes("localhost") ||
    host.includes("127.0.0.1") ||
    host.includes("0.0.0.0");

  // 本地开发直接无限；线上不要随便开，除非你明确设置了 ADMIN_SECRET。
  return isLocal || Boolean(process.env.ADMIN_SECRET);
}

export async function consumeGeneration({
  req,
  userId,
  plan = "FREE",
  type,
}: {
  req: Request;
  userId?: string | null;
  plan?: string | null;
  type: GenerationType;
}) {
  if (isDevUnlimited(req)) {
    return {
      ok: true as const,
      limit: 999999,
      used: 0,
      remaining: 999999,
      message: "Developer unlimited generation mode enabled.",
    };
  }

  const date = todayKey();
  const anonId = userId ? null : anonymousIdFromRequest(req);
  const normalizedPlan = String(plan || "FREE").toUpperCase();
  const limit = PLAN_LIMITS[normalizedPlan] ?? PLAN_LIMITS.FREE;

  const usage = await prisma.generationUsage.findFirst({
    where: {
      userId: userId || null,
      anonId,
      type,
      date,
    },
  });

  if (usage && usage.count >= limit) {
    return {
      ok: false as const,
      limit,
      used: usage.count,
      remaining: 0,
      message: `Daily ${type} generation limit reached for ${normalizedPlan}.`,
    };
  }

  const next = usage
    ? await prisma.generationUsage.update({
        where: { id: usage.id },
        data: { count: { increment: 1 } },
      })
    : await prisma.generationUsage.create({
        data: { userId: userId || null, anonId, type, date, count: 1 },
      });

  return {
    ok: true as const,
    limit,
    used: next.count,
    remaining: Math.max(0, limit - next.count),
  };
}
