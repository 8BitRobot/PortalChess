const ws = require("ws");
const express = require("express");
const path = require("path");

let games = {
    "test": {
        fen: "4k3/8/8/4q3/8/8/8/4KB2 w - - 0 1",
        status: {
            current: "NOT STARTED",
            result: undefined,
        },
        players: {
            "w": undefined,
            "b": undefined
        },
        moves: [],
    },
    "test2": {
        fen: "k7/8/8/3r4/8/1N6/8/3K4 w - - 0 1",
        status: {
            current: "NOT STARTED",
            result: undefined,
        },
        players: {
            "w": undefined,
            "b": undefined
        },
        moves: [],
    },
    "abc": {
        fen: "3qk3/2pp4/8/4p3/4P3/8/3P2P1/4KBN1 w - - 0 1",
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

const PORT = process.env.PORT || 8080;
const INDEX = path.join(__dirname, 'index.html');

const server = express()
    .get("/", (req, res) => {
        res.sendFile(INDEX);
    })
    .use("/js", express.static(path.join(__dirname, "js")))
    .use("/css", express.static(path.join(__dirname, "css")))
    .use("/pieces", express.static(path.join(__dirname, "pieces")))
    .use("/icons", express.static(path.join(__dirname, "icons")))
    .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new ws.Server({
    server: server
});

wss.on("connection", (ws) => {
    console.log("connected!");

    ws.on("message", (msg) => {
        let data = JSON.parse(msg);
        if (!Object.keys(games).includes(data.code)) {
            games[data.code] = {
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

                games[data.code] = {
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
                };
                break;
        }
    });
});