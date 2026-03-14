import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    DestroyRef,
    ElementRef,
    HostListener,
    computed,
    inject,
    signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

import { Piece, Square } from '../../models/chess.models';
import { GameService } from '../../services/game.service';
import { getPieceSvg } from '../piece-art';

type DragStartPayload = {
    position: string;
    clientX: number;
    clientY: number;
    offsetX: number;
    offsetY: number;
};

type ExplosionParticle = {
    x: number;
    y: number;
    delay: number;
    size: number;
    dx: number;
    dy: number;
    color: string;
};

@Component({
    selector: 'app-board',
    standalone: false,
    templateUrl: './board.component.html',
    styleUrl: './board.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardComponent {
    private readonly game = inject(GameService);
    private readonly host = inject(ElementRef<HTMLElement>);
    private readonly destroyRef = inject(DestroyRef);
    private readonly cdr = inject(ChangeDetectorRef);

    readonly state = toSignal(this.game.state$, {
        initialValue: this.game.getBoardState(),
    });
    readonly selectedSquare = signal<string | null>(null);
    readonly possibleMoves = signal<string[]>([]);
    readonly boardSquares = computed(() => this.state().board);
    readonly statusText = computed(() => {
        if (this.state().isCheckmate) {
            return 'Jaque mate';
        }

        if (this.state().isStalemate) {
            return 'Ahogado';
        }

        if (this.state().isCheck) {
            return 'Jaque';
        }

        return `Turno de ${this.state().turn === 'w' ? 'blancas' : 'negras'}`;
    });

    readonly showCheckmateAnimation = signal(false);
    readonly checkmateKingPosition = signal('');
    readonly explosionParticles = signal<ExplosionParticle[]>([]);
    readonly checkmateKingStyle = computed(() => this.getKingStyle(this.checkmateKingPosition()));
    readonly checkmateKingSvg = computed(() => {
        const state = this.state();
        if (!this.checkmateKingPosition()) {
            return '';
        }

        return getPieceSvg({
            type: 'king',
            color: state.turn,
        });
    });

    draggingPiece: {
        piece: Piece;
        element: HTMLElement;
        startX: number;
        startY: number;
        from: string;
    } | null = null;

    dragOffset = { x: 0, y: 0 };

    private clearSelectionTimer: ReturnType<typeof setTimeout> | null = null;
    private checkmateTimer: ReturnType<typeof setTimeout> | null = null;
    private suppressClickUntil = 0;
    private mouseMoveHandler: ((event: MouseEvent) => void) | null = null;
    private mouseUpHandler: ((event: MouseEvent) => void) | null = null;

    constructor() {
        this.game.checkmate$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((isCheckmate) => this.handleCheckmate(isCheckmate));
    }

    handleSquareClick(position: string): void {
        if (Date.now() < this.suppressClickUntil || this.draggingPiece || this.showCheckmateAnimation()) {
            return;
        }

        const clickedSquare = this.findSquare(position);
        const selected = this.selectedSquare();
        const currentTurn = this.state().turn;

        if (!clickedSquare) {
            this.clearSelection();
            return;
        }

        if (selected === position) {
            this.clearSelection();
            return;
        }

        if (selected && this.possibleMoves().includes(position)) {
            this.cancelPendingClear();
            const moved = this.game.move(selected, position);

            if (moved) {
                this.clearSelection();
            } else {
                this.scheduleClearSelection();
            }

            return;
        }

        if (clickedSquare.piece && clickedSquare.piece.color === currentTurn) {
            this.cancelPendingClear();
            this.selectedSquare.set(position);
            this.possibleMoves.set(this.game.getValidMoves(position));
            return;
        }

        if (!clickedSquare.piece) {
            this.clearSelection();
            return;
        }

        this.scheduleClearSelection();
    }

    onDragStart(payload: DragStartPayload): void {
        if (this.showCheckmateAnimation()) {
            return;
        }

        const square = this.findSquare(payload.position);
        if (!square?.piece || square.piece.color !== this.state().turn) {
            return;
        }

        this.cancelPendingClear();
        this.suppressClickUntil = Date.now() + 250;
        this.selectedSquare.set(payload.position);
        this.possibleMoves.set(this.game.getValidMoves(payload.position));

        this.dragOffset = {
            x: payload.offsetX,
            y: payload.offsetY,
        };

        const dragElement = document.createElement('div');
        dragElement.innerHTML = this.getPieceHTML(square.piece);
        dragElement.className = 'board-drag-ghost';
        dragElement.style.position = 'fixed';
        dragElement.style.pointerEvents = 'none';
        dragElement.style.zIndex = '9999';
        dragElement.style.width = '60px';
        dragElement.style.height = '60px';
        dragElement.style.left = `${payload.clientX - this.dragOffset.x}px`;
        dragElement.style.top = `${payload.clientY - this.dragOffset.y}px`;

        document.body.appendChild(dragElement);

        this.draggingPiece = {
            piece: square.piece,
            element: dragElement,
            startX: payload.clientX,
            startY: payload.clientY,
            from: payload.position,
        };

        this.mouseMoveHandler = (event: MouseEvent) => {
            if (!this.draggingPiece) {
                return;
            }

            this.draggingPiece.element.style.left = `${event.clientX - this.dragOffset.x}px`;
            this.draggingPiece.element.style.top = `${event.clientY - this.dragOffset.y}px`;
        };

        this.mouseUpHandler = (event: MouseEvent) => {
            this.completeDrag(event);
        };

        document.addEventListener('mousemove', this.mouseMoveHandler);
        document.addEventListener('mouseup', this.mouseUpHandler);
    }

    updateDragTarget(position: string): void {
        if (!this.draggingPiece) {
            return;
        }

        if (!this.possibleMoves().includes(position)) {
            return;
        }
    }

    completeDragFromSquare(position: string): void {
        if (!this.draggingPiece) {
            return;
        }

        this.tryMove(this.draggingPiece.from, position);
        this.cleanupDrag();
    }

    isPossibleCapture(square: Square): boolean {
        return this.possibleMoves().includes(square.position) && !!square.piece;
    }

    isPossibleMove(square: Square): boolean {
        return this.possibleMoves().includes(square.position);
    }

    isKingInCheck(square: Square): boolean {
        return (
            this.state().isCheck &&
            square.piece?.type === 'king' &&
            square.piece.color === this.state().turn
        );
    }

    trackParticle(index: number): number {
        return index;
    }

    @HostListener('document:click', ['$event'])
    handleOutsideClick(event: MouseEvent): void {
        if (this.draggingPiece || this.showCheckmateAnimation()) {
            return;
        }

        if (!this.host.nativeElement.contains(event.target as Node)) {
            this.clearSelection();
        }
    }

    private handleCheckmate(isCheckmate: boolean): void {
        if (!isCheckmate) {
            this.stopCheckmateAnimation();
            return;
        }

        const losingKing = this.game.getLosingKingPosition();
        this.checkmateKingPosition.set(losingKing);
        this.explosionParticles.set(this.generateExplosionParticles());
        this.showCheckmateAnimation.set(true);
        this.cdr.markForCheck();

        if (this.checkmateTimer) {
            clearTimeout(this.checkmateTimer);
        }

        this.checkmateTimer = setTimeout(() => {
            this.stopCheckmateAnimation();
            this.cdr.markForCheck();
        }, 3800);
    }

    private stopCheckmateAnimation(): void {
        if (this.checkmateTimer) {
            clearTimeout(this.checkmateTimer);
            this.checkmateTimer = null;
        }

        this.showCheckmateAnimation.set(false);
        this.checkmateKingPosition.set('');
        this.explosionParticles.set([]);
    }

    private generateExplosionParticles(): ExplosionParticle[] {
        return Array.from({ length: 30 }, () => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            delay: Number((Math.random() * 0.5).toFixed(2)),
            size: 5 + Math.random() * 15,
            dx: -90 + Math.random() * 180,
            dy: -90 + Math.random() * 180,
            color: this.getRandomBloodColor(),
        }));
    }

    private getRandomBloodColor(): string {
        const bloodColors = ['#8B0000', '#B22222', '#DC143C', '#C41E3A', '#A52A2A', '#800000'];
        return bloodColors[Math.floor(Math.random() * bloodColors.length)];
    }

    private getKingStyle(position: string): Record<string, string> {
        const squares = this.boardSquares();
        const squareIndex = squares.findIndex((square) => square.position === position);
        if (squareIndex === -1) {
            return {};
        }

        const row = Math.floor(squareIndex / 8);
        const column = squareIndex % 8;

        return {
            left: `${column * 12.5}%`,
            top: `${row * 12.5}%`,
            width: '12.5%',
            height: '12.5%',
        };
    }

    private completeDrag(event: MouseEvent): void {
        if (!this.draggingPiece) {
            return;
        }

        this.suppressClickUntil = Date.now() + 250;

        const dropTarget = document
            .elementFromPoint(event.clientX, event.clientY)
            ?.closest('[data-square-position]') as HTMLElement | null;
        const targetSquare = dropTarget?.getAttribute('data-square-position');

        if (targetSquare) {
            this.tryMove(this.draggingPiece.from, targetSquare);
        } else {
            this.scheduleClearSelection();
        }

        this.cleanupDrag();
    }

    private tryMove(from: string, to: string): void {
        if (from !== to && this.possibleMoves().includes(to) && this.game.move(from, to)) {
            this.clearSelection();
            return;
        }

        const targetSquare = this.findSquare(to);
        if (targetSquare?.piece && targetSquare.piece.color === this.state().turn) {
            this.selectedSquare.set(to);
            this.possibleMoves.set(this.game.getValidMoves(to));
            return;
        }

        this.scheduleClearSelection();
    }

    private cleanupDrag(): void {
        if (this.draggingPiece?.element.parentNode) {
            this.draggingPiece.element.parentNode.removeChild(this.draggingPiece.element);
        }

        if (this.mouseMoveHandler) {
            document.removeEventListener('mousemove', this.mouseMoveHandler);
            this.mouseMoveHandler = null;
        }

        if (this.mouseUpHandler) {
            document.removeEventListener('mouseup', this.mouseUpHandler);
            this.mouseUpHandler = null;
        }

        this.draggingPiece = null;
    }

    private getPieceHTML(piece: Piece): string {
        return `
            <div
                style="
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    width:76px;
                    height:76px;
                    filter:drop-shadow(0 12px 20px rgba(15,23,42,0.18));
                    user-select:none;
                "
            >
                ${getPieceSvg(piece)}
            </div>
        `;
    }

    private findSquare(position: string): Square | undefined {
        return this.state().board.find((square) => square.position === position);
    }

    private scheduleClearSelection(): void {
        this.cancelPendingClear();
        this.clearSelectionTimer = setTimeout(() => this.clearSelection(), 1000);
    }

    private cancelPendingClear(): void {
        if (this.clearSelectionTimer) {
            clearTimeout(this.clearSelectionTimer);
            this.clearSelectionTimer = null;
        }
    }

    private clearSelection(): void {
        this.cancelPendingClear();
        this.selectedSquare.set(null);
        this.possibleMoves.set([]);
    }
}
