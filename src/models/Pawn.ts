import { Piece } from "./Piece";
import { PieceType } from "../enums/PieceTypes";
import { PieceColor } from "../enums/PieceColor";
import { Board } from "../board/Board";
import { Position } from "../board/Position";

export class Pawn extends Piece {
  getType(): PieceType {
    return PieceType.PAWN;
  }

  getSymbol(): string {
    return this.color === PieceColor.WHITE ? "♙" : "♟";
  }

  getValidMoves(board: Board): Position[] {
    const validMoves: Position[] = [];

    // White pawns move up (decreasing row index), Black pawns move down
    const direction = this.color === PieceColor.WHITE ? -1 : 1;

    // --- Forward one square ---
    const oneStepRow = this.position.row + direction;
    const isOneStepInBounds = oneStepRow >= 0 && oneStepRow < 8;

    if (isOneStepInBounds && !board.grid[oneStepRow]![this.position.col]) {
      validMoves.push(new Position(oneStepRow, this.position.col));

      // --- Initial two-square advance (only if one-step square is also clear) ---
      const startRow = this.color === PieceColor.WHITE ? 6 : 1;
      const twoStepRow = this.position.row + direction * 2;
      const isTwoStepInBounds = twoStepRow >= 0 && twoStepRow < 8;

      if (
        !this.hasMoved &&
        this.position.row === startRow &&
        isTwoStepInBounds &&
        !board.grid[twoStepRow]![this.position.col]
      ) {
        validMoves.push(new Position(twoStepRow, this.position.col));
      }
    }

    // --- Diagonal captures ---
    const captureCols = [this.position.col - 1, this.position.col + 1];
    for (const captureCol of captureCols) {
      if (
        isOneStepInBounds &&
        captureCol >= 0 &&
        captureCol < 8
      ) {
        const targetPiece = board.grid[oneStepRow]![captureCol];
        if (targetPiece && targetPiece.color !== this.color) {
          validMoves.push(new Position(oneStepRow, captureCol));
        }
      }
    }

    // --- En passant capture ---
    const ep = board.enPassantTarget;
    if (
      ep !== null &&
      isOneStepInBounds &&
      ep.row === oneStepRow &&
      Math.abs(ep.col - this.position.col) === 1
    ) {
      validMoves.push(new Position(ep.row, ep.col));
    }

    return validMoves;
  }
}
