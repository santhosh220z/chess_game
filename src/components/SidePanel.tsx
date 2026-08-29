import type { Color } from 'chess.js';

interface SidePanelProps {
  turn: Color;
  capturedByWhite: string[];
  capturedByBlack: string[];
  history: string[];
  onUndo: () => void;
  onNewGame: () => void;
}

export default function SidePanel({
  turn,
  capturedByWhite,
  capturedByBlack,
  history,
  onUndo,
  onNewGame,
}: SidePanelProps) {
  const rows: { num: number; white?: string; black?: string }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    rows.push({ num: i / 2 + 1, white: history[i], black: history[i + 1] });
  }

  return (
    <aside className="side-panel">
      <div className="card turn-indicator">
        <span className={`turn-marker ${turn}`} />
        <span>
          {turn === 'w' ? 'White' : 'Black'}{' '}
          <span className="captured-label">to move</span>
        </span>
      </div>

      <div className="card">
        <h3>Captured pieces</h3>
        <div className="captured">
          <span className="captured-label">White took:</span>
          <span className="piece-label">{capturedByWhite.join('') || '—'}</span>
        </div>
        <div className="captured">
          <span className="captured-label">Black took:</span>
          <span className="piece-label">{capturedByBlack.join('') || '—'}</span>
        </div>
      </div>

      <div className="card">
        <h3>Move history</h3>
        <div className="move-history">
          {rows.length === 0 ? (
            <span className="captured-label">No moves yet</span>
          ) : (
            rows.map((r) => (
              <div className="row" key={r.num}>
                <span className="num">{r.num}.</span>
                <span>{r.white}</span>
                <span style={{ marginLeft: 8 }}>{r.black}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card panel-actions">
        <button className="btn secondary" onClick={onUndo}>
          Undo
        </button>
        <button className="btn" onClick={onNewGame}>
          New Game
        </button>
      </div>
    </aside>
  );
}
