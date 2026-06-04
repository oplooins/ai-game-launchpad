export const dynamic = "force-dynamic";

import { Navbar } from "@/components/layout/Navbar";
import { GameCard } from "@/components/games/GameCard";
import { prisma } from "@/lib/prisma";

type SearchParams = { q?: string; category?: string; tag?: string };

export default async function GamesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = sp.q?.trim();
  const category = sp.category?.trim();
  const tag = sp.tag?.trim();
  const games = await prisma.game.findMany({
    where: {
      status: "APPROVED",
      ...(category ? { category: { contains: category } } : {}),
      ...(q ? { OR: [{ title: { contains: q } }, { description: { contains: q } }, { shortDescription: { contains: q } }, { category: { contains: q } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
  const filtered = tag ? games.filter((game) => JSON.stringify(game.tags || []).toLowerCase().includes(tag.toLowerCase())) : games;
  return (
    <main className="page"><Navbar /><section className="section"><div className="container"><p className="eyebrow">Game Library</p><h1 className="h1">Browse Games</h1><p className="lead">Search by title, category, description, or tags. Only approved games appear here.</p>
      <form className="card" style={{ margin: "28px 0" }}><div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 12 }}><input className="input" name="q" defaultValue={q || ""} placeholder="Search games..." /><input className="input" name="category" defaultValue={category || ""} placeholder="Category" /><input className="input" name="tag" defaultValue={tag || ""} placeholder="Tag" /><button className="btn btn-primary">Search</button></div></form>
      <div className="game-grid">{filtered.map((game) => <GameCard key={game.id} game={game} />)}</div>{!filtered.length && <div className="card muted">No approved games found.</div>}</div></section></main>
  );
}
