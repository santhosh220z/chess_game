import type { MoveRating } from '../types';

const RATING_LABELS: Record<MoveRating, string> = {
  Blunder: 'Blunder',
  Mistake: 'Mistake',
  Inaccuracy: 'Inaccuracy',
  Good: 'Good',
  Brilliant: 'Brilliant',
};

interface RatingBadgeProps {
  rating: MoveRating;
  loss: number;
}

export default function RatingBadge({ rating, loss }: RatingBadgeProps) {
  const label = RATING_LABELS[rating] ?? rating;
  return (
    <span className={`rating-badge ${rating.toLowerCase()}`}>
      {label}
      {loss > 0 && <span className="rating-loss"> −{loss.toFixed(0)}cp</span>}
    </span>
  );
}
