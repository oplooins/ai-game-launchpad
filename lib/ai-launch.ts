export type PublishPack = {
  twitter: string;
  reddit: string;
  productHunt: string;
  shortVideoScript: string;
  chinesePost: string;
  englishPost: string;
};

export type LaunchAnalysis = {
  qualityScore: number;
  qualitySummary: string;
  seoChecklist: string[];
  improvementTips: string[];
  publishPack: PublishPack;
};

export type StoreCopy = {
  title: string;
  category: string;
  shortDescription: string;
  description: string;
  tags: string[];
  seoTitle: string;
  promoLine: string;
  imagePrompt: string;
} & LaunchAnalysis;

export function stringArrayFromJson(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      return value.split("\n").map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
}

export function publishPackFromJson(value: unknown): PublishPack | null {
  if (!value) return null;
  if (typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    return {
      twitter: String(obj.twitter || ""),
      reddit: String(obj.reddit || ""),
      productHunt: String(obj.productHunt || ""),
      shortVideoScript: String(obj.shortVideoScript || ""),
      chinesePost: String(obj.chinesePost || ""),
      englishPost: String(obj.englishPost || ""),
    };
  }
  if (typeof value === "string") {
    try {
      return publishPackFromJson(JSON.parse(value));
    } catch {
      return null;
    }
  }
  return null;
}

export function normalizeQualityScore(score: unknown) {
  const numeric = Number(score);
  if (!Number.isFinite(numeric)) return 72;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}
