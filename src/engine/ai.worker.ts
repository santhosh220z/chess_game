import { bestMove, rateMoves } from './ai';
import type { WorkerRequest, WorkerResponse } from '../types';

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const data = event.data;
  const token = data && typeof data === 'object' ? (data as { token?: number }).token : undefined;

  type Payload = WorkerResponse extends infer R ? (R extends { token?: number } ? Omit<R, 'token'> : never) : never;

  const post = (payload: Payload) =>
    self.postMessage({ ...payload, token } as WorkerResponse);

  try {
    if (data && typeof data === 'object' && 'kind' in data && data.kind === 'review') {
      post({ ok: true, kind: 'review', ratings: rateMoves(data.moves, 1) });
    } else if (data && typeof data === 'object' && 'fen' in data && 'difficulty' in data) {
      post({ ok: true, kind: 'ai', move: bestMove(data.fen, data.difficulty) });
    } else {
      post({ ok: false, error: 'Unknown request' });
    }
  } catch (error) {
    post({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export {};
