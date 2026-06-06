import { BoardRenderer } from "./ui/BoardRenderer";
import { ChessGame } from "./game/ChessGame";
import { PieceColor } from "./enums/PieceColor";
import { PieceType } from "./enums/PieceTypes";
import { GameStatus } from "./enums/GameStatus";

const appElement = document.getElementById("app");
if (!appElement) throw new Error("App element not found");

const game = new ChessGame();
const renderer = new BoardRenderer();
const app = appElement;

// --- Status banner ---

function getStatusBanner(): string {
  const isWhite = game.currentTurn === PieceColor.WHITE;
  const playerName = isWhite ? "White" : "Black";
  const icon = isWhite ? "♔" : "♚";

  switch (game.gameStatus) {
    case GameStatus.CHECKMATE: {
      const winner = isWhite ? "Black" : "White";
      return `
        <div class="text-center mb-4">
          <p class="text-3xl font-bold text-red-400">♚ Checkmate!</p>
          <p class="text-xl text-emerald-300 mt-1 font-semibold">${winner} wins! 🎉</p>
        </div>`;
    }
    case GameStatus.STALEMATE:
      return `
        <div class="text-center mb-4">
          <p class="text-3xl font-bold text-yellow-300">🤝 Stalemate!</p>
          <p class="text-xl text-gray-300 mt-1">It's a draw.</p>
        </div>`;
    case GameStatus.CHECK:
      return `
        <div class="text-center mb-4">
          <p class="text-2xl font-bold text-red-400">⚠️ ${playerName} is in Check!</p>
        </div>`;
    default:
      return `
        <div class="text-center mb-4">
          <p class="text-2xl font-bold text-gray-100">${icon} ${playerName}'s Turn</p>
        </div>`;
  }
}

// --- Promotion picker modal ---

function getPromotionPicker(): string {
  if (!game.pendingPromotion) return "";

  const isWhite = game.currentTurn === PieceColor.WHITE;
  const choices: { type: PieceType; symbol: string; label: string }[] = [
    { type: PieceType.QUEEN,  symbol: isWhite ? "♕" : "♛", label: "Queen"  },
    { type: PieceType.ROOK,   symbol: isWhite ? "♖" : "♜", label: "Rook"   },
    { type: PieceType.BISHOP, symbol: isWhite ? "♗" : "♝", label: "Bishop" },
    { type: PieceType.KNIGHT, symbol: isWhite ? "♘" : "♞", label: "Knight" },
  ];

  const buttons = choices.map((c) => `
    <button
      class="promotion-choice flex flex-col items-center justify-center w-24 h-28 bg-white rounded-xl border-2 border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 active:scale-95 transition-all shadow-md cursor-pointer"
      data-piece-type="${c.type}"
    >
      <span class="text-5xl leading-none pointer-events-none">${c.symbol}</span>
      <span class="text-sm font-semibold text-gray-600 mt-2 pointer-events-none">${c.label}</span>
    </button>
  `).join("");

  const playerName = isWhite ? "White" : "Black";

  return `
    <div
      id="promotion-overlay"
      class="fixed inset-0 flex items-center justify-center z-50"
      style="background: rgba(0,0,0,0.65);"
    >
      <div class="bg-white rounded-2xl px-10 py-8 shadow-2xl text-center">
        <p class="text-xl font-bold text-gray-800 mb-1">Pawn Promotion</p>
        <p class="text-sm text-gray-500 mb-6">${playerName} — choose your piece</p>
        <div class="flex gap-4">
          ${buttons}
        </div>
      </div>
    </div>
  `;
}

// --- New Game button ---

function getNewGameButton(): string {
  return `
    <div class="flex justify-center mt-6">
      <button
        id="new-game-btn"
        class="group relative px-8 py-3 bg-gradient-to-r from-emerald-600 to-green-500 text-white text-lg font-bold rounded-2xl shadow-lg hover:shadow-emerald-400/40 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer select-none"
      >
        <span class="mr-2">♟</span>Start New Game
      </button>
    </div>
  `;
}

// --- Render ---

function render() {
  app.innerHTML = `
    ${getStatusBanner()}
    ${renderer.render(game)}
    ${getNewGameButton()}
    ${getPromotionPicker()}
  `;
}

render();

// --- Event handling ---

app.addEventListener("click", (event) => {
  const target = event.target as HTMLElement;

  // New Game button click
  if (target.closest("#new-game-btn")) {
    location.reload();
    return;
  }

  // Promotion picker click
  const promotionBtn = target.closest("[data-piece-type]") as HTMLElement | null;
  if (promotionBtn) {
    const pieceType = promotionBtn.dataset.pieceType as PieceType;
    game.promotePawn(pieceType);
    render();
    return;
  }

  // Board square click
  const square = target.classList.contains("square")
    ? target
    : (target.closest(".square") as HTMLElement | null);
  if (!square) return;

  const row = Number(square.dataset.row);
  const col = Number(square.dataset.col);
  game.handleSquareClick(row, col);
  render();
});
