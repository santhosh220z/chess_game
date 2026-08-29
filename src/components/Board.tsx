import { Chess } from 'chess.js';
import type { Color, Piece, Square } from 'chess.js';
import SquareComponent from './Square';

interface BoardProps {
  chess: Chess;
  selected: Square | null;
  legalTargets: Set<string>;
  lastMove: { from: string; to: string } | null;
  checkSquare: Square | null;
  onSquareClick: (square: Square) => void;
  boardOrientation: Color;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

export default function Board({
  chess,
  selected,
  legalTargets,
  lastMove,
  checkSquare,
  onSquareClick,
  boardOrientation,
}: BoardProps) {
  const board = chess.board();
  const ranks = boardOrientation === 'w' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="board">
      {ranks.map((rank) => {
        const files = boardOrientation === 'w' ? FILES : [...FILES].reverse();
        return files.map((file, fileIndex) => {
          const square = (file + rank) as Square;
          const row = board[8 - rank];
          const cell = row ? row[fileIndex] : null;
          const piece: Piece | null = cell
            ? { type: cell.type, color: cell.color }
            : null;
          const isLight = (fileIndex + (8 - rank)) % 2 !== 0;
          const isSelected = selected === square;
          const isLegal = legalTargets.has(square);
          const isLastMove =
            lastMove?.from === square || lastMove?.to === square;
          const isCheck = checkSquare === square;

          return (
            <SquareComponent
              key={square}
              piece={piece}
              position={square}
              isLight={isLight}
              isSelected={isSelected}
              isLegal={isLegal}
              isLastMove={isLastMove}
              isCheck={isCheck}
              onSquareClick={onSquareClick}
            />
          );
        });
      })}
    </div>
  );
}
