export function averageRating(reviews: { rating: number }[]): number {
  if (!reviews.length) return 0;
  return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
}
