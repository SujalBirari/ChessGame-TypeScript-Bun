import { Piece } from "./Piece";
import { PieceType } from "../enums/PieceTypes";
import { PieceColor } from "../enums/PieceColor";
import { Board } from "../board/Board";
import { Position } from "../board/Position";

export class Rook extends Piece {
  getType(): PieceType {
    return PieceType.ROOK;
  }

  getSymbol(): string {
    return this.color === PieceColor.WHITE ? "♖" : "♜";
  }

  getValidMoves(board: Board): Position[] {
    const validMoves: Position[] = [];

    // Four sliding directions: [rowDelta, colDelta]
    const directions: [number, number][] = [
      [-1, 0], // up
      [1, 0],  // down
      [0, -1], // left
      [0, 1],  // right
    ];

    for (const [rowDelta, colDelta] of directions) {
      let row = this.position.row + rowDelta;
      let col = this.position.col + colDelta;

      // Keep sliding until we leave the board
      while (row >= 0 && row < 8 && col >= 0 && col < 8) {
        const targetPiece = board.grid[row]![col];

        if (targetPiece) {
          // Capture enemy piece, then stop; blocked by friendly piece
          if (targetPiece.color !== this.color) {
            validMoves.push(new Position(row, col));
          }
          break;
        }

        validMoves.push(new Position(row, col));
        row += rowDelta;
        col += colDelta;
      }
    }

    return validMoves;
  }
}
