import type { PieceSymbol } from 'chess.js';

// Solid/filled chess glyphs for both colors. The piece's visible color is
// applied purely via CSS `color`, which is reliable across browsers; using the
// font's hollow glyphs plus -webkit-text-stroke rendered pieces with
// transparent/incorrect fills.
const PIECE_GLYPHS: Record<PieceSymbol, string> = {
  k: '♚',
  q: '♛',
  r: '♜',
  b: '♝',
  n: '♞',
  p: '♟',
};

export function pieceSymbol(type: PieceSymbol): string {
  return PIECE_GLYPHS[type];
}
