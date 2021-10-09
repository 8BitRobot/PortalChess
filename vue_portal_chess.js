const Chess = {
    data() {
        return {
            ws: undefined,
            board: undefined,
            canMove: false,
            portalPlacement: {
                placing: false,
                selected: new Set(),
            },
            promotion: {
                promoting: undefined,
                promotionChoice: "",
            },
            moves: {
                square: undefined,
                movable: [],
            },
            gamedata: {
                code: "",
                submitted: false,
                status: ["setup"],
                color: "",
            },
            quitButtons: {
                resign: false,
                draw: false,
            },
            drawOffer: {
                offered: false,
                offerStatus: undefined,
                offeredOnMove: undefined,
                received: false,
                receivedStatus: undefined,
                receivedOnMove: undefined,
            }
        };
    },
    mounted() {
        this.connectWS();
    },
    computed: {
        resignButtonText() {
            if (this.quitButtons.resign) {
                return "Are you sure?";
            } else {
                return "Resign";
            }
        },
        offerDrawButtonText() {
            if (this.quitButtons.draw) {
                return "Are you sure?";
            } else {
                return "Offer Draw";
            }
        },
        portalPlaceable() {
            if (
                this.canMove &&
                this.board !== undefined &&
                this.board.inCheck !== this.gamedata.color &&
                this.board.pieces[this.gamedata.color]["O"][0].active &&
                this.board.pieces[this.gamedata.color]["O"][1].active &&
                this.board.pieces[this.gamedata.color]["O"][0].square === -1 &&
                this.board.pieces[this.gamedata.color]["O"][1].square === -1
            ) {
                return true;
            } else {
                return false;
            }
        },
        statusMessage() {
            if (this.gamedata.status[0] === "setup" && this.gamedata.submitted) {
                return ["Waiting for opponent", "Share the game code with another player!"]
            } else if (this.gamedata.status[0] === "setup") {
                return [""];
            } else if (this.gamedata.status[0] === "waiting") {
                return ["Opponent's turn", "Wait for the other player's move."];
            } else if (this.gamedata.status[0] === "playing") {
                return ["Your turn", "Click on a piece to make your move."];
            } else if (this.gamedata.status[0] === "finished") {
                let msg1, msg2;
                if (this.gamedata.status[1] === "win") {
                    msg1 = "Victory";
                    let winnerColor = (this.gamedata.color === "w") ? "White" : "Black";
                    msg2 = `${winnerColor} won by ${this.gamedata.status[2]}.`;
                } else if (this.gamedata.status[1] === "loss") {
                    msg1 = "Defeat";
                    let winnerColor = (this.gamedata.color === "w") ? "Black" : "White";
                    msg2 = `${winnerColor} won by ${this.gamedata.status[2]}.`;
                } else {
                    msg1 = "Draw";
                    msg2 = `The match was drawn by ${this.gamedata.status[2]}.`;
                }
                return [msg1, msg2];
            } else {
                return [""];
            }
        },
        canViewDrawOffer() {
            return this.drawOffer.received && this.drawOffer.receivedStatus === "waiting" && this.board.fullMoveCount < this.drawOffer.receivedOnMove + 4;
        },
        canViewDrawOfferListener() {
            let offer = this.canViewDrawOffer;
            if (!offer && this.drawOffer.receivedStatus === "waiting") {
                this.drawOffer.receivedStatus = "ignored";
                this.ws.send(JSON.stringify({
                    event: "DR!",
                    code: this.gamedata.code,
                    color: this.gamedata.color,
                    response: "ignored",
                }));
            }
        },
    },
    methods: {
        connectWS() {
            this.ws = new WebSocket("wss://portalchess.herokuapp.com:8080");

            this.ws.onopen = () => {
                console.log("Connected!");
            };

            this.ws.onerror = (err) => {
                console.log("An error has occurred.");
                console.error(err);
                this.ws.close();
            }

            this.ws.onmessage = (msg) => {
                console.log(msg);
                let data = JSON.parse(msg.data);
                switch (data.event) {
                    case "REG": // register the player's color
                        if (data.successful) {
                            console.log(`Success! The player is color ${data.color}`);
                            this.gamedata.color = data.color;
                            this.board = new Board(data.fen);
                        } else {
                            console.log("This game already has two players.");
                        }
                        break;

                    case "MOV": // move the opponent's piece
                        console.log("The opponent moved:");
                        if (data.special === "Portal Placement") {
                            this.placePortals(data.to, true);
                        } else if (data.special !== undefined && data.special.startsWith("Promotion")) {
                            this.promotion.promotionChoice = data.special[data.special.length - 1];
                            this.movePiece(data.to, data.from, true)
                        } else {
                            this.movePiece(data.to, data.from, true);
                        }
                        this.canMove = true;
                        this.gamedata.status = ["playing"];
                        break;

                    case "STA": // the opponent joined and the game is starting
                        console.log("The game is starting!");
                        if (this.gamedata.color === "w") {
                            this.canMove = true;
                            this.gamedata.status = ["playing"];
                        } else {
                            this.gamedata.status = ["waiting"];
                        }
                        break;

                    case "FIN": // the opponent ended the game somehow
                        console.log("The game is over!");
                        let victory = (this.gamedata.color === data.winner) ? "win" : (data.winner === "-") ? "draw" : "loss";
                        this.gamedata.status = ["finished", victory, data.result];
                        break;
                    
                    case "DR?":
                        console.log("The opponent offered a draw!");
                        this.drawOffer.received = true;
                        this.drawOffer.receivedStatus = "waiting";
                        this.drawOffer.receivedOnMove = this.board.fullMoveCount;
                        break;
                
                    case "DR!":
                        this.drawOffer.offerStatus = data.response;
                        break;
                }
            }

            this.ws.onclose = () => {
                console.log("Disconnected!");

                setTimeout(() => {
                    this.connectWS();
                }, 3000);
            }
        },
        submitCode() {
            if (this.ws === undefined) {
                console.log("Can't connect to server.")
            } else {
                this.gamedata.submitted = true;
                console.log("Sending code REG");
                this.ws.send(JSON.stringify({
                    event: "REG",
                    code: this.gamedata.code,
                }));
            }
        },
        pieceToImageUrl(piece) {
            if (piece === "") {
                return "";
            } else {
                return `pieces/${piece.color}${piece.id.toUpperCase()}.png`;
            }
        },
        handleQuitButtons(button, confirm) {
            if (button === "resign") {
                if (!this.quitButtons.draw) {
                    if (!this.quitButtons.resign && confirm === undefined) {
                        this.quitButtons.resign = true;
                    } else if (this.quitButtons.resign && confirm) {
                        this.endGame(["loss", "resignation"]);
                    } else if (this.quitButtons.resign && !confirm) {
                        this.quitButtons.resign = false;
                    }
                }
            } else if (button === "draw") {
                if (!this.quitButtons.resign) {
                    if (!this.quitButtons.draw && confirm === undefined) {
                        this.quitButtons.draw = true;
                    } else if (this.quitButtons.draw && confirm) {
                        this.offerDraw();
                    } else if (this.quitButtons.draw && !confirm) {
                        this.quitButtons.draw = false;
                    }
                }
            }
        },
        handleDrawOfferReceipt(response) {
            if (this.drawOffer.received && this.drawOffer.receivedStatus === "waiting") {
                this.drawOffer.receivedStatus = (response) ? "accepted" : "rejected";
                if (response) {
                    this.ws.send(JSON.stringify({
                        event: "DR!",
                        code: this.gamedata.code,
                        color: this.gamedata.color,
                        response: "accepted",
                    }));
                    this.endGame(["draw", "agreement"]);
                } else {
                    this.ws.send(JSON.stringify({
                        event: "DR!",
                        code: this.gamedata.code,
                        color: this.gamedata.color,
                        response: "rejected",
                    }));
                }
            }
        },
        handleSquareClick(square) {
            if (this.gamedata.status[0] !== "finished") {
                if (this.portalPlacement.placing && this.portalPlaceable) {
                    if (this.portalPlacement.selected.has(square)) {
                        this.portalPlacement.selected.delete(square);
                    } else {
                        if (
                            this.board !== undefined &&
                            this.board.board[square] === "" &&
                            ((this.gamedata.color === "w" && square >= 32) ||
                            (this.gamedata.color === "b" && square <= 31))
                        ) {
                            this.portalPlacement.selected.add(square);
                        }
                    }
                    if (this.portalPlacement.selected.size === 2) {
                        this.placePortals();
                    }
                } else if (this.canMove && this.moves.movable.includes(square)) {
                    this.movePiece(square);
                } else if (this.canMove) {
                    this.getMoves(square);
                }
            }
        },
        getMoves(square) {
            if (this.canMove && !this.moves.movable.includes(square)) {
                if (
                    this.moves.square === square ||
                    this.board === undefined ||
                    this.board.board[square] === "" ||
                    this.board.board[square].color !== this.gamedata.color
                ) {
                    this.moves.square = undefined;
                    this.moves.movable = [];
                } else {
                    this.moves.square = square;
                    this.moves.movable = this.board.board[square].moves;
                }
            }
        },
        promotePawn(square) {
            return new Promise((resolve) => {
                this.promotion.promoting = square;
                let promotionCheck = setInterval(() => {
                    if (this.promotion.promotionChoice !== "") {
                        clearInterval(promotionCheck);
                        resolve();
                    }
                }, 50);
            });
        },
        placePortals(locations=Array.from(this.portalPlacement.selected), byOpponent=false) {
            let moveObject = this.board.placePortals(locations, byOpponent);
            moveObject.event = "MOV";
            moveObject.code = this.gamedata.code;
            if (!byOpponent) {
                this.ws.send(JSON.stringify(moveObject));
                this.canMove = false;
                this.gamedata.status = ["waiting"];
            }
            this.moves.square = undefined;
            this.moves.movable = [];
            this.portalPlacement.placing = false;
            this.portalPlacement.selected = new Set();
            if (!byOpponent && ["win", "draw"].includes(moveObject.flags[0])) {
                // if the player just delivered a game-ending move, end the game and tell the server
                // if the opponent's move ended the game, use the FIN websocket event to handle the game status instead
                this.endGame(moveObject.flags);
            }
        },
        async movePiece(squareTo, squareFrom=this.moves.square, byOpponent=false) {
            if (this.moves.movable.includes(squareTo) || byOpponent) {
                if (!byOpponent) {
                    if (
                        this.board.board[squareFrom].name === "Pawn" &&
                        (
                            (this.gamedata.color === "w" && squareTo <= 7) ||
                            (this.gamedata.color === "b" && squareTo >= 56)
                        )
                    ) {
                        await this.promotePawn(squareTo);
                    }
                }
                let moveObject = this.board.movePiece(squareFrom, squareTo, this.promotion.promotionChoice);
                moveObject.event = "MOV";
                moveObject.code = this.gamedata.code;
                if (!byOpponent) {
                    this.ws.send(JSON.stringify(moveObject));
                    this.canMove = false;
                    this.gamedata.status = ["waiting"];
                }
                this.moves.square = undefined;
                this.moves.movable = [];
                this.promotion.promoting = -1;
                this.promotion.promotionChoice = "";
                if (!byOpponent && ["win", "draw"].includes(moveObject.flags[0])) {
                    // handle game ending
                    this.endGame(moveObject.flags);
                }
            }
        },
        togglePortalSelection() {
            if (
                this.canMove &&
                this.board.pieces[this.gamedata.color]["O"][0].active &&
                this.board.pieces[this.gamedata.color]["O"][1].active
            ) {
                this.portalPlacement.placing = !this.portalPlacement.placing;
                this.portalPlacement.selected = new Set();
            }
        },
        endGame(result) {
            this.gamedata.status = ["finished", ...result];
            let oppositeColor = (this.gamedata.color === "w") ? "b" : "w";
            let winner = (result[0] === "draw") ? "-" : (result[0] === "win") ? this.gamedata.color : oppositeColor;
            this.ws.send(JSON.stringify({
                event: "FIN",
                code: this.gamedata.code,
                color: this.gamedata.color,
                winner: winner,
                result: result[1],
            }));
        },
        offerDraw() {
            this.drawOffer.offered = true;
            this.drawOffer.offerStatus = "waiting";
            this.drawOffer.offeredOnMove = this.board.fullMoveCount;
            this.ws.send(JSON.stringify({
                event: "DR?",
                code: this.gamedata.code,
                color: this.gamedata.color,
            }));
        }
    }
};

Vue.createApp(Chess).mount("#app");
