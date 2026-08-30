import type { Piece, Square as SquarePos } from 'chess.js';
import { pieceSymbol } from '../pieces';

interface SquareProps {
  piece: Piece | null;
  position: SquarePos;
  isLight: boolean;
  isSelected: boolean;
  isLegal: boolean;
  isLastMove: boolean;
  isCheck: boolean;
  onSquareClick: (square: SquarePos) => void;
}

export default function Square({
  piece,
  position,
  isLight,
  isSelected,
  isLegal,
  isLastMove,
  isCheck,
  onSquareClick,
}: SquareProps) {
  const className = [
    'square',
    isLight ? 'light' : 'dark',
    isSelected ? 'selected' : '',
    isLastMove ? 'last-move' : '',
    isCheck ? 'check' : '',
    isLegal ? 'legal' : '',
  ]
    .join(' ')
    .trim();

  const file = position[0];
  const rank = position[1];

  return (
    <div className={className} onClick={() => onSquareClick(position)}>
      {rank === '1' && (
        <span className={`coord file ${isLight ? '' : 'on-dark'}`}>{file}</span>
      )}
      {file === 'a' && (
        <span className={`coord rank ${isLight ? '' : 'on-dark'}`}>{rank}</span>
      )}
      {isLegal && !piece && <div className="legal-dot" />}
      {isLegal && piece && <div className="legal-ring" />}
      {piece && (
        <div className="piece">
          <span className={piece.color === 'w' ? 'white' : 'black'}>
            {pieceSymbol(piece.type)}
          </span>
        </div>
      )}
    </div>
  );
}
