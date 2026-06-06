import { Piece } from "./Piece";
import { PieceType } from "../enums/PieceTypes";
import { PieceColor } from "../enums/PieceColor";
import { Board } from "../board/Board";
import { Position } from "../board/Position";

export class Knight extends Piece {
  getType(): PieceType {
    return PieceType.KNIGHT;
  }

  getSymbol(): string {
    return this.color === PieceColor.WHITE ? "♘" : "♞";
  }

  getValidMoves(board: Board): Position[] {
    const validMoves: Position[] = [];

    const offsets: [number, number][] = [
      // [number, number][] -> tuple of two numbers
      [-2, -1],
      [-2, 1],
      [-1, -2],
      [-1, 2],
      [1, -2],
      [1, 2],
      [2, -1],
      [2, 1],
    ];

    for (const [rowOffset, colOffset] of offsets) {
      const newRow = this.position.row + rowOffset;
      const newCol = this.position.col + colOffset;

      const isInsideBoard =
        newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8;

      if (isInsideBoard) {
        const targetPiece = board.grid[newRow]![newCol];
        if (!targetPiece || targetPiece.color !== this.color) {
          validMoves.push(new Position(newRow, newCol));
        }
      }
    }

    return validMoves;
  }
}
