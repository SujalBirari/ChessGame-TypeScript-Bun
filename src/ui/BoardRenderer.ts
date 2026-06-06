import { ChessGame } from "../game/ChessGame";
import { GameStatus } from "../enums/GameStatus";
import { PieceType } from "../enums/PieceTypes";
import { Piece } from "../models/Piece";

export class BoardRenderer {
  render(game: ChessGame): string {
    let html = "";

    const inCheck =
      game.gameStatus === GameStatus.CHECK ||
      game.gameStatus === GameStatus.CHECKMATE;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const isDark = (row + col) % 2 === 1;
        const piece = (game.board.grid[row]![col] ?? null) as Piece | null;

        const isSelected = game.selectedRow === row && game.selectedCol === col;
        const isValidMove = game.validMoves.some(
          (move) => move.row === row && move.col === col,
        );

        // Highlight the king that is currently in check
        const isCheckedKing =
          inCheck &&
          piece !== null &&
          piece !== undefined &&
          piece.color === game.currentTurn &&
          piece.getType() === PieceType.KING;

        let bgClass: string;
        if (isSelected) {
          bgClass = "bg-yellow-400";
        } else if (isValidMove) {
          bgClass = "bg-blue-400";
        } else if (isCheckedKing) {
          bgClass = "bg-red-500";
        } else if (isDark) {
          bgClass = "bg-green-700";
        } else {
          bgClass = "bg-green-200";
        }

        html += `
          <div
            class="square w-16 h-16 flex items-center justify-center text-4xl cursor-pointer hover:brightness-110 transition-all ${bgClass}"
            data-row="${row}"
            data-col="${col}"
          >${piece?.getSymbol() ?? ""}</div>
        `;
      }
    }

    return `
      <div class="grid grid-cols-8 w-fit mx-auto mt-4 shadow-2xl rounded overflow-hidden border-2 border-green-900">
        ${html}
      </div>
    `;
  }
}
