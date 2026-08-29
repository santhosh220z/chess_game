import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import type { Move, PieceSymbol, Square } from 'chess.js';
import Board from './components/Board';
import SidePanel from './components/SidePanel';
import PromotionDialog from './components/PromotionDialog';
import GameOverBanner from './components/GameOverBanner';
import { bestMove } from './engine/ai';
import type { Difficulty, GameOverInfo } from './types';

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
  const isAiTurn = chess.turn() !== playerColor && !gameOver;

  const triggerAi = useCallback(() => {
    setThinking(true);
    setTimeout(() => {
      try {
        const aiMove = bestMove(chessRef.current.fen(), difficulty);
        setMoves((list) => {
          const next = new Chess();
          for (const m of list) next.move(m);
          try {
            const move = next.move({ from: aiMove.from, to: aiMove.to, promotion: aiMove.promotion });
            return [...list, move];
          } catch {
            return list;
          }
        });
      } catch {
        // No legal moves — nothing to do.
      } finally {
        setThinking(false);
      }
    }, 300);
  }, [difficulty]);

  useEffect(() => {
    if (isAiTurn) triggerAi();
  }, [isAiTurn, triggerAi]);

  const clearSelection = useCallback(() => {
    setSelected(null);
    setLegalTargets(new Set());
  }, []);

  const undo = useCallback(() => {
    setMoves((list) => {
      const trimmed = list.slice();
      if (trimmed.length > 0) trimmed.pop(); // undo AI's reply if any
      if (trimmed.length > 0) trimmed.pop(); // undo the player's move
      return trimmed;
    });
    clearSelection();
    setPendingPromotion(null);
    setThinking(false);
  }, [clearSelection]);

  const newGame = useCallback(() => {
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

      if (piece && piece.color === playerColor) {
        setSelected(square);
        setLegalTargets(
          new Set(chessRef.current.moves({ square, verbose: true }).map((m) => m.to as string)),
        );
      } else {
        clearSelection();
      }
    },
    [selected, legalTargets, thinking, gameOver, pendingPromotion, isAiTurn, applyMove, clearSelection],
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
        <p>Play against the computer</p>
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
          color="w"
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
