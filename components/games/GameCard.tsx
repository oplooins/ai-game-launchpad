import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { GAME_TEMPLATES } from "@/lib/game-templates";

type GameCardProps = {
  game: {
    id: string;
    title: string;
    slug: string;
    shortDescription?: string | null;
    coverImage?: string | null;
    category?: string | null;
    tags?: unknown;
    views?: number | null;
    status?: string | null;
    gameTemplate?: string | null;
  };
};

function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {}
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

export function GameCard({ game }: GameCardProps) {
  const tags = normalizeTags(game.tags);
  const safeSlug = game.slug || game.id;
  const template = game.gameTemplate && game.gameTemplate in GAME_TEMPLATES ? GAME_TEMPLATES[game.gameTemplate as keyof typeof GAME_TEMPLATES] : null;

  return (
    <Link href={`/games/${safeSlug}`} style={{ display: "block", textDecoration: "none", color: "inherit" }}>
      <article className="card" style={{ padding: 0, overflow: "hidden", minHeight: "100%" }}>
        <div
          style={{
            height: 260,
            background: game.gameTemplate?.startsWith("webgl")
              ? "radial-gradient(circle at 25% 20%, #0e7490, transparent 28%), radial-gradient(circle at 80% 30%, #7c3aed, transparent 26%), #111827"
              : "linear-gradient(135deg, #d1d5db, #f8fafc)",
            color: game.gameTemplate?.startsWith("webgl") ? "white" : "#999",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            fontWeight: 900,
            textAlign: "center",
            padding: 24,
          }}
        >
          {game.coverImage && !game.coverImage.includes("placehold.co") ? (
            <img src={game.coverImage} alt={game.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div>
              <div>{game.title || "Game"}</div>
              {template ? <div style={{ marginTop: 12, fontSize: 13, color: "#67e8f9" }}>{template.mode.toUpperCase()} PROTOTYPE</div> : null}
            </div>
          )}
        </div>

        <div style={{ padding: 20 }}>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
            <span className="badge">{game.category || "Indie"}</span>
            <span className="muted" style={{ fontSize: 12 }}>{game.views ?? 0} views</span>
          </div>
          <h3 style={{ color: "white", fontSize: 24, margin: "0 0 10px", lineHeight: 1.2 }}>{game.title}</h3>
          <p className="muted" style={{ margin: "0 0 16px", lineHeight: 1.6 }}>{game.shortDescription || "No description yet."}</p>
          {template ? <p className="muted" style={{ fontSize: 12, color: "#67e8f9" }}>{template.label}</p> : null}
          <div className="row" style={{ gap: 8 }}>
            {tags.slice(0, 5).map((tag) => <span className="badge" key={tag}>#{tag}</span>)}
          </div>
          {game.status ? <div style={{ marginTop: 14 }}><StatusBadge status={game.status as any} /></div> : null}
        </div>
      </article>
    </Link>
  );
}
