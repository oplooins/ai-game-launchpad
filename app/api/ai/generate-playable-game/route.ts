import { NextResponse } from "next/server";
import { z } from "zod";
import { fallbackGameConfig, GeneratedGameConfig, safeTemplate } from "@/lib/game-templates";
import { consumeGeneration } from "@/lib/usage";
import { sanitizeReferenceAppearance } from "@/lib/ai/reference-image";
import { hasStrictCharacterAssets } from "@/lib/ai/character-asset";

const schema = z.object({ idea: z.string().min(10).max(1500), title: z.string().optional(), referenceAppearance: z.record(z.string(), z.unknown()).optional() });

function sanitizeColor(value: unknown, fallback: string) {
  const text = String(value || "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(text) ? text : fallback;
}

function sanitizeConfig(value: unknown, idea: string, title?: string, referenceAppearance?: unknown): GeneratedGameConfig & { referenceAppearance?: unknown; player?: unknown } {
  const base = fallbackGameConfig(idea, title);
  const obj = typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  const difficulty = obj.difficulty === "easy" || obj.difficulty === "medium" || obj.difficulty === "hard" ? obj.difficulty : base.difficulty;
  return {
    template: safeTemplate(obj.template || base.template),
    title: String(obj.title || title || base.title).slice(0, 80),
    theme: String(obj.theme || base.theme).slice(0, 80),
    objective: String(obj.objective || base.objective).slice(0, 220),
    playerName: String(obj.playerName || base.playerName).slice(0, 40),
    enemyName: String(obj.enemyName || base.enemyName).slice(0, 40),
    primaryColor: sanitizeColor(obj.primaryColor, base.primaryColor),
    secondaryColor: sanitizeColor(obj.secondaryColor, base.secondaryColor),
    accentColor: sanitizeColor(obj.accentColor, base.accentColor),
    difficulty,
    worldName: String(obj.worldName || base.worldName).slice(0, 60),
    mechanics: Array.isArray(obj.mechanics)
      ? obj.mechanics.map(String).filter(Boolean).slice(0, 6)
      : base.mechanics,
    referenceAppearance: referenceAppearance ? sanitizeReferenceAppearance(referenceAppearance) : undefined,
    player: referenceAppearance
      ? {
          avatarStyle: "sprite",
          ...sanitizeReferenceAppearance(referenceAppearance),
          renderPolicy: "strictSprite",
        }
      : undefined,
  };
}

async function openAiConfig(idea: string, title?: string): Promise<GeneratedGameConfig | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You configure playable HTML5 game prototypes. Choose a template and return valid JSON only. Do not generate code. Make the config feel specific to the user idea.",
          },
          {
            role: "user",
            content: `Idea: ${idea}\nSuggested title: ${title || ""}\n\nChoose exactly one template: webgl-arena, webgl-space, canvas-runner, canvas-dungeon, canvas-tower-defense, canvas-card-battle, canvas-platformer. Return this JSON shape:\n{\n  "template":"webgl-arena",\n  "title":"string",\n  "theme":"string",\n  "objective":"string",\n  "playerName":"string",\n  "enemyName":"string",\n  "primaryColor":"#22d3ee",\n  "secondaryColor":"#a78bfa",\n  "accentColor":"#f97316",\n  "difficulty":"easy|medium|hard",\n  "worldName":"string",\n  "mechanics":["string"]\n}`,
          },
        ],
      }),
    });
    if (!response.ok) return null;
    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) return null;
    return sanitizeConfig(JSON.parse(content), idea, title);
  } catch (error) {
    console.error("OpenAI playable-game config failed, using fallback:", error);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Game idea must be 10-1500 characters." }, { status: 400 });
    }
    const limit = await consumeGeneration({ req, type: "playable-game" });
    if (!limit.ok) {
      return NextResponse.json({ error: limit.message, limit }, { status: 429 });
    }
    const { idea, title, referenceAppearance } = parsed.data;

    if (referenceAppearance && !hasStrictCharacterAssets(referenceAppearance)) {
      return NextResponse.json(
        {
          error:
            "Strict character art mode requires spriteUrl, idleSpriteUrl, attackSpriteUrl, dashSpriteUrl, hurtSpriteUrl, and portraitUrl. Run Analyze Reference Image first.",
        },
        { status: 400 }
      );
    }

    const aiConfig = await openAiConfig(idea, title);
    const config = aiConfig ? sanitizeConfig(aiConfig, idea, title, referenceAppearance) : sanitizeConfig(fallbackGameConfig(idea, title), idea, title, referenceAppearance);
    return NextResponse.json({ template: config.template, config });
  } catch (error) {
    console.error("Generate playable game failed:", error);
    return NextResponse.json({ error: "Generate playable game failed" }, { status: 500 });
  }
}
