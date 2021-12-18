/* 
 * a function that moves the given piece to the given square, then calculates all possible moves
 *     for the opponent's pieces to determine if the king is under attack
 * if the king is not directly under attack as a result of the move, it adds that move to the list
 * returns false if the piece can't move any further (used for Rooks/Queens/Bishops)
 */
function checkMovableSquare(piece, list, gameboard, currentPosition, color, skipKingCheck=false) {
    if (gameboard.board[currentPosition].color === color) {
        return false;
    }
    
    let king = gameboard.pieces[color]["K"][0];
    let kingPosition = (piece.name === "King") ? currentPosition : king.square;
    
    gameboard.board[piece.square] = "";
    let boardSquareReference = gameboard.board[currentPosition];
    let capturedPieceSquare;
    if (boardSquareReference !== "") {
        capturedPieceSquare = boardSquareReference.square;
        boardSquareReference.square = -1;
    }

    let oldSquare;
    if (piece.name === "Portal") {
        oldSquare = piece.square;
        piece.square = currentPosition;
    }

    gameboard.board[currentPosition] = piece;

    if (!skipKingCheck && gameboard.isAttacked(kingPosition, color === "w" ? "b" : "w")) {
        if (boardSquareReference !== "") {
            boardSquareReference.square = capturedPieceSquare;
        }
        gameboard.board[currentPosition] = boardSquareReference;

        if (piece.name === "Portal") {
            piece.square = oldSquare;
        }
        gameboard.board[piece.square] = piece;
        return true;
    }

    if (boardSquareReference !== "") {
        boardSquareReference.square = capturedPieceSquare;
    }
    gameboard.board[currentPosition] = boardSquareReference;

    if (piece.name === "Portal") {
        piece.square = oldSquare;
    }
    gameboard.board[piece.square] = piece;

    if (gameboard.board[currentPosition] === "") {
        list.push(currentPosition);
        return true;
    } else if (gameboard.board[currentPosition].color !== color) {
        list.push(currentPosition);
        return false;
    } else return false;
}

class Rook {
    square; // number from 0 to 63
    color; // string "w" or "b"
    name = "Rook";
    moves = [];
    movesSkipKing = [];
    id; // the letter identifier in a FEN position

    constructor (square, color) {
        this.square = square;
        this.color = color;
        this.id = (this.color === "w") ? "R" : "r";
    }

    generateMoves(gameboard, skipKingCheck = false) {
        if (this.square === -1) {
            this.moves = [];
            this.movesSkipKing = [];
            return;
        }
        let movableSquares = [];

        let currentPosition = this.square;
        let portalEntries = 0;

        while (currentPosition >= 8) { // moving towards RANK 8
            currentPosition -= 8;
            if (gameboard.board[currentPosition].name === "Portal") {
                if (portalEntries <= 2) {
                    // if the piece has entered a portal less than twice in a single direction, push it through and continue
                    // if it has entered a portal twice already, end the loop and check moves in a different direction
                    checkMovableSquare(this, movableSquares, gameboard, currentPosition, this.color, skipKingCheck);
                    currentPosition = gameboard.board[currentPosition].link.square;
                    portalEntries++;
                    continue;
                } else break;
            }
            if (!checkMovableSquare(this, movableSquares, gameboard, currentPosition, this.color, skipKingCheck)) break;
        }

        portalEntries = 0;
        currentPosition = this.square;
        while (currentPosition <= 55) { // moving towards RANK 1
            currentPosition += 8;
            if (gameboard.board[currentPosition].name === "Portal") {
                if (portalEntries <= 2) {
                    checkMovableSquare(this, movableSquares, gameboard, currentPosition, this.color, skipKingCheck);
                    currentPosition = gameboard.board[currentPosition].link.square;
                    portalEntries++;
                    continue;
                } else break;
            }
            if (!checkMovableSquare(this, movableSquares, gameboard, currentPosition, this.color, skipKingCheck)) break;
        }

        portalEntries = 0;
        currentPosition = this.square;
        while (currentPosition % 8 !== 7) { // moving towards FILE H
            currentPosition += 1;
            if (gameboard.board[currentPosition].name === "Portal") {
                if (portalEntries <= 2) {
                    checkMovableSquare(this, movableSquares, gameboard, currentPosition, this.color, skipKingCheck);
                    currentPosition = gameboard.board[currentPosition].link.square;
                    portalEntries++;
                    continue;
                } else break;
            }
            if (!checkMovableSquare(this, movableSquares, gameboard, currentPosition, this.color, skipKingCheck)) break;
        }

        portalEntries = 0;
        currentPosition = this.square;
        while (currentPosition % 8 !== 0) { // moving towards FILE A
            currentPosition -= 1;
            if (gameboard.board[currentPosition].name === "Portal") {
                if (portalEntries <= 2) {
                    checkMovableSquare(this, movableSquares, gameboard, currentPosition, this.color, skipKingCheck);
                    currentPosition = gameboard.board[currentPosition].link.square;
                    portalEntries++;
                    continue;
                } else break;
            }
            if (!checkMovableSquare(this, movableSquares, gameboard, currentPosition, this.color, skipKingCheck)) break;
        }

        if (skipKingCheck) {
            this.movesSkipKing = movableSquares;
        } else {
            this.moves = movableSquares;
        }
        
    }

    generateMovesSkipKing(gameboard) {
        this.generateMoves(gameboard, true);
    }
}

class Bishop {
    square;
    color;
    name = "Bishop";
    moves = [];
    movesSkipKing = [];
    id;

    constructor (square, color) {
        this.square = square;
        this.color = color;
        this.id = (this.color === "w") ? "B" : "b";
    }

