const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const redis = require('redis');

const client = redis.createClient("redis://redis:6379");

client.on('connect', function () {
  console.log('connected to redis');
});

const app = express();

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

const clients = {};
const games = {};
const mapShapeToClientId = {};
const onlineQueue = new Set();
let updates = null;

wss.on('connection', (ws) => {
  ws.on('close', function close() {
    onlineQueue.delete(ws.clientId);
    console.log('on close', ws.clientId);
  });
  ws.on('message', (message) => {
    const response = JSON.parse(message);
    if (response.type === 'create') {
      const clientId = response.clientId;
      const gameId = uuid();
      const gameData = {
        "id": gameId,
        "clients": [{ clientId, shape: "cross" }],
        "playerTurn": clientId
      };
      client.set(gameId, JSON.stringify(gameData), (err, reply) => {
        const payLoad = {
          "type": "create",
          "game": gameData
        }
        ws.send(JSON.stringify(payLoad));  
      });
    }
    if (response.type === 'join') {
      const clientId = response.clientId;
      const gameId = response.gameId;
      client.get(gameId, (err, reply) => {
        console.log(reply)
        const game = JSON.parse(reply);
        if (game.clients.length >= 3) {
          return;
        }
        const shape = { "0": "cross", "1": "circle", "2": "triangle" }[game.clients.length];
        game.clients.push({
          "clientId": clientId,
          "shape": shape
        });
        client.set(gameId, JSON.stringify(game), (err, reply) => {
          mapShapeToClientId[shape] = clientId;
          const payLoad = {
            "type": "join",
            "game": game
          }
          game.clients.forEach(c => {
            clients[c.clientId].ws.send(JSON.stringify(payLoad));
          })    
        });
      });
    }

    if (response.type === 'play') {
      const clientId = response.clientId;
      const gameId = response.gameId;
      const box = response.box;
      client.get(gameId, (err, reply) => {
        const game = JSON.parse(reply);
        const shape = response.shape;

        let turnIndex = 0;
        game.clients.forEach((c, idx) => {
          if (c.clientId === game.playerTurn) turnIndex = idx;
        });

        game.playerTurn = game.clients[(turnIndex + 1) % 3].clientId;
        let state = game.state;
        if (!state)
          state = {};
        state[box] = shape
        game.state = state;

        const winner = calculateWinner(game.state);

        client.set(gameId, JSON.stringify(game), (err, reply) => {
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
            console.log(gameId);
            client.del(gameId, redis.print);
          }  
        });
      })
    }
    if (response.type === 'playOnline') {
      onlineQueue.add(response.clientId);
      if (onlineQueue.size >= 3) {
        var it = onlineQueue.values();
        const user1 = it.next().value;
        onlineQueue.delete(user1);
        const user2 = it.next().value;
        onlineQueue.delete(user2);
        const user3 = it.next().value;
        onlineQueue.delete(user3);

        const gameId = uuid();

        const gameData = {
          "id": gameId,
          "clients": [
            { clientId: user1, shape: "cross" },
            { clientId: user2, shape: "circle" },
            { clientId: user3, shape: "triangle" },
          ],
          "playerTurn": user1
        };

        client.set(gameId, JSON.stringify(gameData), (err, reply) => {
          const payLoad = {
            "type": "join",
            "game": gameData
          }
  
          gameData.clients.forEach(c => {
            clients[c.clientId].ws.send(JSON.stringify(payLoad));
          })  
        });
      }
    }
  });
  const clientId = uuid();
  clients[clientId] = {
    "ws": ws,
  }
  ws.clientId = clientId;
  console.log('on connection', ws.clientId);
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

const sendUpdateToPlayers = (game) => {
  const payLoad = {
    "type": "update",
    "game": game,
  }

  game.clients.forEach(c => {
    clients[c.clientId].ws.send(JSON.stringify(payLoad));
  })
}

const calculateWinner = (state) => {
  let mat = [];
  for (let i = 0; i < 4; i++) {
    mat.push([]);
    for (let j = 0; j < 4; j++) {
      mat[i].push(-1);
    }
  }
  Object.keys(state).forEach(key => {
    --key;
    key = Number(key);
    mat[Number(Math.floor(key / 4))][key % 4] = state[key + 1];
  })

  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (mat[i][j] === -1) continue;
      if (j !== 0 && j + 1 < 4) {
        if (mat[i][j - 1] === mat[i][j] && mat[i][j + 1] === mat[i][j]) return mat[i][j];
      }
      if (i !== 0 && i + 1 < 4) {
        if (mat[i - 1][j] === mat[i][j] && mat[i + 1][j] === mat[i][j]) return mat[i][j];
      }
      if (i !== 0 && i + 1 < 4 && j !== 0 && j + 1 < 4) {
        if (mat[i - 1][j - 1] === mat[i][j] && mat[i + 1][j + 1] === mat[i][j]) return mat[i][j];
        if (mat[i - 1][j + 1] === mat[i][j] && mat[i + 1][j - 1] === mat[i][j]) return mat[i][j];
      }
    }
  }
  return "No winner";
}


var exports = module.exports;