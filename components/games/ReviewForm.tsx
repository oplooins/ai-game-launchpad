"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReviewForm({ gameId }: { gameId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submitReview() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit review");
      setComment("");
      setRating(5);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Leave a Review</h2>
      {error && <p style={{ color: "#fca5a5" }}>{error}</p>}
      <label><span className="label">Rating</span><select className="select" value={rating} onChange={(e) => setRating(Number(e.target.value))}>{[5,4,3,2,1].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
      <label style={{ display: "block", marginTop: 14 }}><span className="label">Comment</span><textarea className="textarea" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What did you think about this game?" /></label>
      <button className="btn btn-primary" onClick={submitReview} disabled={loading} style={{ marginTop: 14 }}>{loading ? "Submitting..." : "Submit Review"}</button>
    </div>
  );
}
