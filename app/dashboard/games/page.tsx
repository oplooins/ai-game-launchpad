export const dynamic = "force-dynamic";

import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { prisma } from "@/lib/prisma";
import { averageRating } from "@/lib/stats";

export default async function DashboardGamesPage() {
  const games = await prisma.game.findMany({ include: { reviews: true, favorites: true }, orderBy: { createdAt: "desc" } });
  return (
    <main className="page">
      <Navbar />
      <section className="section">
        <div className="container">
          <p className="eyebrow">Developer Tools</p>
          <h1 className="h1">My Games</h1>
          <p className="lead">Review every submitted game, AI launch score, and operational stats.</p>
          <div className="table-list" style={{ marginTop: 28 }}>
            {games.map((game) => (
              <div className="card" key={game.id}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div>
                    <div className="row">
                      <h2 style={{ margin: 0 }}>{game.title}</h2>
                      <StatusBadge status={game.status} />
                      <span className="badge">AI {game.aiQualityScore ?? 72}/100</span>
                    </div>
                    <p className="muted">
                      {game.category || "Indie"} · {game.views} views · {game.plays} plays · {game.reviews.length} reviews · Rating {averageRating(game.reviews).toFixed(1)} · {game.favorites.length} saves
                    </p>
                    {game.aiQualitySummary && <p className="muted" style={{ lineHeight: 1.6 }}>AI note: {game.aiQualitySummary}</p>}
                    {game.rejectedReason && <p style={{ color: "#fca5a5" }}>Rejected reason: {game.rejectedReason}</p>}
                  </div>
                  <Link className="btn btn-secondary" href={`/games/${game.slug}`}>View</Link>
                </div>
              </div>
            ))}
            {!games.length && <div className="card muted">No games yet.</div>}
          </div>
        </div>
      </section>
    </main>
  );
}
