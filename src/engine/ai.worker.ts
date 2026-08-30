import { bestMove } from './ai';
import type { AiRequest, AiResponse } from '../types';

interface WorkerRequest extends AiRequest {
  token?: number;
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { fen, difficulty, token } = event.data;
  const post = (payload: object) => (self as unknown as Worker).postMessage({ ...payload, token });
  try {
    const move: AiResponse = bestMove(fen, difficulty);
    post({ ok: true, move });
  } catch (error) {
    post({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export {};
