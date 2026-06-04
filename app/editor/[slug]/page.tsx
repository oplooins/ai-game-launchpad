export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { prisma } from "@/lib/prisma";
import { SandboxEditor } from "@/components/editor/SandboxEditor";

export default async function EditorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = await prisma.game.findUnique({ where: { slug }, include: { versions: { orderBy: { versionNumber: "desc" } } } });
  if (!game) notFound();
  return (
    <main className="page">
      <Navbar />
      <section className="section">
        <div className="container">
          <Link href={`/games/${game.slug}`} style={{ color: "#67e8f9" }}>← Back to game page</Link>
          <p className="eyebrow" style={{ marginTop: 22 }}>v0.8 Sandbox Editor</p>
          <h1 className="h1">Edit {game.title}</h1>
          <p className="lead">Use text commands to update world theme, enemies, items, boss, difficulty, and objectives. Each update is saved as a version.</p>
          <SandboxEditor slug={game.slug} title={game.title} initialConfig={game.gameConfig} versions={game.versions.map((version) => ({ id: version.id, versionNumber: version.versionNumber, changePrompt: version.changePrompt, createdAt: version.createdAt.toISOString() }))} />
        </div>
      </section>
    </main>
  );
}
