import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Chess } from 'chess.js';
import type { Move, PieceSymbol, Square } from 'chess.js';
import Board from './components/Board';
import SidePanel from './components/SidePanel';
import PromotionDialog from './components/PromotionDialog';
import GameOverBanner from './components/GameOverBanner';
import type { AiRequest, AiResponse, Difficulty, GameMode, GameOverInfo } from './types';

type PendingPromotion = { from: Square; to: Square } | null;

function replay(moves: Move[]): Chess {
  const game = new Chess();
  for (const m of moves) {
    game.move({ from: m.from, to: m.to, promotion: m.promotion });
  }
  return game;
}

function analyzeGame(chess: Chess): GameOverInfo | null {
  if (chess.isCheckmate()) {
    const winner = chess.turn() === 'w' ? 'b' : 'w';
    return {
      kind: 'checkmate',
      winner,
      reason: winner === 'w' ? 'White wins by checkmate.' : 'Black wins by checkmate.',
    };
  }
  if (chess.isStalemate()) {
    return { kind: 'stalemate', winner: null, reason: 'Stalemate — no legal moves.' };
  }
  if (chess.isInsufficientMaterial()) {
    return { kind: 'insufficient', winner: null, reason: 'Insufficient material to checkmate.' };
  }
  if (chess.isThreefoldRepetition()) {
    return { kind: 'threefold', winner: null, reason: 'Threefold repetition.' };
  }
  if (chess.isDrawByFiftyMoves()) {
    return { kind: 'fifty-move', winner: null, reason: 'Fifty-move rule.' };
  }
  if (chess.isDraw()) {
    return { kind: 'draw', winner: null, reason: 'Draw.' };
  }
  return null;
}

function getCheckSquare(chess: Chess): Square | null {
  if (!chess.inCheck()) return null;
  const turn = chess.turn();
  for (const row of chess.board()) {
    for (const cell of row) {
      if (cell && cell.color === turn && cell.type === 'k') return cell.square;
    }
  }
  return null;
}

