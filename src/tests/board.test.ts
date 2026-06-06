import { describe, it, expect, beforeEach } from "bun:test";
import { Board } from "../board/Board";
import { PieceColor } from "../enums/PieceColor";
import { PieceType } from "../enums/PieceTypes";

describe("Board", () => {
  let board: Board;

  beforeEach(() => {
    board = new Board();
  });

  // ── Before initialization ─────────────────────────────────────────────────

  describe("before initialize()", () => {
    it("creates an 8×8 grid of nulls", () => {
      const allNull = board.grid.every((row) => row.every((cell) => cell === null));
      expect(allNull).toBe(true);
    });

    it("has no en-passant target", () => {
      expect(board.enPassantTarget).toBeNull();
    });
  });

  // ── After initialization ──────────────────────────────────────────────────

  describe("after initialize()", () => {
    beforeEach(() => {
      board.initialize();
    });

    it("places exactly 32 pieces on the board", () => {
      const count = board.grid.flat().filter(Boolean).length;
      expect(count).toBe(32);
    });

    it("gives each side exactly 16 pieces", () => {
      const flat = board.grid.flat().filter(Boolean);
      const white = flat.filter((p) => p!.color === PieceColor.WHITE).length;
      const black = flat.filter((p) => p!.color === PieceColor.BLACK).length;
      expect(white).toBe(16);
      expect(black).toBe(16);
    });

    it("places the white king at row 7, col 4", () => {
      const piece = board.grid[7]![4];
      expect(piece).not.toBeNull();
      expect(piece!.color).toBe(PieceColor.WHITE);
      expect(piece!.getType()).toBe(PieceType.KING);
    });

    it("places the black king at row 0, col 4", () => {
      const piece = board.grid[0]![4];
      expect(piece).not.toBeNull();
      expect(piece!.color).toBe(PieceColor.BLACK);
      expect(piece!.getType()).toBe(PieceType.KING);
    });

    it("fills row 6 entirely with white pawns", () => {
      for (let col = 0; col < 8; col++) {
        const piece = board.grid[6]![col];
        expect(piece).not.toBeNull();
        expect(piece!.color).toBe(PieceColor.WHITE);
        expect(piece!.getType()).toBe(PieceType.PAWN);
      }
    });

    it("fills row 1 entirely with black pawns", () => {
      for (let col = 0; col < 8; col++) {
        const piece = board.grid[1]![col];
        expect(piece).not.toBeNull();
        expect(piece!.color).toBe(PieceColor.BLACK);
        expect(piece!.getType()).toBe(PieceType.PAWN);
      }
    });

    it("leaves the middle four rows empty (rows 2–5)", () => {
      for (let row = 2; row <= 5; row++) {
        for (let col = 0; col < 8; col++) {
          expect(board.grid[row]![col]).toBeNull();
        }
      }
    });

    it("places white rooks at corners (row 7, cols 0 and 7)", () => {
      const rookA = board.grid[7]![0];
      const rookH = board.grid[7]![7];
      expect(rookA!.getType()).toBe(PieceType.ROOK);
      expect(rookA!.color).toBe(PieceColor.WHITE);
      expect(rookH!.getType()).toBe(PieceType.ROOK);
      expect(rookH!.color).toBe(PieceColor.WHITE);
    });

    it("places the white queen at row 7, col 3", () => {
      const piece = board.grid[7]![3];
      expect(piece!.getType()).toBe(PieceType.QUEEN);
      expect(piece!.color).toBe(PieceColor.WHITE);
    });
  });
});
