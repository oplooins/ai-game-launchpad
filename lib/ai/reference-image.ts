export type ReferenceAppearance = {
  avatarStyle: "chibi" | "heroic" | "mech" | "creature" | "sprite";
  bodyType: "small" | "average" | "tall" | "heavy" | "tiny";
  skinColor: string;
  hairStyle: "short" | "bob" | "long" | "spiky" | "twinTails" | "hood" | "helmet" | "cap" | "none";
  hairColor: string;
  eyeColor: string;
  outfitStyle: "combat" | "robe" | "armor" | "casual" | "school" | "spaceSuit" | "ninja" | "fantasy";
  outfitColor: string;
  accessory: "visor" | "glasses" | "mask" | "cape" | "scarf" | "headphones" | "none";
  expression: "neutral" | "happy" | "angry" | "focused" | "surprised";
  referenceSummary: string;
  referenceImageUrl?: string;
  spriteUrl?: string;
  idleSpriteUrl?: string;
  runSpriteUrl?: string;
  attackSpriteUrl?: string;
  dashSpriteUrl?: string;
  hurtSpriteUrl?: string;
  deathSpriteUrl?: string;
  portraitUrl?: string;
  spriteSheetUrl?: string;
  spriteSheet?: {
    frameWidth: number;
    frameHeight: number;
    animations: Record<string, { row: number; frames: number; fps: number }>;
  };
  assetQuality?: "procedural" | "generated" | "uploaded" | "image-model";
  renderPolicy?: "strictSprite" | "allowProceduralDraft";
};

function safeColor(v: unknown, fallback: string) {
  const s = String(v || "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(s) ? s : fallback;
}

export function sanitizeReferenceAppearance(value: unknown, fallback?: Partial<ReferenceAppearance>): ReferenceAppearance {
  const obj = typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  const pick = <T extends string>(key: string, allowed: readonly T[], fb: T): T => {
    const v = String(obj[key] || fallback?.[key as keyof ReferenceAppearance] || "");
    return allowed.includes(v as T) ? (v as T) : fb;
  };
  return {
    avatarStyle: pick("avatarStyle", ["chibi", "heroic", "mech", "creature", "sprite"] as const, "chibi"),
    bodyType: pick("bodyType", ["small", "average", "tall", "heavy", "tiny"] as const, "small"),
    skinColor: safeColor(obj.skinColor, fallback?.skinColor || "#f5d0a9"),
    hairStyle: pick("hairStyle", ["short", "bob", "long", "spiky", "twinTails", "hood", "helmet", "cap", "none"] as const, "short"),
    hairColor: safeColor(obj.hairColor, fallback?.hairColor || "#111827"),
    eyeColor: safeColor(obj.eyeColor, fallback?.eyeColor || "#38bdf8"),
    outfitStyle: pick("outfitStyle", ["combat", "robe", "armor", "casual", "school", "spaceSuit", "ninja", "fantasy"] as const, "combat"),
    outfitColor: safeColor(obj.outfitColor, fallback?.outfitColor || "#22d3ee"),
    accessory: pick("accessory", ["visor", "glasses", "mask", "cape", "scarf", "headphones", "none"] as const, "visor"),
    expression: pick("expression", ["neutral", "happy", "angry", "focused", "surprised"] as const, "focused"),
    referenceSummary: String(obj.referenceSummary || fallback?.referenceSummary || "Q-style character inferred from prompt/reference.").slice(0, 180),
    referenceImageUrl: typeof obj.referenceImageUrl === "string" ? obj.referenceImageUrl : fallback?.referenceImageUrl,
    spriteUrl: typeof obj.spriteUrl === "string" ? obj.spriteUrl : fallback?.spriteUrl,
    idleSpriteUrl: typeof obj.idleSpriteUrl === "string" ? obj.idleSpriteUrl : fallback?.idleSpriteUrl,
    runSpriteUrl: typeof obj.runSpriteUrl === "string" ? obj.runSpriteUrl : fallback?.runSpriteUrl,
    attackSpriteUrl: typeof obj.attackSpriteUrl === "string" ? obj.attackSpriteUrl : fallback?.attackSpriteUrl,
    dashSpriteUrl: typeof obj.dashSpriteUrl === "string" ? obj.dashSpriteUrl : fallback?.dashSpriteUrl,
    hurtSpriteUrl: typeof obj.hurtSpriteUrl === "string" ? obj.hurtSpriteUrl : fallback?.hurtSpriteUrl,
    deathSpriteUrl: typeof obj.deathSpriteUrl === "string" ? obj.deathSpriteUrl : fallback?.deathSpriteUrl,
    portraitUrl: typeof obj.portraitUrl === "string" ? obj.portraitUrl : fallback?.portraitUrl,
    spriteSheetUrl: typeof obj.spriteSheetUrl === "string" ? obj.spriteSheetUrl : fallback?.spriteSheetUrl,
    spriteSheet: typeof obj.spriteSheet === "object" && obj.spriteSheet !== null ? obj.spriteSheet as ReferenceAppearance["spriteSheet"] : fallback?.spriteSheet,
    assetQuality: obj.assetQuality === "image-model" || obj.assetQuality === "uploaded" || obj.assetQuality === "generated" || obj.assetQuality === "procedural" ? obj.assetQuality : fallback?.assetQuality,
    renderPolicy: obj.renderPolicy === "strictSprite" || obj.renderPolicy === "allowProceduralDraft" ? obj.renderPolicy : fallback?.renderPolicy,
  };
}

export function fallbackReferenceAppearance(prompt = ""): ReferenceAppearance {
  const text = prompt.toLowerCase();
  return sanitizeReferenceAppearance({
    avatarStyle: /mech|robot|机甲/.test(text) ? "mech" : /monster|beast|怪物/.test(text) ? "creature" : "chibi",
    bodyType: /heavy|tank|重装/.test(text) ? "heavy" : "small",
    skinColor: "#f5d0a9",
    hairStyle: /helmet|头盔/.test(text) ? "helmet" : /hood|兜帽/.test(text) ? "hood" : /long|长发/.test(text) ? "long" : /twin|双马尾/.test(text) ? "twinTails" : "short",
    hairColor: /pink|粉/.test(text) ? "#f472b6" : /blue|蓝/.test(text) ? "#38bdf8" : /white|silver|白|银/.test(text) ? "#e5e7eb" : "#111827",
    eyeColor: /red|红/.test(text) ? "#ef4444" : /green|绿/.test(text) ? "#22c55e" : "#38bdf8",
    outfitStyle: /ninja|忍者/.test(text) ? "ninja" : /magic|mage|法师/.test(text) ? "robe" : /space|太空/.test(text) ? "spaceSuit" : /armor|铠甲/.test(text) ? "armor" : "combat",
    outfitColor: /red|红/.test(text) ? "#ef4444" : /purple|紫/.test(text) ? "#a855f7" : "#22d3ee",
    accessory: /glasses|眼镜/.test(text) ? "glasses" : /mask|面具/.test(text) ? "mask" : /cape|披风/.test(text) ? "cape" : /headphone|耳机/.test(text) ? "headphones" : "visor",
    expression: /happy|开心/.test(text) ? "happy" : /angry|愤怒/.test(text) ? "angry" : "focused",
    referenceSummary: "Fallback Q-style character generated from text prompt.",
  });
}
