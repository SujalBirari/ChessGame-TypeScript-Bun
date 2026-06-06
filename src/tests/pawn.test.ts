import { describe, it, expect, beforeEach } from "bun:test";
import { Board } from "../board/Board";
import { Pawn } from "../models/Pawn";
import { Rook } from "../models/Rook";
import { Position } from "../board/Position";
import { PieceColor } from "../enums/PieceColor";

// Helper: create a blank 8×8 board (no pieces)
function emptyBoard(): Board {
  return new Board();
}

// Helper: place a piece on the board directly
function place(board: Board, piece: Pawn | Rook | any, row: number, col: number) {
  board.grid[row]![col] = piece;
}

describe("Pawn movement", () => {
  let board: Board;

  beforeEach(() => {
    board = emptyBoard();
  });

  // ── Forward movement ───────────────────────────────────────────────────────

  describe("white pawn — forward moves", () => {
    it("has 2 valid moves from starting row (one-step + two-step)", () => {
      const pawn = new Pawn(PieceColor.WHITE, new Position(6, 4));
      place(board, pawn, 6, 4);

      const moves = pawn.getValidMoves(board);

      expect(moves).toHaveLength(2);
      expect(moves.some((m) => m.row === 5 && m.col === 4)).toBe(true); // one step
      expect(moves.some((m) => m.row === 4 && m.col === 4)).toBe(true); // two step
    });

    it("has only 1 forward move when hasMoved is true", () => {
      const pawn = new Pawn(PieceColor.WHITE, new Position(4, 4));
      pawn.hasMoved = true;
      place(board, pawn, 4, 4);

      const moves = pawn.getValidMoves(board);

      expect(moves).toHaveLength(1);
      expect(moves[0]!.row).toBe(3);
    });

    it("has no forward moves when directly blocked", () => {
      const pawn = new Pawn(PieceColor.WHITE, new Position(4, 4));
      const blocker = new Pawn(PieceColor.BLACK, new Position(3, 4));
      place(board, pawn, 4, 4);
      place(board, blocker, 3, 4);

      const moves = pawn.getValidMoves(board);

      // No forward moves (two-step also blocked since one-step is blocked)
      const forwardMoves = moves.filter((m) => m.col === 4);
      expect(forwardMoves).toHaveLength(0);
    });

    it("cannot two-step when the intermediate square is blocked", () => {
      const pawn = new Pawn(PieceColor.WHITE, new Position(6, 4));
      const blocker = new Pawn(PieceColor.BLACK, new Position(5, 4));
      place(board, pawn, 6, 4);
      place(board, blocker, 5, 4);

      const moves = pawn.getValidMoves(board);
      const forwardMoves = moves.filter((m) => m.col === 4);
      expect(forwardMoves).toHaveLength(0);
    });
  });

  describe("black pawn — forward moves", () => {
    it("has 2 valid moves from starting row (row 1)", () => {
      const pawn = new Pawn(PieceColor.BLACK, new Position(1, 3));
      place(board, pawn, 1, 3);

      const moves = pawn.getValidMoves(board);

      expect(moves).toHaveLength(2);
      expect(moves.some((m) => m.row === 2 && m.col === 3)).toBe(true);
      expect(moves.some((m) => m.row === 3 && m.col === 3)).toBe(true);
    });
  });

  // ── Diagonal captures ──────────────────────────────────────────────────────

  describe("diagonal captures", () => {
    it("can capture an enemy piece diagonally", () => {
      const pawn = new Pawn(PieceColor.WHITE, new Position(4, 4));
      pawn.hasMoved = true;
      const enemy = new Pawn(PieceColor.BLACK, new Position(3, 5));
      place(board, pawn, 4, 4);
      place(board, enemy, 3, 5);

      const moves = pawn.getValidMoves(board);

      expect(moves.some((m) => m.row === 3 && m.col === 5)).toBe(true);
    });

    it("cannot capture a friendly piece diagonally", () => {
      const pawn = new Pawn(PieceColor.WHITE, new Position(4, 4));
      pawn.hasMoved = true;
      const friendly = new Pawn(PieceColor.WHITE, new Position(3, 5));
      place(board, pawn, 4, 4);
      place(board, friendly, 3, 5);

      const moves = pawn.getValidMoves(board);

      expect(moves.some((m) => m.row === 3 && m.col === 5)).toBe(false);
    });

    it("can capture on both diagonals at once", () => {
      const pawn = new Pawn(PieceColor.WHITE, new Position(4, 4));
      pawn.hasMoved = true;
      const enemyLeft = new Pawn(PieceColor.BLACK, new Position(3, 3));
      const enemyRight = new Pawn(PieceColor.BLACK, new Position(3, 5));
      place(board, pawn, 4, 4);
      place(board, enemyLeft, 3, 3);
      place(board, enemyRight, 3, 5);

      const moves = pawn.getValidMoves(board);

      expect(moves.some((m) => m.row === 3 && m.col === 3)).toBe(true);
      expect(moves.some((m) => m.row === 3 && m.col === 5)).toBe(true);
    });
  });

  // ── En passant ─────────────────────────────────────────────────────────────

  describe("en passant", () => {
    it("includes an en-passant capture when the target is set", () => {
      // White pawn on row 3, col 4 — enemy pawn just double-advanced to col 5
      const pawn = new Pawn(PieceColor.WHITE, new Position(3, 4));
      pawn.hasMoved = true;
      place(board, pawn, 3, 4);

      // Set the en-passant target (the square the capturing pawn moves TO)
      board.enPassantTarget = new Position(2, 5);

      const moves = pawn.getValidMoves(board);

      expect(moves.some((m) => m.row === 2 && m.col === 5)).toBe(true);
    });

    it("does not include en passant when target is on a non-adjacent column", () => {
      const pawn = new Pawn(PieceColor.WHITE, new Position(3, 0));
      pawn.hasMoved = true;
      place(board, pawn, 3, 0);

      // En-passant target is 2 columns away — should NOT be reachable
      board.enPassantTarget = new Position(2, 2);

      const moves = pawn.getValidMoves(board);

      expect(moves.some((m) => m.row === 2 && m.col === 2)).toBe(false);
    });
  });
});
