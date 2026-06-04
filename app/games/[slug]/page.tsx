export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { ReviewForm } from "@/components/games/ReviewForm";
import { ReviewList } from "@/components/games/ReviewList";
import { FavoriteButton } from "@/components/games/FavoriteButton";
import { prisma } from "@/lib/prisma";
import { normalizeTags } from "@/lib/tags";
import { averageRating } from "@/lib/stats";
import { requirePlayer } from "@/lib/auth";
import { publishPackFromJson, stringArrayFromJson } from "@/lib/ai-launch";

function CopyBlock({ title, text }: { title: string; text: string }) {
  if (!text) return null;
  return (
    <div className="card" style={{ padding: 16 }}>
      <p className="eyebrow" style={{ marginBottom: 8 }}>{title}</p>
      <p className="muted" style={{ whiteSpace: "pre-line", lineHeight: 1.7 }}>{text}</p>
    </div>
  );
}

export default async function GameDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const player = await requirePlayer();
  const game = await prisma.game.update({
    where: { slug },
    data: { views: { increment: 1 } },
    include: { developer: true, reviews: { include: { user: true }, orderBy: { createdAt: "desc" } }, favorites: { where: { userId: player.id } }, scores: { orderBy: { score: "desc" }, take: 10 }, versions: { orderBy: { versionNumber: "desc" }, take: 5 } },
  }).catch(() => null);
  if (!game) notFound();
  const tags = normalizeTags(game.tags);
  const avg = averageRating(game.reviews);
  const checklist = stringArrayFromJson(game.aiSeoChecklist);
  const tips = stringArrayFromJson(game.aiImprovementTips);
  const publishPack = publishPackFromJson(game.aiPublishPack);
  const score = game.aiQualityScore ?? 0;

  return (
    <main className="page">
      <Navbar />
      <section className="section">
        <div className="container">
          <Link href="/games" style={{ color: "#67e8f9" }}>← Back to games</Link>
          <div className="detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 28, marginTop: 28 }}>
            <div>
              <p className="eyebrow">{game.category || "Indie"}</p>
              <h1 className="h1">{game.title}</h1>
              <p className="lead">{game.shortDescription || game.description}</p>
              <div className="row">
                {tags.map((tag) => <span className="badge" key={tag}>#{tag}</span>)}
                <FavoriteButton gameId={game.id} initialFavorite={game.favorites.length > 0} />
              </div>
            </div>
            <aside className="card">
              <h2 style={{ marginTop: 0 }}>Game Stats</h2>
              <p>Views: {game.views}</p>
              <p>Plays: {game.plays}</p>
              <p>Reviews: {game.reviews.length}</p>
              <p>Average rating: {avg.toFixed(1)}</p>
              <p>AI launch score: {score || "Not scored"}</p>
              <p>Developer: {game.developer?.username || "Unknown"}</p>
              <p>Versions: {game.versions.length}</p>
              <p>Top score: {game.scores[0]?.score ?? 0}</p>
            </aside>
          </div>

          <div className="row" style={{ marginTop: 24 }}>
            <Link className="btn btn-primary" href={`/editor/${game.slug}`}>Open AI Sandbox Editor</Link>
            <Link className="btn" href={`/play/${game.slug}`} target="_blank">Open Play Page</Link>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden", marginTop: 24 }}>
            <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)", color: "#cbd5e1" }}>HTML5 / WebGL Player</div>
            <iframe src={game.playUrl} title={game.title} allowFullScreen style={{ width: "100%", height: 680, border: 0, display: "block", background: "black" }} />
          </div>



          <section style={{ marginTop: 32, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <div className="card">
              <h2 style={{ marginTop: 0 }}>Leaderboard</h2>
              {game.scores.length === 0 ? (
                <p className="muted">No scores yet. Play the game and submit a score in a later build.</p>
              ) : (
                <ol style={{ lineHeight: 2, color: "#cbd5e1" }}>
                  {game.scores.map((score) => (
                    <li key={score.id}>{score.playerName || "Player"}: {score.score}</li>
                  ))}
                </ol>
              )}
            </div>
            <div className="card">
              <h2 style={{ marginTop: 0 }}>Share / Embed</h2>
              <p className="muted">Copy this iframe to embed the playable prototype on another site.</p>
              <pre style={{ whiteSpace: "pre-wrap", background: "#020617", border: "1px solid var(--border)", borderRadius: 12, padding: 12, color: "#cbd5e1", fontSize: 12 }}>{`<iframe src="${process.env.NEXT_PUBLIC_APP_URL || "https://your-site.netlify.app"}/play/${game.slug}" width="960" height="540" allowfullscreen></iframe>`}</pre>
            </div>
          </section>

          <section className="review-layout" style={{ marginTop: 32, display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, alignItems: "start" }}>
            <div className="card">
              <h2>About this game</h2>
              <p className="lead" style={{ whiteSpace: "pre-line" }}>{game.description}</p>
              <h2>Reviews</h2>
              <ReviewList reviews={game.reviews} />
            </div>
            <ReviewForm gameId={game.id} />
          </section>

          <section style={{ marginTop: 32 }}>
            <p className="eyebrow">AI Launch Kit</p>
            <h2 className="h2">SEO, quality score, and publish pack</h2>
            <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24, alignItems: "start", marginTop: 18 }}>
              <div className="card">
                <p className="muted">AI Quality Score</p>
                <div style={{ fontSize: 56, fontWeight: 900 }}>{score || 72}<span style={{ fontSize: 20, color: "#94a3b8" }}>/100</span></div>
                <p className="muted" style={{ lineHeight: 1.7 }}>{game.aiQualitySummary || "This game page has enough structure for testing. Add stronger assets and positioning before serious promotion."}</p>
              </div>
              <div style={{ display: "grid", gap: 16 }}>
                <div className="card">
                  <h3 style={{ marginTop: 0 }}>SEO Checklist</h3>
                  <ul style={{ lineHeight: 1.9, color: "#cbd5e1" }}>
                    {(checklist.length ? checklist : ["Use a clear title.", "Add strong tags.", "Keep the short description concise."]).map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
                <div className="card">
                  <h3 style={{ marginTop: 0 }}>Improvement Tips</h3>
                  <ul style={{ lineHeight: 1.9, color: "#cbd5e1" }}>
                    {(tips.length ? tips : ["Replace placeholder cover art.", "Add a clear player goal.", "Add gameplay screenshots."]).map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              </div>
            </div>

            {publishPack && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginTop: 18 }}>
                <CopyBlock title="X / Twitter" text={publishPack.twitter} />
                <CopyBlock title="Reddit" text={publishPack.reddit} />
                <CopyBlock title="Product Hunt" text={publishPack.productHunt} />
                <CopyBlock title="Short video script" text={publishPack.shortVideoScript} />
                <CopyBlock title="中文推广文案" text={publishPack.chinesePost} />
                <CopyBlock title="English post" text={publishPack.englishPost} />
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