    generateMoves(gameboard, skipKingCheck = false) {
        if (this.square === -1) {
            this.moves = [];
            this.movesSkipKing = [];
            return;
        }
        let movableSquares = [];

        let portalEntries = 0;
        let currentPosition = this.square;

        while (currentPosition % 8 !== 0 && currentPosition >= 9) { // moving in the direction of a8
            currentPosition -= 9;
            if (gameboard.board[currentPosition].name === "Portal") {
                if (portalEntries <= 2) {
                    checkMovableSquare(this, movableSquares, gameboard, currentPosition, this.color, skipKingCheck);
                    currentPosition = gameboard.board[currentPosition].link.square;
                    portalEntries++;
                    continue;
                } else break;
            }
            if (!checkMovableSquare(this, movableSquares, gameboard, currentPosition, this.color, skipKingCheck)) break;
        }

        portalEntries = 0;
        currentPosition = this.square;
        while (currentPosition % 8 !== 7 && currentPosition <= 54) { // moving in the direction of h1
            currentPosition += 9;            
            if (gameboard.board[currentPosition].name === "Portal") {
                if (portalEntries <= 2) {
                    checkMovableSquare(this, movableSquares, gameboard, currentPosition, this.color, skipKingCheck);
                    currentPosition = gameboard.board[currentPosition].link.square;
                    portalEntries++;
                    continue;
                } else break;
            }
            if (!checkMovableSquare(this, movableSquares, gameboard, currentPosition, this.color, skipKingCheck)) break;
        }

        portalEntries = 0;
        currentPosition = this.square;
        while (currentPosition % 8 !== 0 && currentPosition < 56) { // moving in the direction of a1
            currentPosition += 7;
            if (gameboard.board[currentPosition].name === "Portal") {
                if (portalEntries <= 2) {
                    checkMovableSquare(this, movableSquares, gameboard, currentPosition, this.color, skipKingCheck);
                    currentPosition = gameboard.board[currentPosition].link.square;
                    portalEntries++;
                    continue;
                } else break;
            }
            if (!checkMovableSquare(this, movableSquares, gameboard, currentPosition, this.color, skipKingCheck)) break;
        }

        portalEntries = 0;
        currentPosition = this.square;
        while (currentPosition % 8 !== 7 && currentPosition > 7) { // moving in the direction of h8
            currentPosition -= 7;
            if (gameboard.board[currentPosition].name === "Portal") {
                if (portalEntries <= 2) {
                    checkMovableSquare(this, movableSquares, gameboard, currentPosition, this.color, skipKingCheck);
                    currentPosition = gameboard.board[currentPosition].link.square;
                    portalEntries++;
                    continue;
                } else break;
            }
            if (!checkMovableSquare(this, movableSquares, gameboard, currentPosition, this.color, skipKingCheck)) break;
        }

        if (skipKingCheck) {
            this.movesSkipKing = movableSquares;
        } else {
            this.moves = movableSquares;
        }
        
    }

    generateMovesSkipKing(gameboard) {
        this.generateMoves(gameboard, true);
    }
}

class Queen {
    square;
    color;
    name = "Queen";
    moves = [];
    movesSkipKing = [];
    id;

    constructor (square, color) {
        this.square = square;
        this.color = color;
        this.id = (this.color === "w") ? "Q" : "q";
    }

    generateMoves(gameboard, skipKingCheck = false) {
        if (this.square === -1) {
            this.moves = [];
            this.movesSkipKing = [];
            return;
        }
        let movableSquares = [];

        let portalEntries = 0;
        let currentPosition = this.square;
        while (currentPosition % 8 !== 0 && currentPosition >= 9) { // moving in the direction of a8
            currentPosition -= 9;
            if (gameboard.board[currentPosition].name === "Portal") {
                if (portalEntries <= 2) {
                    checkMovableSquare(this, movableSquares, gameboard, currentPosition, this.color, skipKingCheck);
                    currentPosition = gameboard.board[currentPosition].link.square;
                    portalEntries++;
                    continue;
                } else break;
            }
            if (!checkMovableSquare(this, movableSquares, gameboard, currentPosition, this.color, skipKingCheck)) break;
        }

        portalEntries = 0;
        currentPosition = this.square;
        while (currentPosition % 8 !== 7 && currentPosition <= 54) { // moving in the direction of h1
            currentPosition += 9;            
            if (gameboard.board[currentPosition].name === "Portal") {
                if (portalEntries <= 2) {
                    checkMovableSquare(this, movableSquares, gameboard, currentPosition, this.color, skipKingCheck);
                    currentPosition = gameboard.board[currentPosition].link.square;
                    portalEntries++;
                    continue;
                } else break;
            }
            if (!checkMovableSquare(this, movableSquares, gameboard, currentPosition, this.color, skipKingCheck)) break;
        }

        portalEntries = 0;
        currentPosition = this.square;
        while (currentPosition % 8 !== 0 && currentPosition < 56) { // moving in the direction of a1
            currentPosition += 7;
            if (gameboard.board[currentPosition].name === "Portal") {
                if (portalEntries <= 2) {
                    checkMovableSquare(this, movableSquares, gameboard, currentPosition, this.color, skipKingCheck);
                    currentPosition = gameboard.board[currentPosition].link.square;
                    portalEntries++;
                    continue;
                } else break;
            }
            if (!checkMovableSquare(this, movableSquares, gameboard, currentPosition, this.color, skipKingCheck)) break;
        }

        portalEntries = 0;
        currentPosition = this.square;
        while (currentPosition % 8 !== 7 && currentPosition > 7) { // moving in the direction of h8
            currentPosition -= 7;
            if (gameboard.board[currentPosition].name === "Portal") {
                if (portalEntries <= 2) {
                    checkMovableSquare(this, movableSquares, gameboard, currentPosition, this.color, skipKingCheck);
                    currentPosition = gameboard.board[currentPosition].link.square;
                    portalEntries++;
                    continue;
                } else break;
            }
            if (!checkMovableSquare(this, movableSquares, gameboard, currentPosition, this.color, skipKingCheck)) break;
        }

        portalEntries = 0;
        currentPosition = this.square;
        while (currentPosition >= 8) { // moving towards RANK 8
            currentPosition -= 8;
            if (gameboard.board[currentPosition].name === "Portal") {
                if (portalEntries <= 2) {
                    // if the piece has entered a portal less than twice in a single direction, push it through and continue
                    // if it has entered a portal twice already, end the loop and check moves in a different direction
                    checkMovableSquare(this, movableSquares, gameboard, currentPosition, this.color, skipKingCheck);
                    currentPosition = gameboard.board[currentPosition].link.square;
                    portalEntries++;
                    continue;
                } else break;
            }
            if (!checkMovableSquare(this, movableSquares, gameboard, currentPosition, this.color, skipKingCheck)) break;
        }

        portalEntries = 0;
        currentPosition = this.square;
        while (currentPosition <= 55) { // moving towards RANK 1
            currentPosition += 8;
            if (gameboard.board[currentPosition].name === "Portal") {
                if (portalEntries <= 2) {
                    checkMovableSquare(this, movableSquares, gameboard, currentPosition, this.color, skipKingCheck);
                    currentPosition = gameboard.board[currentPosition].link.square;
                    portalEntries++;
                    continue;
                } else break;
            }
            if (!checkMovableSquare(this, movableSquares, gameboard, currentPosition, this.color, skipKingCheck)) break;
        }

        portalEntries = 0;
        currentPosition = this.square;
        while (currentPosition % 8 !== 7) { // moving towards FILE H
            currentPosition += 1;
            if (gameboard.board[currentPosition].name === "Portal") {
                if (portalEntries <= 2) {
                    checkMovableSquare(this, movableSquares, gameboard, currentPosition, this.color, skipKingCheck);
                    currentPosition = gameboard.board[currentPosition].link.square;
                    portalEntries++;
                    continue;
                } else break;
            }
            if (!checkMovableSquare(this, movableSquares, gameboard, currentPosition, this.color, skipKingCheck)) break;
        }

        portalEntries = 0;
        currentPosition = this.square;
        while (currentPosition % 8 !== 0) { // moving towards FILE A
            currentPosition -= 1;
            if (gameboard.board[currentPosition].name === "Portal") {
                if (portalEntries <= 2) {
                    checkMovableSquare(this, movableSquares, gameboard, currentPosition, this.color, skipKingCheck);
                    currentPosition = gameboard.board[currentPosition].link.square;
                    portalEntries++;
                    continue;
                } else break;
            }
            if (!checkMovableSquare(this, movableSquares, gameboard, currentPosition, this.color, skipKingCheck)) break;
        }

        if (skipKingCheck) {
            this.movesSkipKing = movableSquares;
        } else {
            this.moves = movableSquares;
        }
        
    }

