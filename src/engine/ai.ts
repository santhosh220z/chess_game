import { Chess, Move } from 'chess.js';
import type { Square } from 'chess.js';
import type { Difficulty, MoveRecord } from '../types';

const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece-square tables (from white's perspective, index 0 = a8).
// Pawn table encourages advancing / centralizing.
const PAWN_TABLE = [
  0, 0, 0, 0, 0, 0, 0, 0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5, 5, 10, 25, 25, 10, 5, 5,
  0, 0, 0, 20, 20, 0, 0, 0,
  5, -5, -10, 0, 0, -10, -5, 5,
  5, 10, 10, -20, -20, 10, 10, 5,
  0, 0, 0, 0, 0, 0, 0, 0,
];

const KNIGHT_TABLE = [
  -50, -40, -30, -30, -30, -30, -40, -50,
  -40, -20, 0, 0, 0, 0, -20, -40,
  -30, 0, 10, 15, 15, 10, 0, -30,
  -30, 5, 15, 20, 20, 15, 5, -30,
  -30, 0, 15, 20, 20, 15, 0, -30,
  -30, 5, 10, 15, 15, 10, 5, -30,
  -40, -20, 0, 5, 5, 0, -20, -40,
  -50, -40, -30, -30, -30, -30, -40, -50,
];

const BISHOP_TABLE = [
  -20, -10, -10, -10, -10, -10, -10, -20,
  -10, 0, 0, 0, 0, 0, 0, -10,
  -10, 0, 5, 10, 10, 5, 0, -10,
  -10, 5, 5, 10, 10, 5, 5, -10,
  -10, 0, 10, 10, 10, 10, 0, -10,
  -10, 10, 10, 10, 10, 10, 10, -10,
  -10, 5, 0, 0, 0, 0, 5, -10,
  -20, -10, -10, -10, -10, -10, -10, -20,
];

const ROOK_TABLE = [
  0, 0, 0, 0, 0, 0, 0, 0,
  5, 10, 10, 10, 10, 10, 10, 5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  0, 0, 0, 5, 5, 0, 0, 0,
];

const QUEEN_TABLE = [
  -20, -10, -10, -5, -5, -10, -10, -20,
  -10, 0, 0, 0, 0, 0, 0, -10,
  -10, 0, 5, 5, 5, 5, 0, -10,
  -5, 0, 5, 5, 5, 5, 0, -5,
  0, 0, 5, 5, 5, 5, 0, -5,
  -10, 5, 5, 5, 5, 5, 0, -10,
  -10, 0, 5, 0, 0, 0, 0, -10,
  -20, -10, -10, -5, -5, -10, -10, -20,
];

const KING_MIDDLE_TABLE = [
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -20, -30, -30, -40, -40, -30, -30, -20,
  -10, -20, -20, -20, -20, -20, -20, -10,
  20, 20, 0, 0, 0, 0, 20, 20,
  20, 30, 10, 0, 0, 10, 30, 20,
];

const KING_ENDGAME_TABLE = [
  -50, -40, -30, -20, -20, -30, -40, -50,
  -30, -20, -10, 0, 0, -10, -20, -30,
  -30, -10, 20, 30, 30, 20, -10, -30,
  -30, -10, 30, 40, 40, 30, -10, -30,
  -30, -10, 30, 40, 40, 30, -10, -30,
  -30, -10, 20, 30, 30, 20, -10, -30,
  -30, -30, 0, 0, 0, 0, -30, -30,
  -50, -30, -30, -30, -30, -30, -30, -50,
];

const TABLES: Record<string, number[]> = {
  p: PAWN_TABLE,
  n: KNIGHT_TABLE,
  b: BISHOP_TABLE,
  r: ROOK_TABLE,
  q: QUEEN_TABLE,
  k: KING_MIDDLE_TABLE,
};

function squareIndex(square: string): number {
  const file = square.charCodeAt(0) - 97;
  const rank = parseInt(square[1] as string, 10);
  return (8 - rank) * 8 + file;
}

function pieceSquareBonus(type: string, square: string, color: string, phase: 'middle' | 'endgame'): number {
  const tables = type === 'k' && phase === 'endgame' ? KING_ENDGAME_TABLE : TABLES[type];
  if (!tables) return 0;
  const idx = squareIndex(square);
  const bonus = color === 'w' ? tables[idx] : tables[63 - idx];
  return bonus ?? 0;
}

function evaluate(chess: Chess): number {
  let total = 0;
  const board = chess.board();

  for (const row of board) {
    for (const cell of row) {
      if (!cell) continue;
      const { type, color, square } = cell;
      const value = PIECE_VALUES[type] ?? 0;
      total += color === 'w' ? value : -value;
      total += color === 'w'
        ? pieceSquareBonus(type, square, 'w', 'middle')
        : -pieceSquareBonus(type, square, 'b', 'middle');
    }
  }

  // Rough endgame detection: few non-pawn pieces left.
  let minors = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell && cell.type !== 'p' && cell.type !== 'k') minors += 1;
    }
  }
  const phase: 'middle' | 'endgame' = minors <= 6 ? 'endgame' : 'middle';

  for (const row of board) {
    for (const cell of row) {
      if (!cell) continue;
      const { type, color, square } = cell;
      if (type === 'k') {
        total += color === 'w'
          ? pieceSquareBonus(type, square, 'w', phase)
          : -pieceSquareBonus(type, square, 'b', phase);
      }
    }
  }

  return total;
}

