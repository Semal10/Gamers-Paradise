const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();

const server = http.createServer(app);

//initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

const clients = {};
const games = {};
const mapShapeToClientId = {};
let updates = null;

wss.on('connection', (ws) => {
    //connection is up
    ws.on('message', (message) => {
        console.log('Received from client : ', message);
        const response = JSON.parse(message);
        if (response.type === 'create') {
            const clientId = response.clientId;
            const gameId = uuid();

            games[gameId] = {
                "id": gameId,
                "clients": [{ clientId, shape: "cross" }],
                "playerTurn": clientId
            }

            const payLoad = {
                "type": "create",
                "game": games[gameId]
            }

            ws.send(JSON.stringify(payLoad));
        }
        if (response.type === 'join') {
            const clientId = response.clientId;
            const gameId = response.gameId;
            const game = games[gameId];
            if (game.clients.length >= 3) {
                console.log("Sorry! Maximum players reached!");
                return;
            }
            const shape = { "0": "cross", "1": "circle", "2": "triangle" }[game.clients.length];
            game.clients.push({
                "clientId": clientId,
                "shape": shape
            });
            mapShapeToClientId[shape] = clientId;

            // if(game.clients.length === 3){
            //     updates = setInterval(updateGameState,500);
            // }

            const payLoad = {
                "type": "join",
                "game": game
            }

            game.clients.forEach(c => {
                clients[c.clientId].ws.send(JSON.stringify(payLoad));
            })
        }
        if (response.type === 'play') {
            const clientId = response.clientId;
            const gameId = response.gameId;
            const box = response.box;
            const game = games[gameId];
            const shape = response.shape;

            let turnIndex = 0;
            game.clients.forEach((c, idx) => {
                if (c.clientId === game.playerTurn) turnIndex = idx;
            });
            console.log('TI', turnIndex);

            game.playerTurn = game.clients[(turnIndex + 1) % 3].clientId;
            console.log('PT', game.playerTurn);
            let state = game.state;
            if (!state)
                state = {};
            state[box] = shape
            game.state = state;

            const winner = calculateWinner(game.state);
            console.log('after calc winner', winner);
            sendUpdateToPlayers(game);
            if (winner !== "No winner") {
                game.clients.forEach(c => {
                    if (c.shape === winner) {
                        const payLoad = {
                            type: "winner",
                        }
                        clients[c.clientId].ws.send(JSON.stringify(payLoad));
                    }
                    else {
                        const payLoad = {
                            type: "loser",
                        }
                        clients[c.clientId].ws.send(JSON.stringify(payLoad));
                    }
                })
            }
        }
        if (response.type === 'winner') {
            clearInterval(updates);
            response.game.clients.forEach(c => {
                if (c.clientId === mapShapeToClientId[response.winner]) {
                    const payLoad = {
                        type: "winner",
                    }
                    clients[c.clientId].ws.send(JSON.stringify(payLoad));
                }
                else {
                    const payLoad = {
                        type: "loser",
                    }
                    clients[c.clientId].ws.send(JSON.stringify(payLoad));
                }
            })
            delete games[response.game.id];
        }
    });
    // generate a new clientId
    const clientId = uuid();
    clients[clientId] = {
        "ws": ws,
    }

    const payLoad = {
        "type": "connect",
        "clientId": clientId,
    }

    ws.send(JSON.stringify(payLoad));
});

server.listen(8080, () => {
    console.log("Listening on port : 8080");
});

const uuid = () => {
    return Math.floor(Math.random() * 100) + "-" + Math.floor(Math.random() * 100) + "-" + Math.floor(Math.random() * 100);
}

const updateGameState = () => {
    for (const g of Object.keys(games)) {
        const game = games[g];
        const payLoad = {
            "type": "update",
            "game": game,
        }
        game.clients.forEach(c => {
            clients[c.clientId].ws.send(JSON.stringify(payLoad));
        })
        console.log('update PT', game.playerTurn);
    }
    //setTimeout(updateGameState,500);
}

const sendUpdateToPlayers = (game) => {
    const payLoad = {
        "type": "update",
        "game": game,
    }

    game.clients.forEach(c => {
        clients[c.clientId].ws.send(JSON.stringify(payLoad));
    })
    //setTimeout(updateGameState,500);
}

const calculateWinner = (state) => {
    console.log(state);
    // //rows
    // if (state[1] === state[2] && state[2] === state[3]) return state[1];
    // if (state[2] === state[3] && state[3] === state[4]) return state[2];

    // if (state[5] === state[6] && state[6] === state[7]) return state[5];
    // if (state[6] === state[7] && state[7] === state[8]) return state[6];

    // if (state[9] === state[10] && state[10] === state[11]) return state[9];
    // if (state[10] === state[11] && state[11] === state[12]) return state[10];

    // if (state[13] === state[14] && state[14] === state[15]) return state[13];
    // if (state[14] === state[15] && state[15] === state[16]) return state[14];
    // //colums
    // if (state[1] === state[5] && state[5] === state[9]) return state[1];
    // if (state[5] === state[9] && state[9] === state[13]) return state[5];

    // if (state[2] === state[6] && state[6] === state[10]) return state[6];
    // if (state[6] === state[10] && state[10] === state[14]) return state[6];

    // if (state[3] === state[7] && state[7] === state[11]) return state[11];
    // if (state[7] === state[11] && state[11] === state[15]) return state[11];

    // if (state[4] === state[8] && state[8] === state[12]) return state[12];
    // if (state[8] === state[12] && state[12] === state[16]) return state[12];
    // //diagonals
    // if (state[1] === state[6] && state[6] === state[11]) return state[6];
    // if (state[3] === state[6] && state[6] === state[9]) return state[6];

    // if (state[2] === state[7] && state[7] === state[12]) return state[7];
    // if (state[4] === state[7] && state[7] === state[10]) return state[7];

    // if (state[5] === state[10] && state[10] === state[15]) return state[10];
    // if (state[7] === state[10] && state[10] === state[13]) return state[10];

    // if (state[6] === state[11] && state[11] === state[16]) return state[11];
    // if (state[8] === state[11] && state[11] === state[14]) return state[11];

    let mat = [];
    for (let i = 0; i < 4; i++) {
        mat.push([]);
        for (let j = 0; j < 4; j++) {
            mat[i].push(-1);
        }
    }
    console.log('mat init', mat);
    Object.keys(state).forEach(key => {
        --key;
        console.log(key);
        key = Number(key);
        console.log(mat[Number(Math.floor(key/4))][key%4]);
        console.log(mat[Number(Math.floor(key/4))]);
        mat[Number(Math.floor(key/4))][key%4] = state[key+1];
        console.log(mat);
    })

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (mat[i][j] === -1) continue;
            if (j !== 0 && j+1 < 4) {
                if (mat[i][j-1] === mat[i][j] && mat[i][j+1] === mat[i][j]) return mat[i][j];
            }
            if (i !== 0 && i+1 < 4) {
                if (mat[i-1][j] === mat[i][j] && mat[i+1][j] === mat[i][j]) return mat[i][j];
            }
            if (i !== 0 && i+1 < 4 && j !== 0 && j+1 < 4) {
                if (mat[i-1][j-1] === mat[i][j] && mat[i+1][j+1] === mat[i][j]) return mat[i][j];
                if (mat[i-1][j+1] === mat[i][j] && mat[i+1][j-1] === mat[i][j]) return mat[i][j];
            }
        }
    }
    return "No winner";
}