    generateMovesSkipKing(gameboard) {
        this.generateMoves(gameboard, true);
    }
}

class Knight {
    square;
    color;
    name = "Knight";
    moves = [];
    movesSkipKing = [];
    id;

    constructor (square, color) {
        this.square = square;
        this.color = color;
        this.id = (this.color === "w") ? "N" : "n";
    }

    generateMoves(gameboard, skipKingCheck = false) {
        if (this.square === -1) {
            this.moves = [];
            this.movesSkipKing = [];
            return;
        }
        let movableSquares = [];

        let currentPosition = this.square;
        if (currentPosition >= 16 && currentPosition % 8 !== 0) { // square towards a8, RANK 8
            checkMovableSquare(this, movableSquares, gameboard, currentPosition - 17, this.color, skipKingCheck);
        }

        if (currentPosition >= 8 && currentPosition % 8 > 1) { // square towards a8, FILE A
            checkMovableSquare(this, movableSquares, gameboard, currentPosition - 10, this.color, skipKingCheck);
        }

        if (currentPosition >= 16 && currentPosition % 8 !== 7) { // square towards h8, RANK 8
            checkMovableSquare(this, movableSquares, gameboard, currentPosition - 15, this.color, skipKingCheck);
        }

        if (currentPosition >= 8 && currentPosition % 8 < 6) { // square towards h8, FILE H
            checkMovableSquare(this, movableSquares, gameboard, currentPosition - 6, this.color, skipKingCheck);
        }

        if (currentPosition <= 55 && currentPosition % 8 > 1) { // square towards a1, FILE A
            checkMovableSquare(this, movableSquares, gameboard, currentPosition + 6, this.color, skipKingCheck);
        }

        if (currentPosition <= 47 && currentPosition % 8 !== 0) { // square towards a1, RANK 1
            checkMovableSquare(this, movableSquares, gameboard, currentPosition + 15, this.color, skipKingCheck);
        }

        if (currentPosition <= 55 && currentPosition % 8 < 6) { // square towards h1, FILE H
            checkMovableSquare(this, movableSquares, gameboard, currentPosition + 10, this.color, skipKingCheck);
        }

        if (currentPosition <= 47 && currentPosition % 8 !== 7) { // square towards h1, FILE 1
            checkMovableSquare(this, movableSquares, gameboard, currentPosition + 17, this.color, skipKingCheck);
        }

        if (skipKingCheck) {
            this.movesSkipKing = movableSquares;
        } else {
            this.moves = movableSquares;
        }
        
    }

    generateMovesSkipKing(gameboard) {
        this.generateMoves(gameboard, true);
    }
}

class King {
    square;
    color;
    name = "King";
    moves = [];
    movesSkipKing = [];
    id;

    constructor (square, color) {
        this.square = square;
        this.color = color;
        this.id = (this.color === "w") ? "K" : "k";
    }

