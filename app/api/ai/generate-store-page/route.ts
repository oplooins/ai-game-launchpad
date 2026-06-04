import { NextResponse } from "next/server";
import { z } from "zod";
import { consumeGeneration } from "@/lib/usage";
import { normalizeQualityScore, StoreCopy } from "@/lib/ai-launch";

const schema = z.object({ idea: z.string().min(10).max(1500) });

function titleFromIdea(idea: string) {
  const clean = idea.replace(/[^a-zA-Z0-9\u4e00-\u9fa5\s-]/g, " ").trim();
  const words = clean.split(/\s+/).filter(Boolean).slice(0, 4);
  if (!words.length) return "Untitled Indie Game";
  const title = words.join(" ").replace(/\b\w/g, (char) => char.toUpperCase());
  return title.length < 5 ? "Untitled Indie Game" : title;
}

function inferCategory(idea: string) {
  const text = idea.toLowerCase();
  if (text.includes("chess") || text.includes("board") || text.includes("棋")) return "Board Game";
  if (text.includes("space") || text.includes("ship") || text.includes("shooter") || text.includes("runner")) return "Arcade";
  if (text.includes("puzzle") || text.includes("match")) return "Puzzle";
  if (text.includes("rpg") || text.includes("dungeon") || text.includes("adventure")) return "Adventure";
  if (text.includes("monster") || text.includes("weapon") || text.includes("action")) return "Action";
  return "Indie";
}

function scoreIdea(idea: string) {
  let score = 58;
  const text = idea.toLowerCase();
  if (idea.length >= 80) score += 10;
  if (/(player|玩家|user)/i.test(idea)) score += 8;
  if (/(monster|enemy|puzzle|level|coins|upgrade|weapon|boss|score|collect|解锁|升级)/i.test(idea)) score += 12;
  if (/(html5|webgl|browser|iframe|online|网页|浏览器)/i.test(idea)) score += 8;
  if (idea.length > 250) score -= 4;
  return normalizeQualityScore(score);
}

function fallback(idea: string): StoreCopy {
  const clean = idea.trim();
  const title = titleFromIdea(clean);
  const category = inferCategory(clean);
  const tags = ["HTML5", "Web Game", category, "Indie"].filter((tag, index, arr) => arr.indexOf(tag) === index).slice(0, 6);
  const qualityScore = scoreIdea(clean);
  const seoChecklist = [
    "Use a clear game title with genre keywords.",
    "Keep the short description under 160 characters.",
    "Include gameplay verbs such as fight, collect, upgrade, solve, or survive.",
    "Add 3-6 tags that match genre, platform, and visual style.",
    "Use a 1200x630 cover image for sharing cards.",
  ];
  const improvementTips = [
    "Replace the placeholder cover with real gameplay art or a generated cover.",
    "Add one sentence explaining the player goal and win condition.",
    "Add a stronger call-to-action such as 'Play now in your browser'.",
  ];
  const shortDescription = clean.length > 160 ? `${clean.slice(0, 157)}...` : clean;

  return {
    title,
    category,
    shortDescription,
    description: `${clean}\n\nPlay directly in your browser. This launch page is optimized for quick discovery, testing, and player feedback.`,
    tags,
    seoTitle: `Play ${title} Online - Free HTML5 Game`,
    promoLine: "Play instantly in your browser — no install required.",
    imagePrompt: `${title} HTML5 game cover art, ${category.toLowerCase()} style, clean composition, high contrast, modern indie web game poster, 1200x630.`,
    qualityScore,
    qualitySummary:
      qualityScore >= 80
        ? "Strong launch-page concept. The idea is clear and usable for a public game page."
        : "Usable launch-page concept, but it needs stronger positioning, cover art, and clearer player goals before serious promotion.",
    seoChecklist,
    improvementTips,
    publishPack: {
      twitter: `I just launched ${title}, a browser-playable ${category.toLowerCase()} game. Play it instantly and send feedback.`,
      reddit: `I built ${title}, a small HTML5/WebGL ${category.toLowerCase()} game that runs directly in the browser. I am looking for feedback on the gameplay loop, difficulty, and launch page clarity.`,
      productHunt: `${title} is a lightweight browser game launch page with playable iframe, tags, reviews, and player feedback collection.`,
      shortVideoScript: `Hook: Can you survive one more level? Show 2 seconds of gameplay, 2 seconds of upgrades, 2 seconds of challenge, then CTA: Play ${title} in your browser.`,
      chinesePost: `我发布了一个网页小游戏《${title}》，可以直接在浏览器里试玩，不需要下载。欢迎帮我测试玩法、难度和页面介绍。`,
      englishPost: `I launched ${title}, a playable browser game page with instant play, tags, and reviews. Feedback is welcome.`,
    },
  };
}

