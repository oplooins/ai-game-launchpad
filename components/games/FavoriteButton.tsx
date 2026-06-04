"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FavoriteButton({ gameId, initialFavorite }: { gameId: string; initialFavorite: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [favorite, setFavorite] = useState(initialFavorite);

  async function toggleFavorite() {
    setLoading(true);
    const res = await fetch("/api/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameId }) });
    if (res.ok) {
      const data = await res.json();
      setFavorite(data.favorited);
      router.refresh();
    }
    setLoading(false);
  }

  return <button className="btn btn-secondary" disabled={loading} onClick={toggleFavorite}>{favorite ? "Saved ★" : "Save Game ☆"}</button>;
}