    generateMoves(gameboard, skipKingCheck = false) {
        if (this.square === -1) {
            this.moves = [];
            this.movesSkipKing = [];
            return;
        }
        let movableSquares = [];
        let currentPosition = this.square;

        if (currentPosition >= 8 && currentPosition % 8 !== 0) { // square towards a8
            checkMovableSquare(this, movableSquares, gameboard, currentPosition - 9, this.color, skipKingCheck);
        }

        if (currentPosition >= 8) { // square towards RANK 8
            checkMovableSquare(this, movableSquares, gameboard, currentPosition - 8, this.color, skipKingCheck);
        }
        
        if (currentPosition >= 8 && currentPosition % 8 !== 7) { // square towards h8
            checkMovableSquare(this, movableSquares, gameboard, currentPosition - 7, this.color, skipKingCheck);
        }

        if (currentPosition % 8 !== 7) { // square towards FILE H
            checkMovableSquare(this, movableSquares, gameboard, currentPosition + 1, this.color, skipKingCheck);
            
            if ( // castling King-side
                !skipKingCheck && // exclude castling from the isAttacked calculations
                gameboard.castleable[`${this.color}K`] && // if castling King-side is allowed
                gameboard.inCheck !== this.color && // if the King is NOT in check
                movableSquares[movableSquares.length - 1] === currentPosition + 1 && // if the square next to the King is movable
                gameboard.board[currentPosition + 2] === "" // if the square 2 steps from the King is empty
            ) {
                checkMovableSquare(this, movableSquares, gameboard, currentPosition + 2, this.color, skipKingCheck);
            }
        }

        if (currentPosition <= 55 && currentPosition % 8 !== 7) { // square towards h1
            checkMovableSquare(this, movableSquares, gameboard, currentPosition + 9, this.color, skipKingCheck);
        }

        if (currentPosition <= 55) { // square towards RANK 1
            checkMovableSquare(this, movableSquares, gameboard, currentPosition + 8, this.color, skipKingCheck);
        }

        if (currentPosition <= 55 && currentPosition % 8 !== 0) { // square towards a1
            checkMovableSquare(this, movableSquares, gameboard, currentPosition + 7, this.color, skipKingCheck);
        }

        if (currentPosition % 8 !== 0) { // square towards FILE A
            checkMovableSquare(this, movableSquares, gameboard, currentPosition - 1, this.color, skipKingCheck);
        
            if ( // castling Queen-side
                !skipKingCheck && // exclude castling from the isAttacked calculations
                gameboard.castleable[`${this.color}Q`] && // if castling King-side is allowed
                gameboard.inCheck !== this.color && // if the King is NOT in check
                movableSquares[movableSquares.length - 1] === currentPosition - 1 && // if the square next to the King is movable
                gameboard.board[currentPosition - 2] === "" && // if the square 2 steps from the King is empty
                gameboard.board[currentPosition - 3] === "" // if the square 3 steps from the King is empty
            ) {
                checkMovableSquare(this, movableSquares, gameboard, currentPosition - 2, this.color, skipKingCheck);
            }
        }

        if (skipKingCheck) {
            this.movesSkipKing = movableSquares;
        } else {
            this.moves = movableSquares;
        }
        
    }

    generateMovesSkipKing(gameboard) {
        this.generateMoves(gameboard, true);
    }
}

class Pawn {
    square;
    color;
    name = "Pawn";
    moves = [];
    id;

    constructor (square, color) {
        this.square = square;
        this.color = color;
        this.id = (this.color === "w") ? "P" : "p";
    }

