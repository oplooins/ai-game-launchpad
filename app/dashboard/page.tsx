export const dynamic = "force-dynamic";

import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { StatCard } from "@/components/ui/StatCard";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const [total, pending, approved, rejected, reviews, favorites] = await Promise.all([
    prisma.game.count(), prisma.game.count({ where: { status: "PENDING" } }), prisma.game.count({ where: { status: "APPROVED" } }), prisma.game.count({ where: { status: "REJECTED" } }), prisma.review.count(), prisma.favorite.count()
  ]);
  return <main className="page"><Navbar /><section className="section"><div className="container"><p className="eyebrow">Platform Core</p><h1 className="h1">Developer Dashboard</h1><p className="lead">Track submissions, moderation status, views, plays, reviews, and favorites.</p><div className="stats-grid" style={{ marginTop: 28 }}>{[['Total Games', total], ['Pending', pending], ['Approved', approved], ['Rejected', rejected], ['Reviews', reviews], ['Favorites', favorites]].map(([l, v]) => <StatCard key={String(l)} label={String(l)} value={v} />)}</div><div className="row" style={{ marginTop: 28 }}><Link className="btn btn-primary" href="/dashboard/games/new">Submit New Game</Link><Link className="btn btn-secondary" href="/dashboard/games">Manage Games</Link><Link className="btn btn-secondary" href="/dashboard/review">Review Queue</Link></div></div></section></main>;
}
