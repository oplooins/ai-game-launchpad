import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePlayer } from "@/lib/auth";

const schema = z.object({ gameId: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid favorite data" }, { status: 400 });
    const user = await requirePlayer();
    const existing = await prisma.favorite.findUnique({ where: { userId_gameId: { userId: user.id, gameId: parsed.data.gameId } } });
    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return NextResponse.json({ favorited: false });
    }
    await prisma.favorite.create({ data: { userId: user.id, gameId: parsed.data.gameId } });
    return NextResponse.json({ favorited: true });
  } catch (error) {
    console.error("Favorite failed:", error);
    return NextResponse.json({ error: "Favorite failed" }, { status: 500 });
  }
}
