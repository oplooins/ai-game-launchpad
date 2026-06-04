import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { configFromJson } from "@/lib/game-templates";

const schema = z.object({ versionId: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid restore request" }, { status: 400 });

    const version = await prisma.gameVersion.findUnique({ where: { id: parsed.data.versionId }, include: { game: true } });
    if (!version) return NextResponse.json({ error: "Version not found" }, { status: 404 });

    const config = configFromJson(version.configSnapshot);
    const game = await prisma.game.update({ where: { id: version.gameId }, data: { gameTemplate: config.template, gameConfig: config } });
    return NextResponse.json({ ok: true, game, config });
  } catch (error) {
    console.error("Restore version failed:", error);
    return NextResponse.json({ error: "Restore version failed" }, { status: 500 });
  }
}
