# Chess Game

A fully functional, browser-based chess game where you play against an AI opponent. Built with React, TypeScript, and Vite, using `chess.js` to handle all the rules of chess (move legality, check, checkmate, stalemate, castling, en passant, and pawn promotion).

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript) ![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [How to Play](#how-to-play)
- [AI Opponent](#ai-opponent)
- [Project Structure](#project-structure)
- [Design System](#design-system)
- [Development](#development)
- [Roadmap](#roadmap)
- [License](#license)

---

## Features

- **Play against an AI** with three difficulty levels (Easy, Medium, Hard).
- **Full chess rules** handled by `chess.js`:
  - Legal move enforcement (no illegal moves allowed)
  - Check & checkmate detection
  - Stalemate and draw detection (insufficient material, threefold repetition, fifty-move rule)
  - Castling (kingside and queenside)
  - En passant
  - Pawn promotion with a piece-selection dialog
- **Legal-move hints** — clicking a piece highlights every square it can move to.
- **Move highlighting** — the origin and destination of the last move are highlighted, and the king is highlighted in red when in check.
- **Captured pieces display** — both sides' captured pieces are shown in the side panel.
- **Move history** — the full game in algebraic notation, displayed in a scrollable panel.
- **Undo** — takes back the AI's move and your last move.
- **New game / Rematch** — restart at any time.
- **Difficulty switcher** — change the AI strength mid-game.
- **Responsive layout** — board and side panel reflow on smaller screens.

---

## Tech Stack

| Layer     | Technology                                 |
| --------- | ------------------------------------------ |
| UI        | React 19 + TypeScript                      |
| Build     | Vite 8                                    |
| Chess rules | `chess.js` (v1.x)                        |
| AI engine | Custom minimax with alpha-beta pruning    |
| Styling   | Hand-written CSS with design tokens       |

No bundler plugins beyond Vite are required. The AI is a custom implementation — no external chess engine dependency.

---

## Getting Started

### Prerequisites

- **Node.js** v20 or newer (developed against v22).
- **npm** (comes with Node).

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/santhosh220z/chess_game.git
cd chess_game

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open the printed URL (`http://localhost:5173` by default) in your browser.

### Production build

```bash
npm run build   # runs the TypeScript type-check, then creates an optimized build in /dist
npm run preview # preview that build locally
```

---

## How to Play

1. **You play as White.** The AI plays as Black.
2. **Select a piece** by clicking it — all legal destination squares light up.
3. **Click a highlighted square** to move the piece there.
4. When no move is legal (or you click an empty/opponent square), pressing on a different piece re-selects; clicking elsewhere deselects.
5. If a pawn reaches the last rank, a **promotion dialog** appears — choose Queen, Rook, Bishop, or Knight.
6. Use the **Undo** button to take back the last move (and the AI's reply).
7. Use **New Game** to reset the board and start over.

The game automatically detects the end state and shows a **Game Over** banner with the result (e.g., "Checkmate — White wins!", "Stalemate", "Draw — Threefold repetition").

---

## AI Opponent

The AI lives in `src/engine/ai.ts` and uses a **minimax search with alpha-beta pruning**.

### How it evaluates positions

- **Material values** for each piece:
  - Pawn: 100, Knight: 320, Bishop: 330, Rook: 500, Queen: 900, King: 20,000
- **Piece-square tables** that encourage centralizing pieces, advancing pawns, and keeping the king safe.
- **King table** that switches between a middlegame (sheltered king) and endgame (active king) variant based on how many pieces remain.
- **Move ordering** (captures first, pawn moves deprioritized) so alpha-beta prunes more efficiently.
- **Checkmate** scores as a win, and draws score as `0`.

### Difficulty levels

| Level  | Search depth | Behavior                          |
| ------ | ------------ | --------------------------------- |
| Easy   | 1            | ~50% random moves, weak play      |
| Medium | 2            | Basic tactical awareness          |
| Hard   | 4            | Decent calculation for casual play |

The AI runs inside a `setTimeout`, so the UI never freezes while it "thinks" (indicated by a "Computer is thinking…" label).

---

## Project Structure

```
chess_game/
├── index.html              # Vite entry HTML
├── package.json            # Scripts & dependencies
├── tsconfig.json           # TypeScript config
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx            # React entry point
    ├── App.tsx             # Game state orchestration & layout
    ├── index.css           # Design tokens + all styling
    ├── types.ts            # Shared types (Difficulty, GameOverInfo, etc.)
    ├── pieces.ts           # Unicode chess piece symbols per color
    ├── engine/
    │   └── ai.ts           # Minimax AI, evaluation, difficulty mapping
    └── components/
        ├── Board.tsx           # 8x8 grid, renders squares
        ├── Square.tsx          # Single square + highlights + piece
        ├── SidePanel.tsx       # Turn, captured pieces, history, undo/new game
        ├── PromotionDialog.tsx # Pawn promotion picker
        └── GameOverBanner.tsx  # End-of-game result overlay
```

---

## Design System

The UI follows a "Chess Classic" aesthetic, captured as CSS variables in `src/index.css`:

- **Board**: warm cream (`#F0D9B5`) light squares, classic brown (`#B58863`) dark squares.
- **Accent**: deep blue (`#4A6FA5`) for buttons, the difficulty selector, and selected/legal-move highlights.
- **Background**: warm light neutral (`#F7F4EE`) with white surface cards.
- **Typography**: Playfair Display (headings) + Inter (body/labels).
- **Highlights**:
  - Last move: soft yellow tint
  - Selected piece: translucent blue
  - King in check: red radial tint
  - Legal moves: empty dots (empty squares) / inner rings (captures)

---

## Development

| Command            | Purpose                                    |
| ------------------ | ------------------------------------------ |
| `npm run dev`      | Start the Vite dev server with HMR         |
| `npm run build`    | Type-check (`tsc`) + production build      |
| `npm run preview`  | Preview the production build               |

> There is no separate lint or test script. `npm run build` is the primary verification step — it runs the TypeScript compiler, which catches most issues.

### Project conventions

- **TypeScript strict** mode is enabled, including `noUncheckedIndexedAccess` and `verbatimModuleSyntax` (use `import type` for type-only imports).
- All chess rules are delegated to `chess.js` — do not hand-roll move validation.
- Game state in `App.tsx` is derived from a `Move[]` list replayed into a fresh `Chess` instance, which keeps undo/restart simple and the board immutable.

---

## Roadmap

Ideas for future enhancements:

- [ ] Play as Black with a board-flip option
- [ ] Timed / blitz mode with a clock
- [ ] Stockfish integration for a much stronger AI
- [ ] PGN import/export
- [ ] Sound effects and animations
- [ ] Engine move hints / analysis mode

---

## License

This project is for personal/hobby use. No license has been specified.
