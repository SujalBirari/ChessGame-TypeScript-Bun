import { describe, it, expect, beforeEach } from "bun:test";
import { ChessGame } from "../game/ChessGame";
import { Board } from "../board/Board";
import { King } from "../models/King";
import { Queen } from "../models/Queen";
import { Rook } from "../models/Rook";
import { Pawn } from "../models/Pawn";
import { Bishop } from "../models/Bishop";
import { Knight } from "../models/Knight";
import { Position } from "../board/Position";
import { PieceColor } from "../enums/PieceColor";
import { PieceType } from "../enums/PieceTypes";
import { GameStatus } from "../enums/GameStatus";

// ── Helper: place a piece on a ChessGame's board ─────────────────────────────
function place(game: ChessGame, piece: any, row: number, col: number) {
  game.board.grid[row]![col] = piece;
}

// ── Helper: clear the whole board ────────────────────────────────────────────
function clearBoard(game: ChessGame) {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      game.board.grid[r]![c] = null;
}

describe("ChessGame", () => {
  let game: ChessGame;

  beforeEach(() => {
    game = new ChessGame();
  });

  // ── Initial state ──────────────────────────────────────────────────────────

  describe("initial state", () => {
    it("starts as WHITE's turn", () => {
      expect(game.currentTurn).toBe(PieceColor.WHITE);
    });

    it("starts with ACTIVE game status", () => {
      expect(game.gameStatus).toBe(GameStatus.ACTIVE);
    });

    it("starts with no selection and no valid moves", () => {
      expect(game.selectedRow).toBeNull();
      expect(game.selectedCol).toBeNull();
      expect(game.validMoves).toHaveLength(0);
    });

    it("starts with no pending promotion", () => {
      expect(game.pendingPromotion).toBeNull();
    });
  });

  // ── Turn management ────────────────────────────────────────────────────────

  describe("turn management", () => {
    it("switches from WHITE to BLACK after a legal move", () => {
      // White pawn at e2 → select and move to e4
      game.handleSquareClick(6, 4); // select e2
      game.handleSquareClick(4, 4); // move to e4

      expect(game.currentTurn).toBe(PieceColor.BLACK);
    });

    it("switches back to WHITE after Black makes a move", () => {
      // White e2→e4
      game.handleSquareClick(6, 4);
      game.handleSquareClick(4, 4);
      // Black e7→e5
      game.handleSquareClick(1, 4);
      game.handleSquareClick(3, 4);

      expect(game.currentTurn).toBe(PieceColor.WHITE);
    });

    it("does not switch turn when clicking an invalid destination", () => {
      // White selects e2 but clicks a non-move square
      game.handleSquareClick(6, 4); // select
      game.handleSquareClick(6, 4); // re-click same square (not a valid move target)

      expect(game.currentTurn).toBe(PieceColor.WHITE);
    });
  });

  // ── Square selection ───────────────────────────────────────────────────────

  describe("square selection", () => {
    it("selects a piece belonging to the current player", () => {
      game.handleSquareClick(6, 4); // white pawn

      expect(game.selectedRow).toBe(6);
      expect(game.selectedCol).toBe(4);
    });

    it("does not select an opponent's piece", () => {
      game.handleSquareClick(1, 4); // black pawn — not white's turn

      expect(game.selectedRow).toBeNull();
    });

    it("populates validMoves after selecting a piece", () => {
      game.handleSquareClick(6, 4); // select white pawn at e2

      expect(game.validMoves.length).toBeGreaterThan(0);
    });
  });

  // ── Check detection ────────────────────────────────────────────────────────

  describe("isKingInCheck()", () => {
    it("returns false for a freshly initialised position (no check)", () => {
      expect(game.isKingInCheck(PieceColor.WHITE)).toBe(false);
      expect(game.isKingInCheck(PieceColor.BLACK)).toBe(false);
    });

    it("detects check: white king attacked by a black queen", () => {
      clearBoard(game);

      // White king at e1 (7,4), Black queen directly above at e2 (6,4)
      const whiteKing = new King(PieceColor.WHITE, new Position(7, 4));
      const blackQueen = new Queen(PieceColor.BLACK, new Position(6, 4));
      place(game, whiteKing, 7, 4);
      place(game, blackQueen, 6, 4);

      expect(game.isKingInCheck(PieceColor.WHITE)).toBe(true);
    });

    it("does NOT detect check when a friendly piece is blocking the attacker", () => {
      clearBoard(game);

      // White king at 7,4, friendly pawn at 6,4 blocking the black queen at 5,4
      const whiteKing = new King(PieceColor.WHITE, new Position(7, 4));
      const whitePawn = new Pawn(PieceColor.WHITE, new Position(6, 4));
      const blackQueen = new Queen(PieceColor.BLACK, new Position(5, 4));
      place(game, whiteKing, 7, 4);
      place(game, whitePawn, 6, 4);
      place(game, blackQueen, 5, 4);

      expect(game.isKingInCheck(PieceColor.WHITE)).toBe(false);
    });
  });

  // ── Legal move filter ──────────────────────────────────────────────────────

  describe("filterLegalMoves()", () => {
    it("filters out moves that leave own king in check", () => {
      clearBoard(game);

      // White king at 7,4
      // White rook at 7,3 (pinned: if it moves, queen at 7,0 attacks king)
      // Black queen at 7,0
      const whiteKing = new King(PieceColor.WHITE, new Position(7, 4));
      const whiteRook = new Rook(PieceColor.WHITE, new Position(7, 3));
      const blackQueen = new Queen(PieceColor.BLACK, new Position(7, 0));
      place(game, whiteKing, 7, 4);
      place(game, whiteRook, 7, 3);
      place(game, blackQueen, 7, 0);

      const pseudoMoves = whiteRook.getValidMoves(game.board);
      const legalMoves = game.filterLegalMoves(whiteRook, pseudoMoves);

      // The rook is pinned along the rank — it may only move along row 7
      // (capturing the queen at 7,0 or moving between 7,1 and 7,2)
      legalMoves.forEach((m) => {
        expect(m.row).toBe(7); // must stay on the same rank to shield the king
      });
    });
  });

  // ── Checkmate detection ────────────────────────────────────────────────────

  describe("checkmate detection — back-rank mate", () => {
    /**
     * Back-rank mate:
     *   Black king is trapped on row 0 behind its own pawns on row 1.
     *   A white rook on row 0 delivers check; the pawns block all escape.
     *
     *   Row 0:  [whiteRook][.][.][.][.][.][.][blackKing]
     *   Row 1:  [.][.][.][.][.][blackPawn][blackPawn][blackPawn]
     *
     *   The king cannot capture the rook (too far), cannot escape to row 1
     *   (cols 5,6,7 are blocked by pawns), and the whole of row 0 is
     *   controlled by the white rook. = CHECKMATE.
     */
    it("sets gameStatus to CHECKMATE in a back-rank mate position", () => {
      clearBoard(game);
      game.currentTurn = PieceColor.BLACK;

      // Black king at row 0, col 7 (h8)
      const blackKing = new King(PieceColor.BLACK, new Position(0, 7));
      blackKing.hasMoved = true;
      place(game, blackKing, 0, 7);

      // Black pawns on row 1, cols 5,6,7 — seal the king in
      for (const col of [5, 6, 7]) {
        const p = new Pawn(PieceColor.BLACK, new Position(1, col));
        p.hasMoved = true;
        place(game, p, 1, col);
      }

      // White rook on row 0, col 0 — controls the entire back rank
      const whiteRook = new Rook(PieceColor.WHITE, new Position(0, 0));
      place(game, whiteRook, 0, 0);

      // White king far away (needed for isKingInCheck scan)
      const whiteKing = new King(PieceColor.WHITE, new Position(7, 7));
      whiteKing.hasMoved = true;
      place(game, whiteKing, 7, 7);

      (game as any).updateGameStatus();

      expect(game.gameStatus).toBe(GameStatus.CHECKMATE);
    });
  });

  // ── Stalemate detection ────────────────────────────────────────────────────

  describe("stalemate detection", () => {
    it("sets gameStatus to STALEMATE when the current player has no legal moves but is NOT in check", () => {
      clearBoard(game);
      game.currentTurn = PieceColor.BLACK;

      // Classic stalemate trap: black king cornered with no moves
      // Black king at a8 (0,0)
      const blackKing = new King(PieceColor.BLACK, new Position(0, 0));
      blackKing.hasMoved = true;
      place(game, blackKing, 0, 0);

      // White queen at b6 (2,1) — covers a7 and b7; doesn't attack a8 directly
      const whiteQueen = new Queen(PieceColor.WHITE, new Position(2, 1));
      place(game, whiteQueen, 2, 1);

      // White king far away to avoid interfering
      const whiteKing = new King(PieceColor.WHITE, new Position(7, 7));
      whiteKing.hasMoved = true;
      place(game, whiteKing, 7, 7);

      (game as any).updateGameStatus();

      expect(game.gameStatus).toBe(GameStatus.STALEMATE);
    });
  });

  // ── Pawn promotion ─────────────────────────────────────────────────────────

  describe("pawn promotion", () => {
    it("sets pendingPromotion when a white pawn reaches row 0", () => {
      clearBoard(game);

      // White pawn one step from promotion (row 1, col 0)
      const pawn = new Pawn(PieceColor.WHITE, new Position(1, 0));
      pawn.hasMoved = true;
      place(game, pawn, 1, 0);

      // Place kings so the game doesn't crash during check evaluation
      const whiteKing = new King(PieceColor.WHITE, new Position(7, 4));
      const blackKing = new King(PieceColor.BLACK, new Position(0, 4));
      whiteKing.hasMoved = true;
      blackKing.hasMoved = true;
      place(game, whiteKing, 7, 4);
      place(game, blackKing, 0, 4);

      // Select the pawn and move to row 0
      game.selectSquare(1, 0);
      game.moveSelectedPiece(0, 0);

      expect(game.pendingPromotion).not.toBeNull();
      expect(game.pendingPromotion!.row).toBe(0);
      expect(game.pendingPromotion!.col).toBe(0);
    });

    it("replaces the pawn with a Queen after promotePawn(QUEEN)", () => {
      clearBoard(game);

      const pawn = new Pawn(PieceColor.WHITE, new Position(1, 0));
      pawn.hasMoved = true;
      place(game, pawn, 1, 0);

      const whiteKing = new King(PieceColor.WHITE, new Position(7, 4));
      const blackKing = new King(PieceColor.BLACK, new Position(0, 4));
      whiteKing.hasMoved = true;
      blackKing.hasMoved = true;
      place(game, whiteKing, 7, 4);
      place(game, blackKing, 0, 4);

      game.selectSquare(1, 0);
      game.moveSelectedPiece(0, 0);

      // Now promote
      game.promotePawn(PieceType.QUEEN);

      const promoted = game.board.grid[0]![0];
      expect(promoted).not.toBeNull();
      expect(promoted!.getType()).toBe(PieceType.QUEEN);
      expect(promoted!.color).toBe(PieceColor.WHITE);
    });

    it("clears pendingPromotion after promotePawn()", () => {
      clearBoard(game);

      const pawn = new Pawn(PieceColor.WHITE, new Position(1, 0));
      pawn.hasMoved = true;
      place(game, pawn, 1, 0);

      const whiteKing = new King(PieceColor.WHITE, new Position(7, 4));
      const blackKing = new King(PieceColor.BLACK, new Position(0, 4));
      whiteKing.hasMoved = true;
      blackKing.hasMoved = true;
      place(game, whiteKing, 7, 4);
      place(game, blackKing, 0, 4);

      game.selectSquare(1, 0);
      game.moveSelectedPiece(0, 0);
      game.promotePawn(PieceType.ROOK);

      expect(game.pendingPromotion).toBeNull();
    });

    it("freezes input (handleSquareClick) while promotion is pending", () => {
      clearBoard(game);

      const pawn = new Pawn(PieceColor.WHITE, new Position(1, 0));
      pawn.hasMoved = true;
      place(game, pawn, 1, 0);

      const whiteKing = new King(PieceColor.WHITE, new Position(7, 4));
      const blackKing = new King(PieceColor.BLACK, new Position(0, 4));
      whiteKing.hasMoved = true;
      blackKing.hasMoved = true;
      place(game, whiteKing, 7, 4);
      place(game, blackKing, 0, 4);

      game.selectSquare(1, 0);
      game.moveSelectedPiece(0, 0);

      // Try clicking the board — should be a no-op while promotion is pending
      const turnBefore = game.currentTurn;
      game.handleSquareClick(0, 4); // click black king — should not change turn
      expect(game.currentTurn).toBe(turnBefore);
    });
  });
});
