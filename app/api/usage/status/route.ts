import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { anonymousIdFromRequest, PLAN_LIMITS, todayKey } from "@/lib/usage";

export async function GET(req: Request) {
  const date = todayKey();
  const anonId = anonymousIdFromRequest(req);
  const rows = await prisma.generationUsage.findMany({ where: { anonId, date } });
  const used = rows.reduce((sum, row) => sum + row.count, 0);
  const limit = PLAN_LIMITS.FREE;
  return NextResponse.json({ plan: "FREE", date, used, limit, remaining: Math.max(0, limit - used), rows });
}
