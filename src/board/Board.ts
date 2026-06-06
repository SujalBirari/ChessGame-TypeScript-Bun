import { Piece } from "../models/Piece";
import { King } from "../models/King";
import { PieceColor } from "../enums/PieceColor";
import { Position } from "./Position";
import { Knight } from "../models/Knight";
import { Bishop } from "../models/Bishop";
import { Rook } from "../models/Rook";
import { Queen } from "../models/Queen";
import { Pawn } from "../models/Pawn";

export class Board {
  grid: (Piece | null)[][];
  // The square an enemy pawn can move to for an en passant capture.
  // Set after a pawn double-advance; cleared after any other move.
  enPassantTarget: Position | null = null;

  constructor() {
    this.grid = Array(8)
      .fill(null) // array of 8 null (1D)
      .map(() => Array(8).fill(null)); // for every null convert into an array of 8 null - so 8x8 2D array
  }

  initialize(): void {
    // Black Pawns
    for (let col = 0; col < 8; col++) {
      this.placePiece(new Pawn(PieceColor.BLACK, new Position(1, col)), 1, col);
    }

    // White Pawns
    for (let col = 0; col < 8; col++) {
      this.placePiece(new Pawn(PieceColor.WHITE, new Position(6, col)), 6, col);
    }

    // Black Back Row

    this.placePiece(new Rook(PieceColor.BLACK, new Position(0, 0)), 0, 0);

    this.placePiece(new Knight(PieceColor.BLACK, new Position(0, 1)), 0, 1);

    this.placePiece(new Bishop(PieceColor.BLACK, new Position(0, 2)), 0, 2);

    this.placePiece(new Queen(PieceColor.BLACK, new Position(0, 3)), 0, 3);

    this.placePiece(new King(PieceColor.BLACK, new Position(0, 4)), 0, 4);

    this.placePiece(new Bishop(PieceColor.BLACK, new Position(0, 5)), 0, 5);

    this.placePiece(new Knight(PieceColor.BLACK, new Position(0, 6)), 0, 6);

    this.placePiece(new Rook(PieceColor.BLACK, new Position(0, 7)), 0, 7);

    // White Back Row

    this.placePiece(new Rook(PieceColor.WHITE, new Position(7, 0)), 7, 0);

    this.placePiece(new Knight(PieceColor.WHITE, new Position(7, 1)), 7, 1);

    this.placePiece(new Bishop(PieceColor.WHITE, new Position(7, 2)), 7, 2);

    this.placePiece(new Queen(PieceColor.WHITE, new Position(7, 3)), 7, 3);

    this.placePiece(new King(PieceColor.WHITE, new Position(7, 4)), 7, 4);

    this.placePiece(new Bishop(PieceColor.WHITE, new Position(7, 5)), 7, 5);

    this.placePiece(new Knight(PieceColor.WHITE, new Position(7, 6)), 7, 6);

    this.placePiece(new Rook(PieceColor.WHITE, new Position(7, 7)), 7, 7);
  }

  private placePiece(piece: Piece, row: number, col: number): void {
    this.grid[row]![col] = piece;
  }
}
