
import type { ReferenceAppearance } from "./reference-image";
import { attachGeneratedSprites } from "./chibi-sprite";

type AssetPose = "idle" | "run" | "attack" | "dash" | "hurt" | "death" | "portrait";

export type CharacterAssetSet = {
  spriteUrl: string;
  idleSpriteUrl: string;
  runSpriteUrl: string;
  attackSpriteUrl: string;
  dashSpriteUrl: string;
  hurtSpriteUrl: string;
  deathSpriteUrl: string;
  portraitUrl: string;
  spriteSheetUrl?: string;
  spriteSheet?: {
    frameWidth: number;
    frameHeight: number;
    animations: Record<string, { row: number; frames: number; fps: number }>;
  };
  assetQuality: "image-model" | "generated" | "procedural";
  renderPolicy: "strictSprite";
};

function stripDataUrlPrefix(dataUrl: string) {
  const comma = dataUrl.indexOf(",");
  if (comma === -1) return dataUrl;
  return dataUrl.slice(comma + 1);
}

function dataUrlFromBase64(base64: string, mime = "image/png") {
  return `data:${mime};base64,${base64}`;
}

function posePrompt(appearance: ReferenceAppearance, pose: AssetPose, prompt = "") {
  const action =
    pose === "idle" ? "neutral idle standing pose, full body, readable silhouette" :
    pose === "run" ? "running loop pose, full body, dynamic legs, readable silhouette" :
    pose === "attack" ? "attack pose using the character weapon, full body, action slash or shot effect" :
    pose === "dash" ? "dash pose with motion streaks, full body, leaning forward" :
    pose === "hurt" ? "hurt reaction pose, full body, small impact effect" :
    pose === "death" ? "defeated pose, full body, readable but not graphic" :
    "portrait bust, clean avatar icon, expressive face";

  return [
    "Create a single transparent-background game character asset.",
    "Style: polished cute Q-style / chibi 2D game sprite, professional mobile RPG art, clean outline, no text, no labels, no UI, no multiple views.",
    `Pose: ${action}.`,
    `Character description: ${appearance.referenceSummary}`,
    `Avatar style: ${appearance.avatarStyle}. Body: ${appearance.bodyType}. Hair: ${appearance.hairStyle} ${appearance.hairColor}. Eyes: ${appearance.eyeColor}. Outfit: ${appearance.outfitStyle} ${appearance.outfitColor}. Accessory: ${appearance.accessory}. Expression: ${appearance.expression}.`,
    prompt ? `Game prompt context: ${prompt}` : "",
    "Keep the same character identity across all poses: same hair, same outfit, same colors, same accessory, same weapon style.",
    pose === "portrait" ? "Output only a bust portrait with transparent background." : "Output exactly one full-body character sprite centered with transparent background."
  ].filter(Boolean).join("\n");
}

async function generateOneImage(prompt: string, apiKey: string): Promise<string> {
  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      size: "1024x1024",
      n: 1,
      background: "transparent",
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Image generation failed: ${response.status} ${text.slice(0, 300)}`);
  }

  const json = await response.json();
  const item = json.data?.[0];

  if (item?.b64_json) return dataUrlFromBase64(item.b64_json, "image/png");
  if (item?.url) return item.url;

  throw new Error("Image generation returned no image asset.");
}

/**
 * Strict character asset generator.
 *
 * It tries to generate real image assets through the image model.
 * If STRICT_CHARACTER_ASSETS is not "false", failure throws instead of silently falling back.
 * Procedural SVG assets are only allowed when STRICT_CHARACTER_ASSETS=false for local/demo mode.
 */
export async function generateCharacterAssetSet(appearance: ReferenceAppearance, prompt = ""): Promise<CharacterAssetSet> {
  const strict = process.env.STRICT_CHARACTER_ASSETS !== "false";
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    if (strict) throw new Error("OPENAI_API_KEY is required for strict sprite asset generation.");
    const dev = attachGeneratedSprites(appearance);
    return {
      spriteUrl: dev.spriteUrl,
      idleSpriteUrl: dev.idleSpriteUrl,
      runSpriteUrl: dev.idleSpriteUrl,
      attackSpriteUrl: dev.attackSpriteUrl,
      dashSpriteUrl: dev.dashSpriteUrl,
      hurtSpriteUrl: dev.hurtSpriteUrl,
      deathSpriteUrl: dev.hurtSpriteUrl,
      portraitUrl: dev.spriteUrl,
      assetQuality: "procedural",
      renderPolicy: "strictSprite",
    };
  }

  try {
    const [idleSpriteUrl, runSpriteUrl, attackSpriteUrl, dashSpriteUrl, hurtSpriteUrl, deathSpriteUrl, portraitUrl] = await Promise.all([
      generateOneImage(posePrompt(appearance, "idle", prompt), apiKey),
      generateOneImage(posePrompt(appearance, "run", prompt), apiKey),
      generateOneImage(posePrompt(appearance, "attack", prompt), apiKey),
      generateOneImage(posePrompt(appearance, "dash", prompt), apiKey),
      generateOneImage(posePrompt(appearance, "hurt", prompt), apiKey),
      generateOneImage(posePrompt(appearance, "death", prompt), apiKey),
      generateOneImage(posePrompt(appearance, "portrait", prompt), apiKey),
    ]);

    return {
      spriteUrl: idleSpriteUrl,
      idleSpriteUrl,
      runSpriteUrl,
      attackSpriteUrl,
      dashSpriteUrl,
      hurtSpriteUrl,
      deathSpriteUrl,
      portraitUrl,
      assetQuality: "image-model",
      renderPolicy: "strictSprite",
    };
  } catch (error) {
    if (strict) throw error;
    const dev = attachGeneratedSprites(appearance);
    return {
      spriteUrl: dev.spriteUrl,
      idleSpriteUrl: dev.idleSpriteUrl,
      runSpriteUrl: dev.idleSpriteUrl,
      attackSpriteUrl: dev.attackSpriteUrl,
      dashSpriteUrl: dev.dashSpriteUrl,
      hurtSpriteUrl: dev.hurtSpriteUrl,
      deathSpriteUrl: dev.hurtSpriteUrl,
      portraitUrl: dev.spriteUrl,
      assetQuality: "procedural",
      renderPolicy: "strictSprite",
    };
  }
}

export function hasStrictCharacterAssets(appearance: Partial<ReferenceAppearance> | null | undefined) {
  return Boolean(
    appearance?.spriteUrl &&
    appearance?.idleSpriteUrl &&
    appearance?.attackSpriteUrl &&
    appearance?.dashSpriteUrl &&
    appearance?.hurtSpriteUrl &&
    appearance?.portraitUrl
  );
}
