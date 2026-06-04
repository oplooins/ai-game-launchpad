export const dynamic = "force-dynamic";

import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { prisma } from "@/lib/prisma";
import { adminUrl, isAdminProtectionEnabled, isValidAdminSecret } from "@/lib/admin";

export default async function ReviewQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ admin?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const adminSecret = resolvedSearchParams.admin || "";
  const protectedMode = isAdminProtectionEnabled();

  if (protectedMode && !isValidAdminSecret(adminSecret)) {
    return (
      <main className="page">
        <Navbar />
        <section className="section">
          <div className="container" style={{ maxWidth: 720 }}>
            <p className="eyebrow">Admin Protected</p>
            <h1 className="h1">Review Queue Locked</h1>
            <p className="lead">
              This deployment has admin protection enabled. Add the admin token to the URL to continue.
            </p>
            <div className="card" style={{ marginTop: 24 }}>
              <p className="muted" style={{ marginTop: 0 }}>
                Format:
              </p>
              <code style={{ color: "#67e8f9", wordBreak: "break-all" }}>
                /dashboard/review?admin=YOUR_ADMIN_SECRET
              </code>
            </div>
            <p className="muted">
              For local demo mode, leave <code>ADMIN_SECRET</code> empty in <code>.env</code>.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const games = await prisma.game.findMany({
    where: { status: "PENDING" },
    include: { developer: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="page">
      <Navbar />
      <section className="section">
        <div className="container">
          <p className="eyebrow">Admin Moderation</p>
          <h1 className="h1">Review Queue</h1>
          <p className="lead">Approve or reject submitted games before they appear publicly.</p>

          {protectedMode && (
            <div className="card" style={{ marginTop: 20, borderColor: "#164e63" }}>
              <strong>Admin protection is active.</strong>
              <p className="muted" style={{ marginBottom: 0 }}>
                Keep this review URL private. Do not publish the admin token.
              </p>
            </div>
          )}

          <div className="table-list" style={{ marginTop: 28 }}>
            {games.map((game) => (
              <div
                key={game.id}
                className="card"
                style={{
                  display: "grid",
                  gridTemplateColumns: "180px 1fr auto",
                  gap: 20,
                  alignItems: "center",
                }}
              >
                <img
                  src={game.coverImage || "https://placehold.co/1200x630/png"}
                  alt={game.title}
                  style={{ width: 180, aspectRatio: "16/9", objectFit: "cover", borderRadius: 14 }}
                />
                <div>
                  <div className="row">
                    <h2 style={{ margin: 0 }}>{game.title}</h2>
                    <StatusBadge status={game.status} />
                  </div>
                  <p className="muted">{game.shortDescription || game.description}</p>
                  <p className="muted" style={{ fontSize: 13 }}>
                    Developer: {game.developer?.username || "Unknown"}
                  </p>
                </div>
                <div className="grid" style={{ gap: 10 }}>
                  <form action={adminUrl(`/api/admin/games/${game.id}/approve`, adminSecret)} method="post">
                    {protectedMode && <input type="hidden" name="admin" value={adminSecret} />}
                    <button className="btn btn-green" style={{ width: 130 }}>
                      Approve
                    </button>
                  </form>
                  <form action={adminUrl(`/api/admin/games/${game.id}/reject`, adminSecret)} method="post">
                    {protectedMode && <input type="hidden" name="admin" value={adminSecret} />}
                    <input name="reason" placeholder="Reason" className="input" style={{ width: 130, marginBottom: 8 }} />
                    <button className="btn btn-red" style={{ width: 130 }}>
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            ))}
            {!games.length && <div className="card muted">No pending games.</div>}
          </div>
        </div>
      </section>
    </main>
  );
}
