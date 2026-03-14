import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output,
    SecurityContext,
    inject,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { Piece } from '../../models/chess.models';
import { getPieceSvg } from '../piece-art';

@Component({
    selector: 'app-square',
    standalone: false,
    templateUrl: './square.component.html',
    styleUrl: './square.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SquareComponent {
    private readonly sanitizer = inject(DomSanitizer);

    @Input({ required: true }) piece: Piece | null = null;
    @Input({ required: true }) isBlack = false;
    @Input({ required: true }) isSelected = false;
    @Input({ required: true }) isPossibleMove = false;
    @Input({ required: true }) isPossibleCapture = false;
    @Input({ required: true }) position = '';
    @Input({ required: true }) highlight = false;

    @Output() readonly squareClick = new EventEmitter<string>();
    @Output() readonly squarePointerDown = new EventEmitter<{
        position: string;
        clientX: number;
        clientY: number;
        offsetX: number;
        offsetY: number;
    }>();
    @Output() readonly squarePointerEnter = new EventEmitter<string>();
    @Output() readonly squarePointerUp = new EventEmitter<string>();

    get pieceSvg(): SafeHtml | null {
        if (!this.piece) {
            return null;
        }

        let svg = getPieceSvg(this.piece);

        if (this.highlight && this.piece.type === 'king') {
            svg = svg
                .replace(/fill="[^"]*"/, 'fill="#C41E3A"')
                .replace(/stroke="[^"]*"/, 'stroke="#5e0f1d"');
        }

        const safeHtml = this.sanitizer.bypassSecurityTrustHtml(svg);

        return this.sanitizer.sanitize(SecurityContext.HTML, safeHtml)
            ? safeHtml
            : null;
    }

    onClick(): void {
        this.squareClick.emit(this.position);
    }

    onPointerDown(event: PointerEvent): void {
        const target = event.currentTarget as HTMLElement | null;
        const rect = target?.getBoundingClientRect();

        this.squarePointerDown.emit({
            position: this.position,
            clientX: event.clientX,
            clientY: event.clientY,
            offsetX: rect ? event.clientX - rect.left : 0,
            offsetY: rect ? event.clientY - rect.top : 0,
        });
    }

    onPointerEnter(): void {
        this.squarePointerEnter.emit(this.position);
    }

    onPointerUp(): void {
        this.squarePointerUp.emit(this.position);
    }
}
