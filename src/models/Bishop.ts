import { Piece } from "./Piece";
import { PieceType } from "../enums/PieceTypes";
import { PieceColor } from "../enums/PieceColor";
import { Board } from "../board/Board";
import { Position } from "../board/Position";

export class Bishop extends Piece {
  getType(): PieceType {
    return PieceType.BISHOP;
  }

  getSymbol(): string {
    return this.color === PieceColor.WHITE ? "♗" : "♝";
  }

  getValidMoves(board: Board): Position[] {
    const validMoves: Position[] = [];

    // Four diagonal directions: [rowDelta, colDelta]
    const directions: [number, number][] = [
      [-1, -1], // up-left
      [-1,  1], // up-right
      [ 1, -1], // down-left
      [ 1,  1], // down-right
    ];

    for (const [rowDelta, colDelta] of directions) {
      let row = this.position.row + rowDelta;
      let col = this.position.col + colDelta;

      while (row >= 0 && row < 8 && col >= 0 && col < 8) {
        const targetPiece = board.grid[row]![col];

        if (targetPiece) {
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
