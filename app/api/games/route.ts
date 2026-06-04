import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireDeveloper } from "@/lib/auth";
import { createGameSlug } from "@/lib/slugify";
import { tagsToJson } from "@/lib/tags";
import { normalizeQualityScore } from "@/lib/ai-launch";
import { fallbackGameConfig, safeTemplate } from "@/lib/game-templates";

const createGameSchema = z.object({
  title: z.string().min(2).max(120),
  category: z.string().optional(),
  shortDescription: z.string().optional(),
  description: z.string().min(10),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  coverImage: z.string().optional(),
  playUrl: z.string().optional(),
  gameTemplate: z.string().optional(),
  gameConfig: z.record(z.string(), z.unknown()).optional(),
  seoTitle: z.string().optional(),
  promoLine: z.string().optional(),
  imagePrompt: z.string().optional(),
  aiQualityScore: z.number().optional(),
  aiQualitySummary: z.string().optional(),
  aiSeoChecklist: z.array(z.string()).optional(),
  aiImprovementTips: z.array(z.string()).optional(),
  aiPublishPack: z.record(z.string(), z.string()).optional(),
});

function normalizeTagsInput(tags: string | string[] | undefined) {
  if (Array.isArray(tags)) return tags.map(String).filter(Boolean);
  return tagsToJson(tags);
}

function validExternalOrRelativeUrl(value: string | undefined) {
  if (!value) return "";
  const text = value.trim();
  if (!text || text === "AI generated on publish") return "";
  if (text.startsWith("/")) return text;
  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:" ? text : "";
  } catch {
    return "";
  }
}

export async function GET() {
  const games = await prisma.game.findMany({ orderBy: { createdAt: "desc" }, include: { reviews: true } });
  return NextResponse.json(games);
}

export async function POST(req: Request) {
  try {
    const parsed = createGameSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid game data", details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const developer = await requireDeveloper();
    let slug = createGameSlug(data.title);
    while (await prisma.game.findUnique({ where: { slug } })) {
      slug = createGameSlug(data.title);
    }

    const fallbackConfig = fallbackGameConfig(data.description || data.shortDescription || data.title, data.title);
    const gameTemplate = safeTemplate(data.gameTemplate || data.gameConfig?.template || fallbackConfig.template);
    const gameConfig = {
      ...fallbackConfig,
      ...(data.gameConfig || {}),
      template: gameTemplate,
      title: data.title,
    };
    const submittedPlayUrl = validExternalOrRelativeUrl(data.playUrl);
    const playUrl = submittedPlayUrl || `/play/${slug}`;

    const game = await prisma.game.create({
      data: {
        title: data.title,
        slug,
        category: data.category || "Indie",
        shortDescription: data.shortDescription || "",
        description: data.description,
        tags: normalizeTagsInput(data.tags),
        screenshots: [],
        coverImage: data.coverImage || "https://placehold.co/1200x630/png",
        playUrl,
        gameTemplate,
        gameConfig,
        seoTitle: data.seoTitle || data.title,
        promoLine: data.promoLine || "",
        imagePrompt: data.imagePrompt || "",
        aiQualityScore: normalizeQualityScore(data.aiQualityScore),
        aiQualitySummary: data.aiQualitySummary || "",
        aiSeoChecklist: data.aiSeoChecklist || [],
        aiImprovementTips: data.aiImprovementTips || [],
        aiPublishPack: data.aiPublishPack || {},
        status: "PENDING",
        developerId: developer.id,
      },
    });

    return NextResponse.json({ ok: true, game, redirectTo: "/dashboard/review" });
  } catch (error) {
    console.error("Create game failed:", error);
    return NextResponse.json({ error: "Create game failed" }, { status: 500 });
  }
}