function safeStringArray(value: unknown, fallbackValue: string[]) {
  if (!Array.isArray(value)) return fallbackValue;
  return value.map(String).map((item) => item.trim()).filter(Boolean).slice(0, 8);
}

async function openAiCopy(idea: string): Promise<StoreCopy | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  const safe = fallback(idea);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are an expert launch-page strategist for HTML5/WebGL indie games. Return valid JSON only. Be specific, concise, and practical.",
          },
          {
            role: "user",
            content: `Game idea: ${idea}\n\nReturn this exact JSON shape with no markdown:\n{\n  "title":"string",\n  "category":"string",\n  "shortDescription":"string",\n  "description":"string",\n  "tags":["string"],\n  "seoTitle":"string",\n  "promoLine":"string",\n  "imagePrompt":"string",\n  "qualityScore":85,\n  "qualitySummary":"string",\n  "seoChecklist":["string"],\n  "improvementTips":["string"],\n  "publishPack":{\n    "twitter":"string",\n    "reddit":"string",\n    "productHunt":"string",\n    "shortVideoScript":"string",\n    "chinesePost":"string",\n    "englishPost":"string"\n  }\n}`,
          },
        ],
      }),
    });

    if (!response.ok) return null;
    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content);
    const pack = parsed.publishPack || {};

    return {
      title: String(parsed.title || safe.title),
      category: String(parsed.category || safe.category),
      shortDescription: String(parsed.shortDescription || safe.shortDescription).slice(0, 180),
      description: String(parsed.description || safe.description),
      tags: safeStringArray(parsed.tags, safe.tags),
      seoTitle: String(parsed.seoTitle || safe.seoTitle),
      promoLine: String(parsed.promoLine || safe.promoLine),
      imagePrompt: String(parsed.imagePrompt || safe.imagePrompt),
      qualityScore: normalizeQualityScore(parsed.qualityScore || safe.qualityScore),
      qualitySummary: String(parsed.qualitySummary || safe.qualitySummary),
      seoChecklist: safeStringArray(parsed.seoChecklist, safe.seoChecklist),
      improvementTips: safeStringArray(parsed.improvementTips, safe.improvementTips),
      publishPack: {
        twitter: String(pack.twitter || safe.publishPack.twitter),
        reddit: String(pack.reddit || safe.publishPack.reddit),
        productHunt: String(pack.productHunt || safe.publishPack.productHunt),
        shortVideoScript: String(pack.shortVideoScript || safe.publishPack.shortVideoScript),
        chinesePost: String(pack.chinesePost || safe.publishPack.chinesePost),
        englishPost: String(pack.englishPost || safe.publishPack.englishPost),
      },
    };
  } catch (error) {
    console.error("OpenAI copy generation failed, using fallback:", error);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Game idea must be 10-1500 characters." }, { status: 400 });
    }

    const limit = await consumeGeneration({ req, type: "launch-copy" });
    if (!limit.ok) {
      return NextResponse.json({ error: limit.message, limit }, { status: 429 });
    }

    const aiCopy = await openAiCopy(parsed.data.idea);
    return NextResponse.json({ ...(aiCopy || fallback(parsed.data.idea)), usage: limit });
  } catch (error) {
    console.error("Generate store copy failed:", error);
    return NextResponse.json({ error: "Generate store copy failed" }, { status: 500 });
  }
}
