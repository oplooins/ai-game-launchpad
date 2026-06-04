import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { configFromJson, GeneratedGameConfig, safeTemplate } from "@/lib/game-templates";
import { consumeGeneration } from "@/lib/usage";

const schema = z.object({
  slug: z.string().min(1),
  prompt: z.string().min(2).max(1000),
});

function arr(value: unknown, fallback: string[]) {
  return Array.isArray(value) ? value.map(String).filter(Boolean).slice(0, 10) : fallback;
}

function mergeByPrompt(base: GeneratedGameConfig, prompt: string): GeneratedGameConfig {
  const text = prompt.toLowerCase();
  let next: GeneratedGameConfig = { ...base, mechanics: [...base.mechanics] };

  if (/(space|spaceship|laser|alien|星|飞船|射击)/i.test(text)) next.template = "webgl-space";
  if (/(arena|fighter|combat|boss|battle|格斗|战斗|boss)/i.test(text)) next.template = "webgl-arena";
  if (/(runner|parkour|jump|跑酷|跳跃)/i.test(text)) next.template = "canvas-runner";
  if (/(dungeon|maze|rpg|treasure|地牢|迷宫|宝藏)/i.test(text)) next.template = "canvas-dungeon";
  next.template = safeTemplate(next.template);

  if (/(volcano|lava|fire|火山|熔岩|火焰)/i.test(text)) {
    next.theme = "volcanic lava arena";
    next.worldName = "Volcano Rift";
    next.primaryColor = "#fb7185";
    next.accentColor = "#f97316";
  }
  if (/(ice|frost|snow|冰|霜|雪)/i.test(text)) {
    next.theme = "frost crystal battlefield";
    next.worldName = "Frost Citadel";
    next.primaryColor = "#67e8f9";
    next.accentColor = "#a5f3fc";
  }
  if (/(cyber|neon|robot|赛博|霓虹|机器人)/i.test(text)) {
    next.theme = "cyberpunk neon district";
    next.worldName = "Neon Sector";
    next.secondaryColor = "#a78bfa";
  }
  if (/(boss|dragon|巨龙|首领|魔王)/i.test(text)) {
    next.enemyName = /ice|frost|冰|霜/i.test(text) ? "Frost Dragon Boss" : /fire|lava|火|熔岩/i.test(text) ? "Lava Titan Boss" : "Apex Boss";
    next.objective = `Defeat ${next.enemyName}, survive enemy waves, and collect power items.`;
    next.difficulty = "hard";
    next.mechanics = Array.from(new Set([...next.mechanics, "Boss wave", "Power item", "Survival objective"]));
  }
  if (/(coin|gold|金币|奖励)/i.test(text)) {
    next.mechanics = Array.from(new Set([...next.mechanics, "Collect coins", "Score rewards"]));
    next.objective = next.objective.includes("coin") ? next.objective : `${next.objective} Collect coins for bonus score.`;
  }
  if (/(shield|护盾|防御)/i.test(text)) next.mechanics = Array.from(new Set([...next.mechanics, "Shield pickup"]));
  if (/(fast|faster|speed|更快|速度)/i.test(text)) next.difficulty = "hard";
  if (/(easy|简单|休闲)/i.test(text)) next.difficulty = "easy";
  return next;
}

async function openAiModify(base: GeneratedGameConfig, prompt: string): Promise<GeneratedGameConfig | null> {
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
          { role: "system", content: "You modify a safe config-driven HTML5/WebGL game prototype. Return JSON only. Do not generate executable code." },
          { role: "user", content: `Current config:\n${JSON.stringify(base)}\n\nUser command: ${prompt}\n\nReturn the same JSON shape, changing template, worldName, theme, objective, enemyName, colors, difficulty, and mechanics if useful.` }
        ]
      })
    });
    if (!response.ok) return null;
    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content);
    return configFromJson({ ...base, ...parsed, mechanics: arr(parsed.mechanics, base.mechanics) });
  } catch (error) {
    console.error("AI sandbox update failed, fallback used:", error);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid sandbox update request" }, { status: 400 });
    const limit = await consumeGeneration({ req, type: "sandbox-update" });
    if (!limit.ok) {
      return NextResponse.json({ error: limit.message, limit }, { status: 429 });
    }
    const { slug, prompt } = parsed.data;
    const game = await prisma.game.findUnique({ where: { slug }, include: { versions: true } });
    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
    const base = configFromJson(game.gameConfig || { title: game.title, template: game.gameTemplate || "webgl-arena" });
    const next = (await openAiModify(base, prompt)) || mergeByPrompt(base, prompt);
    const versionNumber = game.versions.length + 1;
    await prisma.gameVersion.create({ data: { gameId: game.id, versionNumber, changePrompt: prompt, configSnapshot: next, titleSnapshot: game.title } });
    const updated = await prisma.game.update({ where: { id: game.id }, data: { gameTemplate: next.template, gameConfig: next } });
    return NextResponse.json({ ok: true, game: updated, versionNumber, config: next });
  } catch (error) {
    console.error("Sandbox update failed:", error);
    return NextResponse.json({ error: "Sandbox update failed" }, { status: 500 });
  }
}
