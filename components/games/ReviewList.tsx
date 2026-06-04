type Review = { id: string; rating: number; comment?: string | null; user?: { username?: string | null; email?: string | null } | null };

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (!reviews.length) return <div className="card muted">No reviews yet. Be the first reviewer.</div>;
  return (
    <div className="grid">
      {reviews.map((review) => (
        <div key={review.id} className="card">
          <div className="row" style={{ justifyContent: "space-between" }}><strong>{review.user?.username || review.user?.email || "Player"}</strong><span style={{ color: "#facc15" }}>{"★".repeat(review.rating)}<span style={{ color: "#334155" }}>{"★".repeat(5 - review.rating)}</span></span></div>
          {review.comment && <p className="muted" style={{ lineHeight: 1.7 }}>{review.comment}</p>}
        </div>
      ))}
    </div>
  );
}
