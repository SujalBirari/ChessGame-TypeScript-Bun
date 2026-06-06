# ♟ Chess Game — TypeScript + Bun

A fully-featured browser chess game built with **TypeScript** and **Bun** — used as a hands-on project to explore the complete Bun ecosystem: package manager, JavaScript runtime, test runner, and web bundler.

---

## Features

- ✅ Full chess rules — legal move validation with check filtering
- ✅ Check, checkmate & stalemate detection
- ✅ Castling (kingside & queenside)
- ✅ En passant captures
- ✅ Pawn promotion with piece picker UI
- ✅ Start New Game button
- ✅ Dark-themed, responsive UI with Tailwind CSS

---

## Tech Stack

| Tool | Role |
|---|---|
| [Bun](https://bun.sh) | Package manager, runtime, test runner, bundler |
| TypeScript | Application language |
| Tailwind CSS v4 | Styling |
| `Bun.serve()` | Development HTTP server |
| `Bun.build()` | Web bundler (programmatic API) |
| `bun:test` | Unit test runner |

---

## Project Structure

```
chess-game/
├── src/
│   ├── main.ts              # Browser entry point — wires game + UI
│   ├── style.css            # Tailwind CSS entry
│   ├── board/
│   │   ├── Board.ts         # 8×8 grid, en-passant state
│   │   └── Position.ts      # {row, col} value object
│   ├── models/
│   │   ├── Piece.ts         # Abstract base class
│   │   ├── King.ts          # Castling logic
│   │   ├── Queen.ts
│   │   ├── Rook.ts
│   │   ├── Bishop.ts
│   │   ├── Knight.ts
│   │   └── Pawn.ts          # En passant + promotion detection
│   ├── game/
│   │   └── ChessGame.ts     # Check/checkmate/stalemate, move orchestration
│   ├── ui/
│   │   └── BoardRenderer.ts # Renders board HTML
│   ├── enums/
│   │   ├── PieceColor.ts
│   │   ├── PieceTypes.ts
│   │   └── GameStatus.ts
│   └── tests/               # bun:test unit tests
│       ├── board.test.ts
│       ├── pawn.test.ts
│       ├── king.test.ts
│       └── chessGame.test.ts
├── public/
│   └── index.html           # HTML template
├── dist/                    # Build output (gitignored)
├── build.ts                 # Programmatic bundler — Bun.build() API
├── build.analyze.ts         # Bundle manifest & artifact metadata viewer
├── server.ts                # Dev server — Bun.serve()
├── package.json
├── tsconfig.json
└── bun.lock
```

---

## Getting Started

### Prerequisites

Install [Bun](https://bun.sh):

```bash
# macOS / Linux
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"
```

### Install dependencies

```bash
bun install
```

### Build & run

```bash
# 1. Build JS + CSS (development)
bun run build

# 2. Start the dev server
bun run start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Scripts

| Script | Command | Description |
|---|---|---|
| `build` | `bun run build:ts && bun run build:css` | Full development build |
| `build:prod` | `bun run build:ts:prod && bun run build:css` | Full production build (minified) |
| `build:ts` | `bun run build.ts` | Bundle TypeScript → `dist/main.js` (dev) |
| `build:ts:prod` | `bun run build.ts --prod` | Bundle TypeScript → `dist/main.[hash].js` (minified) |
| `build:css` | `bunx @tailwindcss/cli ...` | Compile Tailwind CSS → `dist/style.css` |
| `build:analyze` | `bun run build.analyze.ts` | Print build manifest + artifact metadata |
| `watch:ts` | `bun build ... --watch` | Rebuild JS on file change |
| `watch:css` | `bunx @tailwindcss/cli ... --watch` | Rebuild CSS on file change |
| `start` | `bun run server.ts` | Start HTTP server on port 3000 |
| `test` | `bun test` | Run all unit tests |
| `test:watch` | `bun test --watch` | Re-run tests on file change |

---

## The Bun Lifecycle

This project uses Bun across all four of its roles:

### 1 — Package Manager
```bash
bun install   # reads package.json, writes bun.lock, installs node_modules
```
Uses a global binary cache — significantly faster than npm.

### 2 — JavaScript Runtime
```bash
bun run server.ts   # runs TypeScript natively, no compilation step
```
`server.ts` uses `Bun.serve()` (native HTTP) and `Bun.file()` (lazy streaming) — no Express or Node `http` module needed.

### 3 — Test Runner
```bash
bun test   # zero config, auto-discovers *.test.ts
```
Uses `bun:test` — a Jest-compatible API built into Bun. TypeScript works natively. 51 tests across 4 files run in ~136ms.

```
src/tests/
  board.test.ts      → Board initialization (11 tests)
  pawn.test.ts       → Pawn movement rules (10 tests)
  king.test.ts       → King movement + castling (10 tests)
  chessGame.test.ts  → Game logic: check, checkmate, stalemate, promotion (20 tests)
```

### 4 — Web Bundler
```bash
bun run build.ts          # development build
bun run build.ts --prod   # production build
```
Uses `Bun.build()` — the programmatic bundler API. Key options demonstrated:

```ts
Bun.build({
  entrypoints: ["./src/main.ts"],  // root of the import graph
  outdir:      "./dist",
  target:      "browser",          // no Node built-ins
  format:      "iife",             // works with plain <script src>
  sourcemap:   "linked",           // dev: auto-loaded by DevTools
  minify:      { whitespace, identifiers, syntax },
  define:      { "process.env.NODE_ENV": '"production"' },
  naming:      { entry: "[name].[hash].[ext]" },  // cache-busting
})
// → returns result.outputs[] — a BuildArtifact manifest
```

**Build sizes:**

| Mode | Output | Size |
|---|---|---|
| Development | `dist/main.js` + `.js.map` | 22.72 KB + 46.39 KB |
| Production | `dist/main.[hash].js` + `.js.map` | 11.44 KB + 42.78 KB |

---

## Running Tests

```bash
bun test                       # run all 51 tests
bun test --watch               # watch mode
bun test src/tests/pawn        # run a single file
```

Sample output:
```
 51 pass
  0 fail
154 expect() calls
Ran 51 tests across 4 files. [136ms]
```

---
