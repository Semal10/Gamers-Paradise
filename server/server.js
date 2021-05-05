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
        if(response.type==='create'){
            const clientId = response.clientId;
            const gameId = uuid();

            games[gameId] = {
                "id": gameId, 
                "clients": []
            }

            const payLoad = {
                "type":"create",
                "game": games[gameId]
            }

            ws.send(JSON.stringify(payLoad));
        }
        if(response.type==='join'){
            const clientId = response.clientId;
            const gameId = response.gameId;
            const game = games[gameId];
            if(game.clients.length >= 3){
                console.log("Sorry! Maximum players reached!");
                return;
            }
            const shape = {"0":"cross" , "1":"circle" , "2":"triangle"}[game.clients.length];
            game.clients.push({
                "clientId": clientId,
                "shape": shape
            });
            mapShapeToClientId[shape] = clientId;

            if(game.clients.length === 3){
                updates = setInterval(updateGameState,500);
            }

            const payLoad = {
                "type": "join",
                "game": game
            }

            game.clients.forEach(c => {
                clients[c.clientId].ws.send(JSON.stringify(payLoad));
            })
        }
        if(response.type==='play'){
            const clientId = response.clientId;
            const gameId = response.gameId;
            const box = response.box;
            const game = games[gameId];
            const shape = response.shape;

            let state = game.state;
            if(!state) 
                state={};
            state[box] = shape
            game.state = state;
        }
        if(response.type==='winner'){
            clearInterval(updates);
            response.game.clients.forEach(c=>{
                if(c.clientId===mapShapeToClientId[response.winner]){
                    const payLoad = {
                        type: "winner",
                    }
                    clients[c.clientId].ws.send(JSON.stringify(payLoad));
                }
                else{
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
        "ws" : ws,
    }

    const payLoad = {
        "type" : "connect",
        "clientId" : clientId,
    }

    ws.send(JSON.stringify(payLoad));
});

server.listen(8080 , ()=>{
    console.log("Listening on port : 8080");
});

const uuid = () => {
    return Math.floor(Math.random() * 100) + "-" + Math.floor(Math.random() * 100) + "-" + Math.floor(Math.random() * 100);
}

const updateGameState = () => {
    for (const g of Object.keys(games)){
        const game = games[g];
        const payLoad = {
            "type": "update",
            "game": game,
        }
        game.clients.forEach(c => {
            clients[c.clientId].ws.send(JSON.stringify(payLoad));
        })
    }
    //setTimeout(updateGameState,500);
}