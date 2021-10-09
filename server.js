const ws = require("ws");

let games = {
    "test": {
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        status: {
            current: "NOT STARTED",
            result: undefined,
        },
        players: {
            "w": undefined,
            "b": undefined
        },
        moves: [],
    }
};

const wss = new ws.Server({
    port: 8080,
});

/*
 *
 * This function has been copied and modified from chess.js by Jeff Hlywa.
 * 
 * Copyright (c) 2021, Jeff Hlywa (jhlywa@gmail.com)
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 *
 *----------------------------------------------------------------------------
*/

/*
function validate_fen(fen) {
    var errors = {
        0: 'No errors.',
        1: 'FEN string must contain six space-delimited fields.',
        2: '6th field (move number) must be a positive integer.',
        3: '5th field (half move counter) must be a non-negative integer.',
        4: '4th field (en-passant square) is invalid.',
        5: '3rd field (castling availability) is invalid.',
        6: '2nd field (side to move) is invalid.',
        7: "1st field (piece positions) does not contain 8 '/'-delimited rows.",
        8: '1st field (piece positions) is invalid [consecutive numbers].',
        9: '1st field (piece positions) is invalid [invalid piece].',
        10: '1st field (piece positions) is invalid [row too large].',
        11: 'Illegal en-passant square',
    }

    // 1st criterion: 6 space-seperated fields?
    var tokens = fen.split(/\s+/)
    if (tokens.length !== 6) {
        return { valid: false, error_number: 1, error: errors[1] }
    }

    // 2nd criterion: move number field is a integer value > 0?
    if (isNaN(tokens[5]) || parseInt(tokens[5], 10) <= 0) {
        return { valid: false, error_number: 2, error: errors[2] }
    }

    // 3rd criterion: half move counter is an integer >= 0?
    if (isNaN(tokens[4]) || parseInt(tokens[4], 10) < 0) {
        return { valid: false, error_number: 3, error: errors[3] }
    }

    // 4th criterion: 4th field is a valid e.p.-string?
    if (!/^(-|[abcdefgh][36])$/.test(tokens[3])) {
        return { valid: false, error_number: 4, error: errors[4] }
    }

    // 5th criterion: 3th field is a valid castle-string?
    if (!/^(KQ?k?q?|Qk?q?|kq?|q|-)$/.test(tokens[2])) {
        return { valid: false, error_number: 5, error: errors[5] }
    }

    // 6th criterion: 2nd field is "w" (white) or "b" (black)?
    if (!/^(w|b)$/.test(tokens[1])) {
        return { valid: false, error_number: 6, error: errors[6] }
    }

    // 7th criterion: 1st field contains 8 rows?
    var rows = tokens[0].split('/')
    if (rows.length !== 8) {
        return { valid: false, error_number: 7, error: errors[7] }
    }

    // 8th criterion: every row is valid?
    for (var i = 0; i < rows.length; i++) {
        // check for right sum of fields AND not two numbers in succession
        var sum_fields = 0
        var previous_was_number = false

        for (var k = 0; k < rows[i].length; k++) {
        if (!isNaN(rows[i][k])) {
            if (previous_was_number) {
            return { valid: false, error_number: 8, error: errors[8] }
            }
            sum_fields += parseInt(rows[i][k], 10)
            previous_was_number = true
        } else {
            if (!/^[prnbqkPRNBQK]$/.test(rows[i][k])) {
            return { valid: false, error_number: 9, error: errors[9] }
            }
            sum_fields += 1
            previous_was_number = false
        }
        }
        if (sum_fields !== 8) {
        return { valid: false, error_number: 10, error: errors[10] }
        }
    }

    if (
        (tokens[3][1] == '3' && tokens[1] == 'w') ||
        (tokens[3][1] == '6' && tokens[1] == 'b')
    ) {
        return { valid: false, error_number: 11, error: errors[11] }
    }

    // everything's okay!
    return { valid: true, error_number: 0, error: errors[0] }
}
*/

wss.on("connection", (ws) => {
    console.log("connected!");

    ws.on("message", (msg) => {
        let data = JSON.parse(msg);
        if (!Object.keys(games).includes(data.code)) {
            games[data.code] = {
                fen: "8/1PK5/8/8/8/8/2p5/2k5 w - - 0 1",
                status: {
                    current: "NOT STARTED",
                    result: undefined,
                },
                players: {
                    "w": undefined,
                    "b": undefined
                },
                moves: [],
            };
        };
        let oppositeColor;
        let players = games[data.code].players;
        console.log(data);
        switch (data.event) {
            case "REG": // registering a new player
                if (players["w"] !== undefined && players["b"] !== undefined) {
                    console.log(players);
                    ws.send(JSON.stringify({
                        event: "REG",
                        successful: false,
                    }));
                } else {
                    let color;
                    if (players["w"] === undefined && players["b"] === undefined) {
                        color = Math.random() < 0.5 ? "w" : "b";
                        players[color] = ws;
                        ws.send(JSON.stringify({
                            event: "REG",
                            successful: true,
                            color: color,
                            fen: games[data.code].fen,
                        }));
                    } else {
                        if (players["w"] === undefined) {
                            players["w"] = ws;
                            ws.send(JSON.stringify({
                                event: "REG",
                                successful: true,
                                color: "w",
                                fen: games[data.code].fen,
                            }));
                        } else {
                            players["b"] = ws;
                            ws.send(JSON.stringify({
                                event: "REG",
                                successful: true,
                                color: "b",
                                fen: games[data.code].fen,
                            }));
                        }
                        games[data.code].status.current = "STARTED";
                        players["w"].send(JSON.stringify({
                            event: "STA",
                        }));
                        players["b"].send(JSON.stringify({
                            event: "STA",
                        }));
                    }
                    players[color] = ws;
                } 
                break;

            case "MOV": // moving a piece
            case "DR?": // offering a draw
            case "DR!": // responding to a draw offer
                oppositeColor = (data.color === "w") ? "b" : "w";
                players[oppositeColor].send(JSON.stringify(data));
                break;

            case "FIN": // ending the game
                games[data.code].status.current = "FINISHED";
                games[data.code].status.result = [data.winner, data.result];
                oppositeColor = (data.color === "w") ? "b" : "w";
                players[oppositeColor].send(JSON.stringify(data));
                break;
        }
    });
});