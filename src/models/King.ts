import { Piece } from "./Piece";
import { PieceType } from "../enums/PieceTypes";
import { PieceColor } from "../enums/PieceColor";
import { Board } from "../board/Board";
import { Position } from "../board/Position";

export class King extends Piece {
  getType(): PieceType {
    return PieceType.KING;
  }

  getSymbol(): string {
    return this.color === PieceColor.WHITE ? "♔" : "♚";
  }

  getValidMoves(board: Board): Position[] {
    const validMoves: Position[] = [];

    // All 8 directions, exactly 1 step each
    const directions: [number, number][] = [
      [-1,  0], // up
      [ 1,  0], // down
      [ 0, -1], // left
      [ 0,  1], // right
      [-1, -1], // up-left
      [-1,  1], // up-right
      [ 1, -1], // down-left
      [ 1,  1], // down-right
    ];

    for (const [rowDelta, colDelta] of directions) {
      const row = this.position.row + rowDelta;
      const col = this.position.col + colDelta;

      const isInBounds = row >= 0 && row < 8 && col >= 0 && col < 8;
      if (!isInBounds) continue;

      const targetPiece = board.grid[row]![col];
      if (!targetPiece || targetPiece.color !== this.color) {
        validMoves.push(new Position(row, col));
      }
    }

    // Castling — check/attacked-square validation is handled in ChessGame.filterLegalMoves
    if (!this.hasMoved) {
      const row = this.position.row;

      // Kingside: f and g files must be empty, rook on h must not have moved
      const kingsideRook = board.grid[row]![7];
      if (
        kingsideRook &&
        kingsideRook.getType() === PieceType.ROOK &&
        !kingsideRook.hasMoved &&
        !board.grid[row]![5] &&
        !board.grid[row]![6]
      ) {
        validMoves.push(new Position(row, 6)); // king lands on g-file
      }

      // Queenside: b, c, d files must be empty, rook on a must not have moved
      const queensideRook = board.grid[row]![0];
      if (
        queensideRook &&
        queensideRook.getType() === PieceType.ROOK &&
        !queensideRook.hasMoved &&
        !board.grid[row]![1] &&
        !board.grid[row]![2] &&
        !board.grid[row]![3]
      ) {
        validMoves.push(new Position(row, 2)); // king lands on c-file
      }
    }

    return validMoves;
  }
}