    calculateMoves(gameboard, onlyAttack = false) {
        if (this.square === -1) {
            return [];
        }

        let movableSquares = [];
        let oppositeColor = (this.color === "w") ? "b" : "w";
            
        let king = gameboard.pieces[this.color]["K"][0];

        let moveDirection = (this.color === "w") ? 1 : -1;

        if (onlyAttack) {
            if (this.color === "w") {
                if (this.square % 8 === 0) {
                    movableSquares = [this.square - 7];
                } else if (this.square % 8 === 7) {
                    movableSquares = [this.square - 9];
                } else {
                    movableSquares = [this.square - 7, this.square - 9];
                }
            } else {
                if (this.square % 8 === 0) {
                    movableSquares = [this.square + 9];
                } else if (this.square % 8 === 7) {
                    movableSquares = [this.square + 7];
                } else {
                    movableSquares = [this.square + 7, this.square + 9];
                }
            }
            return movableSquares;
        }

        let actualCurrentSquare = this.square;
        let pieceSquareReference;
        let boardSquareReference;

        let currentPosition = this.square - 9 * moveDirection; // capturing along a8-h1 diagonal
        let [epSquare, epColor] = gameboard.enPassantable;
        if (
            (
                (this.color === "w" && actualCurrentSquare % 8 !== 0) ||
                (this.color === "b" && actualCurrentSquare % 8 !== 7)
            ) && (
                (gameboard.board[currentPosition] !== "" && gameboard.board[currentPosition].color !== this.color) ||
                (epSquare === currentPosition && epColor === this.color)
            )
        ) {
            console.log("Got here! 613");
            boardSquareReference = gameboard.board[currentPosition];
            if (boardSquareReference !== "") {
                pieceSquareReference = boardSquareReference.square;
                boardSquareReference.square = -1;
            }

            gameboard.board[currentPosition] = this;
            gameboard.board[this.square] = "";
            this.square = currentPosition;

            if (!gameboard.isAttacked(king.square, oppositeColor)) {
                movableSquares.push(currentPosition);
            }

            if (boardSquareReference !== "") {
                boardSquareReference.square = pieceSquareReference;
            }

            this.square = actualCurrentSquare;
            gameboard.board[this.square] = this;
            gameboard.board[currentPosition] = boardSquareReference;
        }

        currentPosition = this.square - 7 * moveDirection; // capturing along a1-h8 diagonal
        if (
            (
                (this.color === "w" && actualCurrentSquare % 8 !== 7) ||
                (this.color === "b" && actualCurrentSquare % 8 !== 0)
            ) && (
                (gameboard.board[currentPosition] !== "" && gameboard.board[currentPosition].color !== this.color) ||
                (epSquare === currentPosition && epColor === this.color)
            )
        ) {
            console.log("Got here! 647");
            boardSquareReference = gameboard.board[currentPosition];
            if (boardSquareReference !== "") {
                pieceSquareReference = boardSquareReference.square;
                boardSquareReference.square = -1;
            }

            gameboard.board[currentPosition] = this;
            gameboard.board[this.square] = "";
            this.square = currentPosition;

            if (!gameboard.isAttacked(king.square, oppositeColor)) {
                movableSquares.push(currentPosition);
            }

            if (boardSquareReference !== "") {
                boardSquareReference.square = pieceSquareReference;
            }

            this.square = actualCurrentSquare;
            gameboard.board[this.square] = this;
            gameboard.board[currentPosition] = boardSquareReference;
        }
        if (onlyAttack) {
            return movableSquares;
        }

        let isNotBlocked = false;
        currentPosition = this.square - 8 * moveDirection; // moving forward one square
        if (gameboard.board[currentPosition] === "") {
            
            boardSquareReference = gameboard.board[currentPosition];
            
            if (boardSquareReference !== "") {
                pieceSquareReference = boardSquareReference.square;
                boardSquareReference.square = -1;
            }

            gameboard.board[currentPosition] = this;
            gameboard.board[this.square] = "";
            this.square = currentPosition;

            if (!gameboard.isAttacked(king.square, oppositeColor)) {
                movableSquares.push(currentPosition);
            }

            if (boardSquareReference !== "") {
                boardSquareReference.square = pieceSquareReference;
            }

            this.square = actualCurrentSquare;
            gameboard.board[this.square] = this;
            gameboard.board[currentPosition] = boardSquareReference;

            isNotBlocked = true;
        }
        
        if (isNotBlocked) {
            currentPosition = this.square;
            if (this.color === "w" && currentPosition <= 55 && currentPosition >= 48) { // moving forward a second square if on the first row
                currentPosition -= 16;
                if (gameboard.board[currentPosition] === "") {
                    boardSquareReference = gameboard.board[currentPosition];
                    if (boardSquareReference !== "") {
                        pieceSquareReference = boardSquareReference.square;
                        boardSquareReference.square = -1;
                    }

                    gameboard.board[currentPosition] = this;
                    gameboard.board[this.square] = "";
                    this.square = currentPosition;

                    if (!gameboard.isAttacked(king.square, oppositeColor)) {
                        movableSquares.push(currentPosition);
                    }

                    if (boardSquareReference !== "") {
                        boardSquareReference.square = pieceSquareReference;
                    }

                    this.square = actualCurrentSquare;
                    gameboard.board[this.square] = this;
                    gameboard.board[currentPosition] = boardSquareReference;
                }
            } else if (this.color === "b" && currentPosition <= 15 && currentPosition >= 8) {
                currentPosition += 16;
                if (gameboard.board[currentPosition] === "") {
                    boardSquareReference = gameboard.board[currentPosition];
                    if (boardSquareReference !== "") {
                        pieceSquareReference = boardSquareReference.square;
                        boardSquareReference.square = -1;
                    }

                    gameboard.board[currentPosition] = this;
                    gameboard.board[this.square] = "";
                    this.square = currentPosition;

                    if (!gameboard.isAttacked(king.square, oppositeColor)) {
                        movableSquares.push(currentPosition);
                    }

                    if (boardSquareReference !== "") {
                        boardSquareReference.square = pieceSquareReference;
                    }

                    this.square = actualCurrentSquare;
                    gameboard.board[this.square] = this;
                    gameboard.board[currentPosition] = boardSquareReference;
                }
            }
        }

        return movableSquares;
    }

    generateMoves(gameboard) {
        this.moves = this.calculateMoves(gameboard, false);
    }
}

class Portal {
    square;
    color;
    name = "Portal";
    moves = [];
    id;
    link;
    deactivatedTurns = 0;
    active = true;

    constructor (square, color) {
        this.square = square;
        this.color = color;
        this.id = (this.color === "w") ? "O" : "o";
    }

    generateMoves(gameboard, skipKingCheck = false) {
        if (this.square === -1 || !this.active) {
            this.moves = [];
            return;
        } 
        let movableSquares = [];
        let currentPosition = this.square;

        // ONE SQUARE OUTWARDS

        if (currentPosition >= 8 && currentPosition % 8 !== 0) { // square 1 towards a8
            if (gameboard.board[currentPosition - 9] === "") {
                checkMovableSquare(this, movableSquares, gameboard, currentPosition - 9, this.color, skipKingCheck);
            }
        }

        if (currentPosition >= 8) { // square 1 towards RANK 8
            if (gameboard.board[currentPosition - 8] === "") {
                checkMovableSquare(this, movableSquares, gameboard, currentPosition - 8, this.color, skipKingCheck);
            }
        }
        
        if (currentPosition >= 8 && currentPosition % 8 !== 7) { // square 1 towards h8
            if (gameboard.board[currentPosition - 7] === "") {
                checkMovableSquare(this, movableSquares, gameboard, currentPosition - 7, this.color, skipKingCheck);
            }
        }

        if (currentPosition % 8 !== 7) { // square 1 towards FILE H
            if (gameboard.board[currentPosition + 1] === "") {
                checkMovableSquare(this, movableSquares, gameboard, currentPosition + 1, this.color, skipKingCheck);
            }
        }

        if (currentPosition <= 55 && currentPosition % 8 !== 7) { // square 1 towards h1
            if (gameboard.board[currentPosition + 9] === "") {
                checkMovableSquare(this, movableSquares, gameboard, currentPosition + 9, this.color, skipKingCheck);
            }
        }

        if (currentPosition <= 55) { // square 1 towards RANK 1
            if (gameboard.board[currentPosition + 8] === "") {
                checkMovableSquare(this, movableSquares, gameboard, currentPosition + 8, this.color, skipKingCheck);
            }
        }

        if (currentPosition <= 55 && currentPosition % 8 !== 0) { // square 1 towards a1
            if (gameboard.board[currentPosition + 7] === "") {
                checkMovableSquare(this, movableSquares, gameboard, currentPosition + 7, this.color, skipKingCheck);
            }
        }

        if (currentPosition % 8 !== 0) { // square 1 towards FILE A
            if (gameboard.board[currentPosition - 1] === "") {
                checkMovableSquare(this, movableSquares, gameboard, currentPosition - 1, this.color, skipKingCheck);
            }
        }

        // TWO SQUARES OUTWARDS

        if (currentPosition >= 16) { // square 2 towards RANK 8
            if (gameboard.board[currentPosition - 16] === "") {
                checkMovableSquare(this, movableSquares, gameboard, currentPosition - 16, this.color, skipKingCheck);
            }
        }

        if (currentPosition % 8 <= 5) { // square 2 towards FILE H
            if (gameboard.board[currentPosition + 2] === "") {
                checkMovableSquare(this, movableSquares, gameboard, currentPosition + 2, this.color, skipKingCheck);
            }
        }

        if (currentPosition <= 47) { // square 2 towards RANK 1
            if (gameboard.board[currentPosition + 16] === "") {
                checkMovableSquare(this, movableSquares, gameboard, currentPosition + 16, this.color, skipKingCheck);
            }
        }

        if (currentPosition % 8 >= 2) { // square 2 towards FILE A
            if (gameboard.board[currentPosition - 2] === "") {
                checkMovableSquare(this, movableSquares, gameboard, currentPosition - 2, this.color, skipKingCheck);
            }
        }

        this.moves = movableSquares;
    }
}

