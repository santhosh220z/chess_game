import type { GameOverInfo } from '../types';

interface GameOverBannerProps {
  info: GameOverInfo | null;
  onNewGame: () => void;
  onReview: () => void;
  canReview: boolean;
}

export default function GameOverBanner({ info, onNewGame, onReview, canReview }: GameOverBannerProps) {
  if (!info) return null;

  const title =
    info.kind === 'checkmate'
      ? info.winner === 'w'
        ? 'Checkmate — White wins!'
        : info.winner === 'b'
          ? 'Checkmate — Black wins!'
          : 'Checkmate'
      : info.kind === 'stalemate'
        ? 'Stalemate'
        : info.kind === 'insufficient'
          ? 'Draw — Insufficient material'
          : info.kind === 'threefold'
            ? 'Draw — Threefold repetition'
            : info.kind === 'fifty-move'
              ? 'Draw — Fifty-move rule'
              : 'Draw';

  return (
    <div className="game-over-overlay">
      <div className="game-over-card">
        <h2>{title}</h2>
        <p>{info.reason}</p>
        <div className="game-over-actions">
          <button className="btn" onClick={onNewGame}>
            New Game
          </button>
          {canReview && (
            <button className="btn secondary" onClick={onReview}>
              Review Game
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
