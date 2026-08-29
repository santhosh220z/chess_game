import type { Color, PieceSymbol } from 'chess.js';

const WHITE_PIECES: Record<PieceSymbol, string> = {
  k: '♔',
  q: '♕',
  r: '♖',
  b: '♗',
  n: '♘',
  p: '♙',
};

const BLACK_PIECES: Record<PieceSymbol, string> = {
  k: '♚',
  q: '♛',
  r: '♜',
  b: '♝',
  n: '♞',
  p: '♟',
};

export function pieceSymbol(color: Color, type: PieceSymbol): string {
  return color === 'w' ? WHITE_PIECES[type] : BLACK_PIECES[type];
}
