import { Board } from "../board/Board";
import { Piece } from "../models/Piece";
import { Position } from "../board/Position";
import { PieceColor } from "../enums/PieceColor";
import { PieceType } from "../enums/PieceTypes";
import { GameStatus } from "../enums/GameStatus";
import { Queen } from "../models/Queen";
import { Rook } from "../models/Rook";
import { Bishop } from "../models/Bishop";
import { Knight } from "../models/Knight";

export class ChessGame {
  board: Board;
  selectedRow: number | null = null;
  selectedCol: number | null = null;
  validMoves: Position[] = [];
  currentTurn: PieceColor = PieceColor.WHITE;
  gameStatus: GameStatus = GameStatus.ACTIVE;
  // Set when a pawn reaches the back rank; game pauses until player picks a piece
  pendingPromotion: Position | null = null;

  constructor() {
    this.board = new Board();
    this.board.initialize();
  }

  // --- Check detection ---

  isKingInCheck(color: PieceColor): boolean {
    const enemyColor =
      color === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;

    // Locate the king
    let kingRow = -1;
    let kingCol = -1;
    outer: for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board.grid[r]![c];
        if (p && p.color === color && p.getType() === PieceType.KING) {
          kingRow = r;
          kingCol = c;
          break outer;
        }
      }
    }

    if (kingRow === -1) return false;

    // Check if any enemy piece's pseudo-legal moves reach the king
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board.grid[r]![c];
        if (p && p.color === enemyColor) {
          const moves = p.getValidMoves(this.board);
          if (moves.some((m) => m.row === kingRow && m.col === kingCol)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  // --- Legal move filtering (excludes moves that leave own king in check) ---

  filterLegalMoves(piece: Piece, pseudoMoves: Position[]): Position[] {
    const isKing = piece.getType() === PieceType.KING;

    return pseudoMoves.filter((move) => {
      const fromRow = piece.position.row;
      const fromCol = piece.position.col;
      const colDelta = move.col - fromCol;
      const isCastling = isKing && Math.abs(colDelta) === 2;

      // --- Extra castling guards ---
      if (isCastling) {
        // 1. Can't castle while in check
        if (this.isKingInCheck(piece.color)) return false;

        // 2. King must not pass through an attacked square
        const intermediateCol = fromCol + (colDelta > 0 ? 1 : -1);
        const savedAtIntermediate = (this.board.grid[fromRow]![intermediateCol] ?? null) as Piece | null;

        // Simulate king on the intermediate square
        this.board.grid[fromRow]![intermediateCol] = piece;
        this.board.grid[fromRow]![fromCol] = null;
        piece.position.col = intermediateCol;
        const passesThroughCheck = this.isKingInCheck(piece.color);
        // Undo
        this.board.grid[fromRow]![fromCol] = piece;
        this.board.grid[fromRow]![intermediateCol] = savedAtIntermediate as Piece | null;
        piece.position.col = fromCol;

        if (passesThroughCheck) return false;
      }

      // --- Simulate the move, then test for check ---
      const capturedPiece = (this.board.grid[move.row]![move.col] ?? null) as Piece | null;

      // En passant: pawn moves diagonally to an empty square
      const isPawn = piece.getType() === PieceType.PAWN;
      const isEpCapture =
        isPawn && fromCol !== move.col && capturedPiece === null;
      const epCapturedRow = fromRow; // same rank as the moving pawn's origin
      const epCapturedPiece = isEpCapture
        ? ((this.board.grid[epCapturedRow]![move.col] ?? null) as Piece | null)
        : null;
      if (isEpCapture) this.board.grid[epCapturedRow]![move.col] = null;

      this.board.grid[move.row]![move.col] = piece;
      this.board.grid[fromRow]![fromCol] = null;
      piece.position.row = move.row;
      piece.position.col = move.col;

      const leavesInCheck = this.isKingInCheck(piece.color);

      // Undo
      this.board.grid[fromRow]![fromCol] = piece;
      this.board.grid[move.row]![move.col] = capturedPiece as Piece | null;
      if (isEpCapture) this.board.grid[epCapturedRow]![move.col] = epCapturedPiece;
      piece.position.row = fromRow;
      piece.position.col = fromCol;

      return !leavesInCheck;
    });
  }

  // --- Game-status helpers ---

  private hasAnyLegalMove(color: PieceColor): boolean {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board.grid[r]![c];
        if (p && p.color === color) {
          const legal = this.filterLegalMoves(p, p.getValidMoves(this.board));
          if (legal.length > 0) return true;
        }
      }
    }
    return false;
  }

  private updateGameStatus(): void {
    const inCheck = this.isKingInCheck(this.currentTurn);
    const hasMove = this.hasAnyLegalMove(this.currentTurn);

    if (!hasMove) {
      this.gameStatus = inCheck ? GameStatus.CHECKMATE : GameStatus.STALEMATE;
    } else {
      this.gameStatus = inCheck ? GameStatus.CHECK : GameStatus.ACTIVE;
    }
  }

  // --- Selection & movement ---

  selectSquare(row: number, col: number): void {
    const piece = this.board.grid[row]![col];

    if (!piece) return;
    if (piece.color !== this.currentTurn) return;

    this.selectedRow = row;
    this.selectedCol = col;

    // Always show only legally valid moves (no self-check)
    this.validMoves = this.filterLegalMoves(piece, piece.getValidMoves(this.board));
  }

  moveSelectedPiece(targetRow: number, targetCol: number): void {
    if (this.selectedRow === null || this.selectedCol === null) return;

    const piece = this.board.grid[this.selectedRow]![this.selectedCol];
    if (!piece) return;

    const fromRow = this.selectedRow;
    const fromCol = this.selectedCol;

    // Handle castling: king moved exactly 2 columns
    if (piece.getType() === PieceType.KING && Math.abs(targetCol - fromCol) === 2) {
      const isKingside = targetCol > fromCol;
      const rookFromCol = isKingside ? 7 : 0;
      const rookToCol = isKingside ? 5 : 3;

      const rook = (this.board.grid[fromRow]![rookFromCol] ?? null) as Piece | null;
      this.board.grid[fromRow]![rookToCol] = rook;
      this.board.grid[fromRow]![rookFromCol] = null;
      if (rook) {
        rook.position.col = rookToCol;
        rook.hasMoved = true;
      }
    }

    // Detect en passant capture BEFORE moving (target square is currently empty)
    const isEnPassantCapture =
      piece.getType() === PieceType.PAWN &&
      fromCol !== targetCol &&
      this.board.grid[targetRow]![targetCol] === null;

    // Move the piece
    this.board.grid[targetRow]![targetCol] = piece;
    this.board.grid[fromRow]![fromCol] = null;
    piece.position.row = targetRow;
    piece.position.col = targetCol;
    piece.hasMoved = true;

    // Remove the captured pawn for en passant
    if (isEnPassantCapture) {
      this.board.grid[fromRow]![targetCol] = null;
    }

    // Update en passant target for the NEXT move:
    // Only set it when a pawn just double-advanced; clear it otherwise.
    if (piece.getType() === PieceType.PAWN && Math.abs(targetRow - fromRow) === 2) {
      const passedRow = (fromRow + targetRow) / 2;
      this.board.enPassantTarget = new Position(passedRow, targetCol);
    } else {
      this.board.enPassantTarget = null;
    }

    // Clear selection state
    this.selectedRow = null;
    this.selectedCol = null;
    this.validMoves = [];

    // Pawn promotion: pause here until the player picks a replacement piece
    const promotionRow = piece.color === PieceColor.WHITE ? 0 : 7;
    if (piece.getType() === PieceType.PAWN && targetRow === promotionRow) {
      this.pendingPromotion = new Position(targetRow, targetCol);
      return; // turn switch and status update happen inside promotePawn()
    }

    // Switch turn
    this.currentTurn =
      this.currentTurn === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;

    // Evaluate status for the new active player
    this.updateGameStatus();
  }

  // Replace the promoted pawn with the chosen piece and finalize the turn
  promotePawn(pieceType: PieceType): void {
    if (!this.pendingPromotion) return;

    const { row, col } = this.pendingPromotion;
    const color = this.currentTurn; // still the promoting player
    const position = new Position(row, col);

    let newPiece: Piece;
    switch (pieceType) {
      case PieceType.ROOK:   newPiece = new Rook(color, position);   break;
      case PieceType.BISHOP: newPiece = new Bishop(color, position); break;
      case PieceType.KNIGHT: newPiece = new Knight(color, position); break;
      default:               newPiece = new Queen(color, position);  break; // QUEEN + fallback
    }
    newPiece.hasMoved = true;
    this.board.grid[row]![col] = newPiece;
    this.pendingPromotion = null;
    this.board.enPassantTarget = null; // promotion move is never a double-pawn push

    // Now switch turn and evaluate status
    this.currentTurn =
      this.currentTurn === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
    this.updateGameStatus();
  }

  private isValidMove(row: number, col: number): boolean {
    return this.validMoves.some((move) => move.row === row && move.col === col);
  }

  handleSquareClick(row: number, col: number): void {
    // Freeze input during promotion picker and when the game is over
    if (this.pendingPromotion !== null) return;
    if (
      this.gameStatus === GameStatus.CHECKMATE ||
      this.gameStatus === GameStatus.STALEMATE
    ) {
      return;
    }

    if (this.isValidMove(row, col)) {
      this.moveSelectedPiece(row, col);
      return;
    }

    this.selectSquare(row, col);
  }
}
