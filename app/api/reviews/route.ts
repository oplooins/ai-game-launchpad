import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePlayer } from "@/lib/auth";

const schema = z.object({ gameId: z.string().min(1), rating: z.number().int().min(1).max(5), comment: z.string().max(1000).optional() });

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid review data" }, { status: 400 });
    const user = await requirePlayer();
    const review = await prisma.review.create({ data: { gameId: parsed.data.gameId, userId: user.id, rating: parsed.data.rating, comment: parsed.data.comment || "" }, include: { user: true } });
    return NextResponse.json(review);
  } catch (error) {
    console.error("Create review failed:", error);
    return NextResponse.json({ error: "Create review failed" }, { status: 500 });
  }
}
