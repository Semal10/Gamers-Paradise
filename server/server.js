import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import Game from './game.js';
import { upgradeWebSocket } from './util.js';

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

global.clients = {};
global.games = {};
const onlineQueue = new Set();

wss.on('connection', (ws) => {
  upgradeWebSocket(ws);
  ws.on('close', function close() {
    onlineQueue.delete(ws.clientId);
    delete clients[ws.clientId];
  });

  ws.on('message', (message) => {
    const res = JSON.parse(message);
    console.log(res);
    switch(res.type) {
      case 'create':
        ws.game = new Game();
        ws.game.addPlayer(ws.id);
        ws.sendAction('join', { game: ws.game });
        break;
      case 'join':
        const game = games[res.gameId];
        ws.game = game;
        if (ws.game.players.length >= 3) {
          ws.sendAction('gamefull');
          break;
        }
        ws.game.addPlayer(ws.id);
        ws.game.players.forEach(player => {
          clients[player].sendAction('join', { game: ws.game });
        })
        break;
      case 'move':
        ws.game.move(res.cell, ws.id);
        break;
      case 'playOnline':
        onlineQueue.add(ws.id);
        if (onlineQueue.size >= 3) {
          var it = onlineQueue.values();
          const player1 = it.next().value;
          onlineQueue.delete(player1);
          const player2 = it.next().value;
          onlineQueue.delete(player2);
          const player3 = it.next().value;
          onlineQueue.delete(player3);

          const game = new Game();
          game.addPlayer(player1);
          game.addPlayer(player2);
          game.addPlayer(player3);
  
          game.players.forEach(player => {
            clients[player].sendAction('join', { game });
          })
        }        
        break;
    }
  });
  clients[ws.id] = ws;
  ws.sendAction('connect', { id: ws.id });
});

server.listen(process.env.PORT || 8080, () => {
  console.log("Listening on port : 8080");
});
