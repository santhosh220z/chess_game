import type { Color, PieceSymbol } from 'chess.js';
import { pieceSymbol } from '../pieces';

interface PromotionDialogProps {
  color: Color;
  onSelect: (piece: PieceSymbol) => void;
  onCancel: () => void;
}

const PIECES: PieceSymbol[] = ['q', 'r', 'b', 'n'];

export default function PromotionDialog({ color, onSelect, onCancel }: PromotionDialogProps) {
  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Promote your pawn</h3>
        <div className="promotion-options">
          {PIECES.map((p) => (
            <button
              key={p}
              className="promotion-option"
              onClick={() => onSelect(p)}
              aria-label={`Promote to ${p}`}
            >
              <span className={color === 'w' ? 'white' : 'black'}>
                {pieceSymbol(p)}
              </span>
            </button>
          ))}
        </div>
        <button className="btn secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
