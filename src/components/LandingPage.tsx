import { useNavigate } from 'react-router-dom';
import type { GameMode } from '../types';

export default function LandingPage() {
  const navigate = useNavigate();

  const start = (mode: GameMode) => {
    navigate('/game', { state: { mode } });
  };

  return (
    <div className="landing">
      <div className="landing-card">
        <h1>Chess</h1>
        <p className="landing-subtitle">Choose a game mode to begin</p>

        <div className="mode-options">
          <button className="mode-card" onClick={() => start('ai')}>
            <span className="mode-icon">♖</span>
            <span className="mode-title">vs Computer</span>
            <span className="mode-desc">Play against the built-in AI at your chosen difficulty.</span>
          </button>

          <button className="mode-card" onClick={() => start('two')}>
            <span className="mode-icon">♝</span>
            <span className="mode-title">2 Players</span>
            <span className="mode-desc">Two players, one device — pass and play on the same board.</span>
          </button>
        </div>
      </div>
    </div>
  );
}
