# AGENTS.md

Chess game: play vs. AI in the browser.

## Stack & structure
- React + TypeScript + Vite, built with `chess.js` (v1.x) for all move legality / checkmate / stalemate / castling / promotion rules.
- `src/engine/ai.ts` — the AI: minimax with alpha-beta pruning; evaluation uses material values + piece-square tables. Difficulty maps to search depth: Easy ~1–2 (+ randomness), Medium ~2–3, Hard 4. AI runs on a `setTimeout` so it never blocks the UI.
- `src/types.ts` — shared types (difficulty, game-over kinds, etc.).
- Components: `Board`, `Square`, `SidePanel`, `PromotionDialog`, `GameOverBanner`, wired together in `App.tsx`.
- The global `~/AGENTS.md` has a `graphify` section — it does NOT apply to this repo (no graphify-out here; directory isn't a git repo).

## Commands
- `npm run dev` — dev server / play the game.
- `npm run build` — runs `tsc` type-check then `vite build`. Use this as the primary verification step (there is no separate typecheck script).
- `npm run preview` — preview a production build.

## Notes
- The Vite `--template react-ts` flag may not apply correctly when scaffolding into a non-empty dir; if it falls back to vanilla TS, add `react`/`react-dom` (`npm i react react-dom`) + `@types/react` `@types/react-dom` and set `"jsx": "react-jsx"` in `tsconfig.json` yourself.
- No git repo, no test framework, no linter configured. Verify by building + manual play via `npm run dev`.
