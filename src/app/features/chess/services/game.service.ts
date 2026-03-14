import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { Chess, Color, Move as ChessJsMove, PieceSymbol, Square as ChessSquare } from 'chess.js';

import { GameState, Move, Piece, Square } from '../models/chess.models';

@Injectable({ providedIn: 'root' })
export class GameService {
    private readonly chess = new Chess();
    private readonly boardRotated = signal(false);
    private readonly history = signal<Move[]>([]);
    private readonly stateSubject = new BehaviorSubject<GameState>(this.buildState());
    private readonly checkmateSubject = new Subject<boolean>();

    readonly state$: Observable<GameState> = this.stateSubject.asObservable();
    readonly checkmate$: Observable<boolean> = this.checkmateSubject.asObservable();

    getBoardState(): GameState {
        const current = this.stateSubject.value;

        return {
            ...current,
            board: current.board.map((square) => ({
                ...square,
                piece: square.piece ? { ...square.piece } : null,
            })),
            history: current.history.map((move) => ({
                ...move,
                piece: { ...move.piece },
            })),
        };
    }

    move(from: string, to: string): boolean {
        const pieceBeforeMove = this.mapPiece(this.chess.get(from as ChessSquare));
        if (!pieceBeforeMove) {
            return false;
        }

        const moveResult = this.chess.move({
            from: from as ChessSquare,
            to: to as ChessSquare,
            promotion: 'q',
        });

        if (!moveResult) {
            return false;
        }

        this.history.update((history) => [...history, this.toMoveRecord(moveResult, pieceBeforeMove)]);
        this.publishState();
        this.checkmateSubject.next(this.chess.isCheckmate());
        return true;
    }

    getValidMoves(square: string): string[] {
        return this.chess
            .moves({
                square: square as ChessSquare,
                verbose: true,
            })
            .map((move) => move.to);
    }

    reset(): void {
        this.chess.reset();
        this.history.set([]);
        this.publishState();
        this.checkmateSubject.next(false);
    }

    subscribe(listener: (state: GameState) => void): Subscription {
        return this.state$.subscribe(listener);
    }

    rotateBoard(forceValue?: boolean): void {
        this.boardRotated.set(forceValue ?? !this.boardRotated());
        this.publishState();
    }

    getLosingKingPosition(): string {
        const losingColor = this.chess.turn();
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = [1, 2, 3, 4, 5, 6, 7, 8];

        for (const rank of ranks) {
            for (const file of files) {
                const position = `${file}${rank}` as ChessSquare;
                const piece = this.chess.get(position);

                if (piece?.type === 'k' && piece.color === losingColor) {
                    return position;
                }
            }
        }

        return losingColor === 'w' ? 'e1' : 'e8';
    }

    private publishState(): void {
        this.stateSubject.next(this.buildState());
    }

    private buildState(): GameState {
        return {
            board: this.buildBoard(),
            turn: this.chess.turn(),
            history: this.history(),
            isCheck: this.chess.inCheck(),
            isCheckmate: this.chess.isCheckmate(),
            isStalemate: this.chess.isStalemate(),
            isBoardRotated: this.boardRotated(),
            selectedOpeningId: null,
            isPracticeMode: false,
            hasDeviation: false,
        };
    }

    private buildBoard(): Square[] {
        const files = this.boardRotated()
            ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']
            : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = this.boardRotated() ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];

        return ranks.flatMap((rank) =>
            files.map((file) => {
                const position = `${file}${rank}`;

                return {
                    position,
                    piece: this.mapPiece(this.chess.get(position as ChessSquare)),
                    isBlack: this.isBlackSquare(file, rank),
                };
            }),
        );
    }

    private toMoveRecord(result: ChessJsMove, piece: Piece): Move {
        return {
            from: result.from,
            to: result.to,
            san: result.san,
            piece,
        };
    }

    private mapPiece(
        piece: {
            type: PieceSymbol;
            color: Color;
        } | null | undefined,
    ): Piece | null {
        if (!piece) {
            return null;
        }

        const pieceTypeMap: Record<PieceSymbol, Piece['type']> = {
            p: 'pawn',
            n: 'knight',
            b: 'bishop',
            r: 'rook',
            q: 'queen',
            k: 'king',
        };

        return {
            type: pieceTypeMap[piece.type],
            color: piece.color,
        };
    }

    private isBlackSquare(file: string, rank: number): boolean {
        return (file.charCodeAt(0) - 96 + rank) % 2 === 0;
    }
}
