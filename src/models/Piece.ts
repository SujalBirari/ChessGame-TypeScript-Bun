import { Position } from "../board/Position";
import { PieceColor } from "../enums/PieceColor";
import { PieceType } from "../enums/PieceTypes";
import { Board } from "../board/Board";

export abstract class Piece {
  public hasMoved = false;

  constructor(
    public color: PieceColor,
    public position: Position,
  ) {}

  abstract getType(): PieceType;

  abstract getSymbol(): string;

  abstract getValidMoves(board: Board): Position[];
}