function orderMoves(moves: Move[]): Move[] {
  return moves.slice().sort((a, b) => {
    const scoreA = (a.captured ? (PIECE_VALUES[a.captured] ?? 0) * 10 : 0) - (a.piece === 'p' ? 80 : 0);
    const scoreB = (b.captured ? (PIECE_VALUES[b.captured] ?? 0) * 10 : 0) - (b.piece === 'p' ? 80 : 0);
    return scoreB - scoreA;
  });
}

function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
): number {
  if (chess.isCheckmate()) {
    return maximizing ? -Infinity : Infinity;
  }
  if (chess.isDraw() || chess.isStalemate()) {
    return 0;
  }
  if (depth === 0) {
    return evaluate(chess);
  }

  const moves = orderMoves(chess.moves({ verbose: true }));

  if (maximizing) {
    let best = -Infinity;
    for (const move of moves) {
      chess.move(move);
      best = Math.max(best, minimax(chess, depth - 1, alpha, beta, false));
      chess.undo();
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      chess.move(move);
      best = Math.min(best, minimax(chess, depth - 1, alpha, beta, true));
      chess.undo();
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

function getDepth(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'easy':
      return 1;
    case 'medium':
      return 2;
    case 'hard':
      return 4;
  }
}

export function bestMove(fen: string, difficulty: Difficulty): MoveRecord {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) {
    throw new Error('No legal moves available');
  }

  const depth = getDepth(difficulty);

  // Easy: with some probability just pick a random move.
  if (difficulty === 'easy' && Math.random() < 0.5) {
    const pick = moves[Math.floor(Math.random() * moves.length)] as Move;
    return { from: pick.from as string, to: pick.to as string, promotion: pick.promotion };
  }

  const maximizing = chess.turn() === 'w';
  const ordered = orderMoves(moves);
  let bestMove: Move | null = null;
  let bestScore = maximizing ? -Infinity : Infinity;

  for (const move of ordered) {
    chess.move(move);
    const score = minimax(chess, depth - 1, -Infinity, Infinity, !maximizing);
    chess.undo();
    if (maximizing ? score > bestScore : score < bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  if (!bestMove) {
    const pick = moves[0] as Move;
    return { from: pick.from as string, to: pick.to as string, promotion: pick.promotion };
  }

  return {
    from: bestMove.from as string,
    to: bestMove.to as string,
    promotion: bestMove.promotion,
  };
}

export function getLegalMoves(chess: Chess, square: string): Square[] {
  return chess.moves({ square: square as Square, verbose: true }).map((m) => m.to) as Square[];
}