export default function App() {
  const [moves, setMoves] = useState<Move[]>([]);
  const [selected, setSelected] = useState<Square | null>(null);
  const [legalTargets, setLegalTargets] = useState<Set<string>>(() => new Set());
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion>(null);
  const [thinking, setThinking] = useState(false);

  const chess = useMemo(() => replay(moves), [moves]);
  const chessRef = useRef(chess);
  chessRef.current = chess;

  const playerColor = 'w';
  const gameOver = analyzeGame(chess);

  // Mode is chosen on the landing page and carried here via router state.
  const location = useLocation();
  const mode: GameMode = (location.state as { mode?: GameMode } | null)?.mode ?? 'ai';

  // The computer only plays when the active side is not White (the human) in AI mode.
  const isAiTurn = mode === 'ai' && chess.turn() !== playerColor && !gameOver;

  // Single shared AI worker, created once. `currentToken` is bumped on every new
  // AI request and on undo/new-game; a delayed response carrying a stale token
  // is discarded so an in-flight move can't clobber a more recent state.
  const workerRef = useRef<Worker | null>(null);
  const currentTokenRef = useRef(0);

  useEffect(() => {
    const worker = new Worker(new URL('./engine/ai.worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.onmessage = (event: MessageEvent<{ ok: boolean; token: number; move?: AiResponse }>) => {
      const data = event.data;
      // Always clear the "thinking" indicator once any reply arrives, even on
      // a failure or a stale (superseded) request.
      setThinking(false);
      if (!data.ok || !data.move) return;
      // Discard stale responses from superseded requests (e.g. after undo).
      if (data.token !== currentTokenRef.current) return;
      setMoves((list) => {
        const next = new Chess();
        for (const m of list) next.move(m);
        try {
          const move = next.move({
            from: data.move!.from,
            to: data.move!.to,
            promotion: data.move!.promotion,
          });
          return [...list, move];
        } catch {
          return list;
        }
      });
    };
    worker.onerror = () => setThinking(false);
    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const triggerAi = useCallback(() => {
    const worker = workerRef.current;
    if (!worker) return;
    const token = ++currentTokenRef.current;
    setThinking(true);
    const req: AiRequest = { fen: chessRef.current.fen(), difficulty };
    worker.postMessage({ ...req, token });
  }, [difficulty]);

  useEffect(() => {
    if (isAiTurn) triggerAi();
  }, [isAiTurn, triggerAi]);

  const clearSelection = useCallback(() => {
    setSelected(null);
    setLegalTargets(new Set());
  }, []);

  const undo = useCallback(() => {
    currentTokenRef.current += 1; // invalidate any in-flight AI response
    setMoves((list) => {
      const trimmed = list.slice();
      if (mode === 'ai') {
        // AI mode: revert the AI reply and the player's move together.
        if (trimmed.length > 0) trimmed.pop();
        if (trimmed.length > 0) trimmed.pop();
      } else {
        // Two-player mode: revert a single move (undo between players).
        if (trimmed.length > 0) trimmed.pop();
      }
      return trimmed;
    });
    clearSelection();
    setPendingPromotion(null);
    setThinking(false);
  }, [clearSelection, mode]);

  const newGame = useCallback(() => {
    currentTokenRef.current += 1; // invalidate any in-flight AI response
    setMoves([]);
    clearSelection();
    setPendingPromotion(null);
    setThinking(false);
  }, [clearSelection]);

  const applyMove = useCallback((from: Square, to: Square, promotion?: PieceSymbol) => {
    setMoves((list) => {
      const next = new Chess();
      for (const m of list) next.move(m);
      try {
        const move = next.move({ from, to, promotion: promotion ?? 'q' });
        return [...list, move];
      } catch {
        return list;
      }
    });
    clearSelection();
    setPendingPromotion(null);
  }, [clearSelection]);

  const handleSquareClick = useCallback(
    (square: Square) => {
      if (thinking || gameOver || pendingPromotion || isAiTurn) return;
      const piece = chessRef.current.get(square);

      // Promotion path.
      if (selected && legalTargets.has(square) && chessRef.current.get(selected)?.type === 'p') {
        const toRank = square[1];
        if (toRank === '8' || toRank === '1') {
          setPendingPromotion({ from: selected, to: square });
          return;
        }
      }

      if (selected && legalTargets.has(square)) {
        applyMove(selected, square);
        return;
      }

      if (piece && (mode === 'ai' ? piece.color === playerColor : piece.color === chessRef.current.turn())) {
        setSelected(square);
        setLegalTargets(
          new Set(chessRef.current.moves({ square, verbose: true }).map((m) => m.to as string)),
        );
      } else {
        clearSelection();
      }
    },
    [selected, legalTargets, thinking, gameOver, pendingPromotion, isAiTurn, mode, applyMove, clearSelection],
  );

  const checkSquare = getCheckSquare(chess);
  const lastMove =
    moves.length > 0 ? { from: moves[moves.length - 1]!.from, to: moves[moves.length - 1]!.to } : null;

  // Captured pieces.
  const capturedByWhite: string[] = [];
  const capturedByBlack: string[] = [];
  for (const m of moves) {
    if (m.captured) {
      if (m.color === 'w') capturedByWhite.push(m.captured);
      else capturedByBlack.push(m.captured);
    }
  }

  const historySan = moves.map((m) => m.san);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Chess</h1>
        <p>{mode === 'ai' ? 'Play against the computer' : '2 Players — pass and play'}</p>
        <Link className="home-link" to="/">
          Home
        </Link>
      </header>

      <div className="layout">
        <div className="board-wrap">
          <Board
            chess={chess}
            selected={selected}
            legalTargets={legalTargets}
            lastMove={lastMove}
            checkSquare={checkSquare}
            onSquareClick={handleSquareClick}
            boardOrientation="w"
          />

          <div className="controls">
            {mode === 'ai' && (
              <div className="difficulty-group">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    className={`difficulty-btn ${difficulty === d ? 'active' : ''}`}
                    onClick={() => setDifficulty(d)}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            )}
            {thinking && <span className="captured-label">Computer is thinking…</span>}
          </div>
        </div>

        <SidePanel
          turn={chess.turn()}
          capturedByWhite={capturedByWhite}
          capturedByBlack={capturedByBlack}
          history={historySan}
          onUndo={undo}
          onNewGame={newGame}
        />
      </div>

      {pendingPromotion && (
        <PromotionDialog
          color={chessRef.current.get(pendingPromotion.from)?.color ?? 'w'}
          onSelect={(piece) => {
            const p = pendingPromotion;
            setPendingPromotion(null);
            applyMove(p.from, p.to, piece);
          }}
          onCancel={() => setPendingPromotion(null)}
        />
      )}

      {gameOver && <GameOverBanner info={gameOver} onNewGame={newGame} onRematch={newGame} />}
    </div>
  );
}
