export interface Piece {
    type: 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';
    color: 'w' | 'b';
}

export interface Square {
    piece: Piece | null;
    position: string;
    isBlack: boolean;
}

export interface Move {
    from: string;
    to: string;
    san: string;
    piece: Piece;
}

export interface Opening {
    id: string;
    name: string;
    description: string;
    moves: string[];
}

export interface GameState {
    board: Square[];
    turn: 'w' | 'b';
    history: Move[];
    isCheck: boolean;
    isCheckmate: boolean;
    isStalemate: boolean;
    isBoardRotated: boolean;
    selectedOpeningId: string | null;
    isPracticeMode: boolean;
    hasDeviation: boolean;
}