class Board {
    board = [];
    turn;
    pieces = {
        w: {
            P: [],
            R: [],
            B: [],
            N: [],
            Q: [],
            K: [],
            O: [],
        },
        b: {
            P: [],
            R: [],
            B: [],
            N: [],
            Q: [],
            K: [],
            O: [],
        }
    };
    moves = [];
    inCheck = "";
    enPassantable;
    castleable;
    halfMoveClock;
    fullMoveCount;

    pieceMap = {
        "R": Rook,
        "B": Bishop,
        "Q": Queen,
        "N": Knight,
        "K": King,
        "P": Pawn,
        "O": Portal,
    };

    constructor (fen) {
        let result = this.loadFen(fen);
        if (!result) {
            console.log("The board is invalid.");
        }
    }

    /* 
     * Loads a FEN string into the Board instance.
     * The FEN parser accepts a modified syntax that supports Portals, indicated by the letter "O".
     * A standard FEN that doesn't include Portals will load a board with two Portals off the board.
    */
    loadFen(fen) {
        fen = fen.split(/ /g);
        if (fen.length !== 6) {
            return false;
        }

        this.turn = fen[1].toLowerCase();
        this.castleable = {
            "wK": fen[2].includes("K"),
            "wQ": fen[2].includes("Q"),
            "bK": fen[2].includes("k"),
            "bQ": fen[2].includes("q"),
        };
        this.enPassantable = (fen[3] !== "-") ? [ this.coordToNum(fen[3]), this.turn ] : [-1, ""];
        this.halfMoveClock = parseInt(fen[4]);
        this.fullMoveCount = parseInt(fen[5]);

        let boardState = fen[0].split(/\//g);

        let spaceCounter = 0;
        for (let row of boardState) { // loop through every character in the FEN and convert it to a square
            for (let pieceChar of row) {
                if (/\d/g.test(pieceChar)) {
                    let emptySpaces = parseInt(pieceChar);
                    for (let i = 0; i < emptySpaces; i++) {
                        this.board.push("");
                    }
                    spaceCounter += emptySpaces;
                } else {
                    let pieceId = pieceChar.toUpperCase();
                    let color = (pieceId === pieceChar) ? "w" : "b";
                    let gamepiece = new this.pieceMap[pieceId](spaceCounter, color);
                    this.board.push(gamepiece);
                    this.pieces[color][pieceId].push(gamepiece);
                    spaceCounter += 1;
                }
            }
        }

        /* 
         * the below conditions are to circumvent the error case of only having
         * 1 portal in the FEN, which is impossible because both portals are automatically
         * removed when one is captured
        */

        // if there are NO portals in the FEN, create ones off the board
        if (this.pieces["w"]["O"].length === 0) {
            this.pieces["w"]["O"].push(new Portal(-1, "w"));
            this.pieces["w"]["O"].push(new Portal(-1, "w"));
        }
        if (this.pieces["b"]["O"].length === 0) {
            this.pieces["b"]["O"].push(new Portal(-1, "b"));
            this.pieces["b"]["O"].push(new Portal(-1, "b"));
        }

        // if there are TWO portals in the current board state, link them together
        if (this.pieces["w"]["O"].length === 2) {
            let portal1 = this.pieces["w"]["O"][0];
            let portal2 = this.pieces["w"]["O"][1];
            portal1.link = portal2;
            portal2.link = portal1;
        }
        if (this.pieces["b"]["O"].length === 2) {
            let portal1 = this.pieces["b"]["O"][0];
            let portal2 = this.pieces["b"]["O"][1];
            portal1.link = portal2;
            portal2.link = portal1;
        }

        for (let [_, instances] of Object.entries(this.pieces[this.turn])) {
            for (let piece of instances) {
                piece.generateMoves(this);
            }
        }

        if (this.pieces["w"]["K"].length !== 1 || this.pieces["b"]["K"].length !== 1) { // if either side doesn't have a King
            return false;
        } else if (this.pieces["w"]["O"].length !== 2 || this.pieces["b"]["O"].length !== 2) { // if either side doesn't have two portals
            return false;
        } else {
            return true;
        }
    }

    // Returns a pretty-printed version of the board.
    printBoard(marks = []) {
        let boardStr = "\n   a  b  c  d  e  f  g  h \n";
        for (let i = 0; i < 8; i++) {
            boardStr += `${8 - i}|`;
            for (let j = 0; j < 8; j++) {
                let piece = this.board[i * 8 + j];
                if (piece === "") {
                    if (marks.includes(i * 8 + j)) {
                        boardStr += "[@]";
                    } else {
                        boardStr += "[ ]";
                    }
                } else if (piece.name === "Portal") {
                    if (marks.includes(i * 8 + j)) {
                        boardStr += "[X]";
                    } else {
                        boardStr += `[${piece.id}]`;
                    }
                } else {
                    if (marks.includes(i * 8 + j)) {
                        boardStr += "[X]";
                    } else {
                        boardStr += `[${piece.id}]`;
                    }
                }
            }
            boardStr += "\n";
        }
        return boardStr;
    }

    // Converts board coordinates (e.g. "a4", "c7") into a 
    // number from 0 to 63.
    coordToNum(coord) {
        if (!/^[a-h][1-8]$/g.test(coord)) {
            console.log(`Invalid coordinate: ${coord}`);
            return -1;
        }

        let files = "abcdefgh";

        let rank = coord.charAt(1);
        let file = coord.charAt(0);

        return (8 - parseInt(rank)) * 8 + files.indexOf(file);
    }

    numToCoord(num) {
        if (num > 63 || num < 0) {
            console.log(`Invalid number: ${num}`);
            return "";
        }

        let files = "abcdefgh";

        let rank = (Math.trunc((63 - num) / 8) + 1).toString();
        let file = files.charAt(num % 8);

        return file + rank;
    }

    isAttacked(square, byColor) { // check if a square is under attack (to prevent Kings from moving there)
        for (let [id, instances] of Object.entries(this.pieces[byColor])) {
            if (id === "P") { // manually check diagonal captures
                for (let piece of instances) {
                    let moves = piece.calculateMoves(this, true);
                    if (moves.includes(square)) {
                        return true;
                    }
                }
            } else if (id === "K") {
                // specifically check every square around a king
                // because calling King.generateMoves results in a recursive stack overflow
                let king = instances[0];
                let moves = [];

                // edge case: if the King's square is -1, do nothing because 
                // it's off the board for some unknown reason
                if (king.square >= 0) {
                    // refer to King class for each condition and its associated move
                    if (king.square >= 8 && king.square % 8 !== 0) {
                        moves.push(king.square - 9);
                    }
                    if (king.square >= 8) {
                        moves.push(king.square - 8);
                    }
                    if (king.square >= 8 && king.square % 8 !== 7) {
                        moves.push(king.square - 7);
                    }
                    if (king.square % 8 !== 7) {
                        moves.push(king.square + 1);
                    }
                    if (king.square <= 55 && king.square % 8 !== 7) {
                        moves.push(king.square + 9);
                    }
                    if (king.square <= 55) {
                        moves.push(king.square + 8);
                    }
                    if (king.square <= 55 && king.square % 8 !== 0) {
                        moves.push(king.square + 7);
                    }
                    if (king.square % 8 !== 0) {
                        moves.push(king.square - 1);
                    }
                }

                if (moves.includes(square)) {
                    return true;
                }
            } else if (id !== "O" ) { // skip Portals because they can't attack
                for (let piece of instances) {
                    piece.generateMovesSkipKing(this);
                    let moves = piece.movesSkipKing;
                    if (moves.includes(square)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    placePortals(locations, byOpponent) {
        this.halfMoveClock++;
        let oppositeTurn = (this.turn == "w") ? "b" : "w";

        let portals = this.pieces[this.turn]["O"];
        portals[0].square = locations[0];
        portals[1].square = locations[1];
        this.board[locations[0]] = portals[0];
        this.board[locations[1]] = portals[1];

        let moveObject = { // store all past moves
            color: this.turn,
            to: locations,
            id: "O",
            special: "Portal Placement",
            flags: [],
        };

        // update full move count if necessary            
        if (this.turn === "b") {
            this.fullMoveCount++;
        }

        // detect and report check
        let oppositeKing = this.pieces[oppositeTurn]["K"][0];
        if (this.isAttacked(oppositeKing.square, this.turn)) {
            console.log(`${oppositeTurn === "w" ? "White" : "Black"} is in check!`);
            this.inCheck = oppositeTurn;
            moveObject.flags.push("check");
        } else {
            this.inCheck = "";
        }

        // update whose turn it is
        this.turn = oppositeTurn;

        // store the move that was made
        this.moves.push(moveObject);

        // generate and cache all available moves for the next player
        let nextTurnHasAvailableMoves = false;
        for (let [id, instances] of Object.entries(this.pieces[this.turn])) {
            for (let piece of instances) {
                if (id === "O") {
                    if (!piece.active) {
                        piece.deactivatedTurns++;
                    }
                    if (piece.deactivatedTurns === 3) {
                        piece.active = true;
                        piece.deactivatedTurns = -1;
                    }
                    piece.generateMoves(this);
                    if (piece.moves.length > 0) {
                        nextTurnHasAvailableMoves = true;
                    }
                } else {
                    piece.generateMoves(this);
                    if (piece.moves.length > 0) {
                        nextTurnHasAvailableMoves = true;
                    }
                }
            }
        }

        // detect if next player has no available moves and report checkmate/stalemate accordingly
        if (!nextTurnHasAvailableMoves) {
            if (this.inCheck === this.turn) {
                console.log(`${oppositeTurn === "w" ? "White" : "Black"} is in checkmate!`);
                moveObject.flags[0] = "win";
                moveObject.flags.push("checkmate");
            } else {
                console.log(`${oppositeTurn === "w" ? "White" : "Black"} is in stalemate!`);
                moveObject.flags.push("draw");
                moveObject.flags.push("stalemate");
            }
        } else if (this.halfMoveClock === 50) {
            console.log("The match was drawn by the 50-move rule.");
            moveObject.flags = [];
            moveObject.flags.push("draw");
            moveObject.flags.push("the 50-move rule");
        }

        return moveObject;
    }

    movePiece(squareFrom, squareTo, promotion="") {

        this.halfMoveClock++; // increment at the beginning so that the function can reset it (if needed) later
        let piece = this.board[squareFrom]; // the piece being moved

        let moveObject = { // an object that represents a given move, to be stored in an array
            color: piece.color,
            from: squareFrom,
            to: squareTo,
            id: piece.id,
            special: undefined,
            flags: [],
        };
        let oppositeTurn = (piece.color === "w") ? "b" : "w";

        if (piece.name === "Pawn") { // if pawn moves, reset clock for 50-move draw
            this.halfMoveClock = 0;
        }

        let capturedPiece = this.board[squareTo];
        if (piece.name === "Pawn" && squareTo === this.enPassantable[0] && piece.color === this.enPassantable[1]) {
            if (this.turn === "w") {
                capturedPiece = this.board[squareTo + 8];
                this.board[squareTo + 8] = "";
            } else {
                capturedPiece = this.board[squareTo - 8];
                this.board[squareTo - 8] = "";
            }
        } else if (capturedPiece.name === "Portal" && capturedPiece.color === oppositeTurn) {
            capturedPiece.square = -1;
            capturedPiece.active = false;
            capturedPiece.deactivatedTurns = -1;

            this.board[capturedPiece.link.square] = "";

            capturedPiece.link.square = -1;
            capturedPiece.link.active = false;
            capturedPiece.link.deactivatedTurns = -1;
        }
        
        if (capturedPiece !== "") { // remove captured pieces from the board
            this.halfMoveClock = 0;
            capturedPiece.square = -1;
            if (capturedPiece.name !== "Portal") {
                this.pieces[oppositeTurn][capturedPiece.id.toUpperCase()] = 
                    this.pieces[oppositeTurn][capturedPiece.id.toUpperCase()].filter(i => i !== capturedPiece);
            }
        }

        // update whether a side can castle
        if ((this.castleable[`${piece.color}K`] || this.castleable[`${piece.color}Q`])) {
            if (piece.name === "King") {
                this.castleable[`${piece.color}K`] = false;
                this.castleable[`${piece.color}Q`] = false;
            } else if (piece.name === "Rook") {
                if (piece.square % 8 === 7) {
                    this.castleable[`${piece.color}K`] = false;
                } else if (piece.square % 8 === 0) {
                    this.castleable[`${piece.color}Q`] = false;
                }
            }
        }

        if (piece.name === "King" && Math.abs(squareFrom - squareTo) === 2) { // castle King and Rook
            piece.square = squareTo;
            this.board[squareFrom] = "";
            this.board[squareTo] = piece;

            if (squareTo === squareFrom - 2) { // castling Queen-side
                let rook = this.board[squareFrom - 4];
                rook.square = squareFrom - 1;
                this.board[squareFrom - 1] = rook;
                this.board[squareFrom - 4] = "";
                moveObject.special = "Castle Q";
            } else { // castling King-side
                let rook = this.board[squareFrom + 3];
                rook.square = squareFrom + 1;
                this.board[squareFrom + 1] = rook;
                this.board[squareFrom + 3] = "";
                moveObject.special = "Castle K";
            }
        } else {
            // move the piece
            piece.square = squareTo;
            this.board[squareFrom] = "";
            this.board[squareTo] = piece;
        }
        
        // update the full move count if two half-moves were made
        if (this.turn === "b") {
            this.fullMoveCount++;
        }

        if (piece.name === "Pawn") { // record en passant square and handle promotion
            if (piece.color === "w" && squareFrom - squareTo === 16) {
                this.enPassantable = [squareFrom - 8, oppositeTurn];
            } else if (piece.color === "b" && squareFrom - squareTo === -16) {
                this.enPassantable = [squareFrom + 8, oppositeTurn];
            } else {
                this.enPassantable = [-1, ""];
            }
            
            if (
                promotion !== "" && (
                    (squareTo <= 7 && piece.color === "w") ||
                    (squareTo >= 56 && piece.color === "b")
                )
            ) {
                this.pieces[piece.color]["P"] =
                    this.pieces[piece.color]["P"].filter(i => i !== piece);
                
                let newPiece = new this.pieceMap[promotion](piece.square, piece.color);
                this.pieces[piece.color][promotion].push(newPiece);
                moveObject.special = `Promotion ${promotion.toUpperCase()}`;
            }
        } else {
            this.enPassantable = [-1, ""];
        }

        // detect and report check
        let oppositeKing = this.pieces[oppositeTurn]["K"][0];
        if (this.isAttacked(oppositeKing.square, this.turn)) {
            console.log(`${oppositeTurn === "w" ? "White" : "Black"} is in check!`);
            this.inCheck = oppositeTurn;
            moveObject.flags.push("check");
        } else {
            this.inCheck = "";
        }

        // update whose turn it is
        this.turn = oppositeTurn;

        // store the move that was made
        this.moves.push(moveObject);

        // generate and cache all available moves for the next player
        let nextTurnHasAvailableMoves = false;
        for (let [id, instances] of Object.entries(this.pieces[this.turn])) {
            for (let piece of instances) {
                if (id === "O") {
                    if (!piece.active) {
                        piece.deactivatedTurns++;
                    }
                    if (piece.deactivatedTurns === 3) {
                        piece.active = true;
                        piece.deactivatedTurns = -1;
                    }
                    piece.generateMoves(this);
                    if (piece.moves.length > 0) {
                        nextTurnHasAvailableMoves = true;
                    }
                } else {
                    piece.generateMoves(this);
                    if (piece.moves.length > 0) {
                        nextTurnHasAvailableMoves = true;
                    }
                }
            }
        }

        // detect if next player has no available moves and report checkmate/stalemate accordingly
        if (!nextTurnHasAvailableMoves) {
            if (this.inCheck === this.turn) {
                console.log(`${oppositeTurn === "w" ? "White" : "Black"} is in checkmate!`);
                moveObject.flags[0] = "win";
                moveObject.flags.push("checkmate");
            } else {
                console.log(`${oppositeTurn === "w" ? "White" : "Black"} is in stalemate!`);
                moveObject.flags.push("draw");
                moveObject.flags.push("stalemate");
            }
        } else if (this.halfMoveClock === 50) {
            console.log("The match was drawn by the 50-move rule.");
            moveObject.flags = [];
            moveObject.flags.push("draw");
            moveObject.flags.push("the 50-move rule");
        }

        return moveObject;
    }
}