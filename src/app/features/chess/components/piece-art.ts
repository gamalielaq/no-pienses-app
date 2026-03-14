import { Piece } from '../models/chess.models';

export function getPieceSvg(piece: Piece | null): string {
    if (!piece) {
        return '';
    }

    const symbol = PIECE_SYMBOLS[piece.type][piece.color];
    const fill = piece.color === 'w' ? '#fff8ec' : '#2b1d12';
    const stroke = piece.color === 'w' ? '#000000' : '#f7ead7';

    return `
        <svg viewBox="0 0 100 100" aria-hidden="true">
            <defs>
                <filter id="piece-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="2.6" flood-color="rgba(0,0,0,0.22)" />
                </filter>
            </defs>
            <text
                x="50"
                y="76"
                text-anchor="middle"
                font-size="84"
                font-family="'DejaVu Sans', 'Noto Sans Symbols 2', 'Segoe UI Symbol', 'Arial Unicode MS', serif"
                fill="${fill}"
                stroke="${stroke}"
                stroke-width="${piece.color === 'w' ? '6.4' : '1.8'}"
                paint-order="stroke"
                filter="url(#piece-shadow)"
            >
                ${symbol}
            </text>
        </svg>
    `;
}

const PIECE_SYMBOLS: Record<Piece['type'], { w: string; b: string }> = {
    king: { w: '&#9818;', b: '&#9818;' },
    queen: { w: '&#9819;', b: '&#9819;' },
    rook: { w: '&#9820;', b: '&#9820;' },
    bishop: { w: '&#9821;', b: '&#9821;' },
    knight: { w: '&#9822;', b: '&#9822;' },
    pawn: { w: '&#9823;', b: '&#9823;' },
};
