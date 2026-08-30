export type Difficulty = 'easy' | 'medium' | 'hard';

export type GameMode = 'ai' | 'two';

export type GameOverKind = 'checkmate' | 'stalemate' | 'insufficient' | 'threefold' | 'fifty-move' | 'draw';

export interface GameOverInfo {
  kind: GameOverKind;
  winner: 'w' | 'b' | null;
  reason: string;
}

export interface MoveRecord {
  from: string;
  to: string;
  promotion?: string;
  score?: number;
}

export interface AiRequest {
  fen: string;
  difficulty: Difficulty;
}

export type AiResponse = MoveRecord;
