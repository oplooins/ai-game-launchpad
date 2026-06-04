import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePlayer } from "@/lib/auth";

const schema = z.object({ gameId: z.string().optional(), slug: z.string().optional(), score: z.number().int().min(0), duration: z.number().int().optional(), playerName: z.string().optional() });

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const gameId = searchParams.get("gameId");
  const where = slug ? { game: { slug } } : gameId ? { gameId } : {};
  const scores = await prisma.score.findMany({ where, orderBy: { score: "desc" }, take: 10 });
  return NextResponse.json(scores);
}

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid score" }, { status: 400 });
    const player = await requirePlayer();
    const data = parsed.data;
    const game = data.gameId ? await prisma.game.findUnique({ where: { id: data.gameId } }) : data.slug ? await prisma.game.findUnique({ where: { slug: data.slug } }) : null;
    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
    const score = await prisma.score.create({ data: { gameId: game.id, userId: player.id, playerName: data.playerName || player.username || "Demo Player", score: data.score, duration: data.duration || 0 } });
    return NextResponse.json(score);
  } catch (error) {
    console.error("Create score failed:", error);
    return NextResponse.json({ error: "Create score failed" }, { status: 500 });
  }
}
