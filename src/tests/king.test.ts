import { describe, it, expect, beforeEach } from "bun:test";
import { Board } from "../board/Board";
import { King } from "../models/King";
import { Rook } from "../models/Rook";
import { Pawn } from "../models/Pawn";
import { Position } from "../board/Position";
import { PieceColor } from "../enums/PieceColor";
import { PieceType } from "../enums/PieceTypes";

function emptyBoard(): Board {
  return new Board();
}

describe("King movement", () => {
  let board: Board;

  beforeEach(() => {
    board = emptyBoard();
  });

  // ── Basic movement ─────────────────────────────────────────────────────────

  describe("normal moves", () => {
    it("has 8 moves from the center of an empty board", () => {
      const king = new King(PieceColor.WHITE, new Position(4, 4));
      board.grid[4]![4] = king;

      const moves = king.getValidMoves(board);

      expect(moves).toHaveLength(8);
    });

    it("has 3 moves from the top-left corner (row 0, col 0)", () => {
      const king = new King(PieceColor.WHITE, new Position(0, 0));
      board.grid[0]![0] = king;

      const moves = king.getValidMoves(board);

      expect(moves).toHaveLength(3);
    });

    it("has 5 moves from a mid-edge square (row 0, col 4)", () => {
      const king = new King(PieceColor.WHITE, new Position(0, 4));
      board.grid[0]![4] = king;

      const moves = king.getValidMoves(board);

      expect(moves).toHaveLength(5);
    });

    it("cannot move to a square occupied by a friendly piece", () => {
      const king = new King(PieceColor.WHITE, new Position(4, 4));
      const friendly = new Pawn(PieceColor.WHITE, new Position(3, 4));
      board.grid[4]![4] = king;
      board.grid[3]![4] = friendly;

      const moves = king.getValidMoves(board);

      // Square (3,4) must NOT appear in moves
      expect(moves.some((m) => m.row === 3 && m.col === 4)).toBe(false);
      // Rest of the 8-directional neighbours (minus the friendly-blocked one = 7)
      expect(moves).toHaveLength(7);
    });

    it("can capture an enemy piece on an adjacent square", () => {
      const king = new King(PieceColor.WHITE, new Position(4, 4));
      const enemy = new Pawn(PieceColor.BLACK, new Position(3, 4));
      board.grid[4]![4] = king;
      board.grid[3]![4] = enemy;

      const moves = king.getValidMoves(board);

      expect(moves.some((m) => m.row === 3 && m.col === 4)).toBe(true);
    });
  });

  // ── Castling ───────────────────────────────────────────────────────────────

  describe("castling", () => {
    it("includes kingside castling when rook is unmoved and squares are clear", () => {
      // White king at e1 (row 7, col 4), rook at h1 (row 7, col 7)
      const king = new King(PieceColor.WHITE, new Position(7, 4));
      const rook = new Rook(PieceColor.WHITE, new Position(7, 7));
      board.grid[7]![4] = king;
      board.grid[7]![7] = rook;
      // Squares f1 (col 5) and g1 (col 6) are already null

      const moves = king.getValidMoves(board);

      // King should land on g1 = row 7, col 6
      expect(moves.some((m) => m.row === 7 && m.col === 6)).toBe(true);
    });

    it("includes queenside castling when rook is unmoved and squares are clear", () => {
      const king = new King(PieceColor.WHITE, new Position(7, 4));
      const rook = new Rook(PieceColor.WHITE, new Position(7, 0));
      board.grid[7]![4] = king;
      board.grid[7]![0] = rook;
      // Squares b1 (col 1), c1 (col 2), d1 (col 3) are already null

      const moves = king.getValidMoves(board);

      // King should land on c1 = row 7, col 2
      expect(moves.some((m) => m.row === 7 && m.col === 2)).toBe(true);
    });

    it("cannot castle kingside when the king has already moved", () => {
      const king = new King(PieceColor.WHITE, new Position(7, 4));
      king.hasMoved = true;
      const rook = new Rook(PieceColor.WHITE, new Position(7, 7));
      board.grid[7]![4] = king;
      board.grid[7]![7] = rook;

      const moves = king.getValidMoves(board);

      expect(moves.some((m) => m.row === 7 && m.col === 6)).toBe(false);
    });

    it("cannot castle kingside when the rook has already moved", () => {
      const king = new King(PieceColor.WHITE, new Position(7, 4));
      const rook = new Rook(PieceColor.WHITE, new Position(7, 7));
      rook.hasMoved = true;
      board.grid[7]![4] = king;
      board.grid[7]![7] = rook;

      const moves = king.getValidMoves(board);

      expect(moves.some((m) => m.row === 7 && m.col === 6)).toBe(false);
    });

    it("cannot castle kingside when a piece blocks the f-file (col 5)", () => {
      const king = new King(PieceColor.WHITE, new Position(7, 4));
      const rook = new Rook(PieceColor.WHITE, new Position(7, 7));
      const blocker = new Pawn(PieceColor.WHITE, new Position(7, 5)); // blocks f1
      board.grid[7]![4] = king;
      board.grid[7]![7] = rook;
      board.grid[7]![5] = blocker;

      const moves = king.getValidMoves(board);

      expect(moves.some((m) => m.row === 7 && m.col === 6)).toBe(false);
    });
  });
});
