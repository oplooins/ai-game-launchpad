import { PrismaClient } from "@prisma/client";
import { slugify } from "../lib/slugify";
import { fallbackGameConfig } from "../lib/game-templates";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({ where: { email: "admin@launchpad.local" }, update: { role: "ADMIN" }, create: { email: "admin@launchpad.local", username: "Demo Admin", role: "ADMIN" } });
  const developer = await prisma.user.upsert({ where: { email: "developer@launchpad.local" }, update: { role: "DEVELOPER" }, create: { email: "developer@launchpad.local", username: "Demo Developer", role: "DEVELOPER" } });
  await prisma.user.upsert({ where: { email: "player@launchpad.local" }, update: { role: "PLAYER" }, create: { email: "player@launchpad.local", username: "Demo Player", role: "PLAYER" } });

  const demoGames = [
    { title: "Pixel Dungeon Demo", category: "Adventure", description: "A tiny HTML5 dungeon crawler demo for testing the platform.", shortDescription: "A tiny HTML5 dungeon crawler demo for testing the platform.", playUrl: "/play/pixel-dungeon-demo", gameTemplate: "canvas-dungeon", gameConfig: fallbackGameConfig("pixel dungeon crawler adventure", "Pixel Dungeon Demo"), coverImage: "https://placehold.co/1200x630/png?text=Pixel+Dungeon+Demo", tags: ["Pixel", "Dungeon", "HTML5", "Adventure"], status: "APPROVED" as const, aiQualityScore: 84 },
    { title: "Pending Space Runner", category: "Arcade", description: "A fast browser runner awaiting admin review.", shortDescription: "A fast browser runner awaiting admin review.", playUrl: "/play/pending-space-runner", gameTemplate: "canvas-runner", gameConfig: fallbackGameConfig("fast runner arcade obstacle game", "Pending Space Runner"), coverImage: "https://placehold.co/1200x630/png?text=Pending+Space+Runner", tags: ["Runner", "Arcade", "HTML5"], status: "PENDING" as const, aiQualityScore: 76 },
  ];

  for (const data of demoGames) {
    await prisma.game.upsert({
      where: { slug: slugify(data.title) },
      update: {},
      create: {
        ...data,
        slug: slugify(data.title),
        developerId: developer.id,
        screenshots: [],
        seoTitle: `Play ${data.title} Online`,
        promoLine: "Play directly in your browser.",
        imagePrompt: "Clean indie web game poster.",
        aiQualitySummary: "Demo launch page with playable iframe, tags, and review collection.",
        aiSeoChecklist: ["Use a clear genre keyword", "Keep short description concise", "Add a real cover image", "Include 3-6 relevant tags"],
        aiImprovementTips: ["Replace placeholder art", "Add gameplay screenshots", "Write a stronger call-to-action"],
        aiPublishPack: {
          twitter: `Play ${data.title} directly in your browser and send feedback.`,
          reddit: `I published ${data.title}, a browser-playable HTML5 game demo. Looking for feedback.`,
          productHunt: `${data.title} is a playable browser game page with reviews and launch copy.`,
          shortVideoScript: "Show gameplay, show challenge, show CTA: play in browser.",
          chinesePost: `我发布了一个网页小游戏《${data.title}》，可以直接在浏览器试玩，欢迎反馈。`,
          englishPost: `I launched ${data.title}, a playable browser game page. Feedback is welcome.`,
        },
      },
    });
  }

  console.log("Seed complete", { admin: admin.email, developer: developer.email });
}

main().finally(async () => prisma.$disconnect());
