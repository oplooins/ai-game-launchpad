export const dynamic = "force-dynamic";

import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { GameCard } from "@/components/games/GameCard";
import { prisma } from "@/lib/prisma";

const examplePrompts = [
  "Generate a cyberpunk WebGL space shooter with enemy waves, lasers, upgrades, and a neon HUD.",
  "Create a fantasy dungeon crawler with treasure, skeleton enemies, traps, and a boss fight.",
  "Make a tower defense prototype where robots attack a neon city and players place energy turrets.",
];

export default async function HomePage() {
  const [games, pendingCount, reviewCount, scoreCount] = await Promise.all([
    prisma.game.findMany({ where: { status: "APPROVED" }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.game.count({ where: { status: "PENDING" } }),
    prisma.review.count(),
    prisma.score.count().catch(() => 0),
  ]);

  return (
    <main className="page">
      <Navbar />
      <section className="section">
        <div className="container" style={{ display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 36, alignItems: "center" }}>
          <div>
            <p className="eyebrow">AI Game LaunchPad v1.0 Workflow Studio</p>
            <h1 className="h1">Turn game ideas into playable, editable, shareable prototypes.</h1>
            <p className="lead">
              Describe a game idea, generate a playable HTML5/WebGL sandbox prototype, edit the world with AI commands, save versions, publish a launch page, and collect scores and feedback.
            </p>
            <div className="row" style={{ marginTop: 28 }}>
              <Link className="btn btn-primary" href="/studio">Open Workflow Studio</Link>
              <Link className="btn btn-secondary" href="/games">Explore Games</Link>
              <Link className="btn" href="/dashboard/games/new">Classic Generator</Link>
            </div>
            <p className="muted" style={{ marginTop: 18 }}>
              ChatGPT gives you code. AI Game LaunchPad gives you a playable, editable, shareable game page.
            </p>
          </div>
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Workflow</h2>
            {[
              "Describe your game idea",
              "Generate playable WebGL/Canvas prototype",
              "Edit world, enemies, items, quests, and difficulty",
              "Publish, share, embed, and collect feedback",
            ].map((item, i) => (
              <div key={item} className="card" style={{ marginTop: 12, padding: 14 }}>
                <strong style={{ color: "#22d3ee" }}>{i + 1}.</strong> {item}
              </div>
            ))}
            <div className="row" style={{ marginTop: 18 }}>
              <span className="badge">{games.length} approved</span>
              <span className="badge badge-pending">{pendingCount} pending</span>
              <span className="badge">{reviewCount} reviews</span>
              <span className="badge">{scoreCount} scores</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="container">
          <p className="eyebrow">Try these prompts</p>
          <h2 className="h2">Prompt starters</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginTop: 18 }}>
            {examplePrompts.map((prompt) => (
              <div className="card" key={prompt}>
                <p className="muted" style={{ lineHeight: 1.7 }}>{prompt}</p>
                <Link className="btn btn-secondary" href={`/studio?prompt=${encodeURIComponent(prompt)}`}>Use this workflow idea</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="container">
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <p className="eyebrow">Playable prototypes</p>
              <h2 className="h2">Latest approved games</h2>
            </div>
            <Link href="/games" style={{ color: "#67e8f9" }}>View all →</Link>
          </div>
          <div className="game-grid">{games.map((game) => <GameCard key={game.id} game={game} />)}</div>
          {!games.length && <div className="card muted">No approved games yet. Submit and approve the first game.</div>}
        </div>
      </section>
    </main>
  );
}
