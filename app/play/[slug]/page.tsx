export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UniversalGamePlayer } from "@/components/playable/UniversalGamePlayer";

export default async function PlayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = await prisma.game.findUnique({ where: { slug } });
  if (!game) notFound();

  const config = game.gameConfig || {
    template: game.gameTemplate || "webgl-arena",
    title: game.title,
    objective: game.shortDescription || "Survive, score, and defeat the boss.",
  };

  return <UniversalGamePlayer rawConfig={config} title={game.title} />;
}
