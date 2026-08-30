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

export type MoveRating = 'Brilliant' | 'Good' | 'Inaccuracy' | 'Mistake' | 'Blunder';

export interface RatedMove {
  from: string;
  to: string;
  promotion?: string;
  san: string;
  rating: MoveRating;
  loss: number;
}

export interface ReviewRequest {
  kind: 'review';
  moves: MoveRecord[];
}

export type WorkerRequest =
  | ({ kind?: 'ai' } & AiRequest)
  | ReviewRequest
  | { token?: number };

export type WorkerResponse =
  | { token?: number; ok: true; kind: 'ai'; move: AiResponse }
  | { token?: number; ok: true; kind: 'review'; ratings: RatedMove[] }
  | { token?: number; ok: false; error: string };
