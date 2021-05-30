const WebSocket = require('ws');

let connectionCount = 1;
let msgCnt = 1;

for (let j = 0; j < 100; j++) {
  for (let i = 0; i < 3; i++) {
    const client = new WebSocket('ws://localhost:8080/');
    client.sendJSON = data => client.send(JSON.stringify(data));
    client.on('open', () => {
      // console.log('connected', connectionCount++)
      client.sendJSON({ type: 'playOnline' });
    });
    // client.on('close', () => console.log('disconnected'))
    client.on('error', console.log);
    client.on('message', (msg) => {
      // console.log('msg', msgCnt++);
      const res = JSON.parse(msg);
      // console.log(client.clientId, res);
      switch (res.type) {
        case 'connect':
          client.clientId = res.payload.id;
          break;
        case 'join':
          client.game = res.payload.game;
          if (client.game.players[client.game.playerTurn] === client.clientId) {
            const payLoad = {
              type: "move",
              cell: i + 1,
            }
            client.move = i + 1;
            client.game.playerTurn++;
            client.sendJSON(payLoad);
          }
          break;
        case 'move':
          client.game.playerTurn = (client.game.playerTurn + 1) % 3;
          // console.log(client.game.players[client.game.playerTurn], client.clientId)
          if (client.game.players[client.game.playerTurn] === client.clientId) {
            const payLoad = {
              type: 'move',
              cell: client.move ? client.move + 4 : i + 1,
            }
            if (client.move === undefined) {
              client.move = i + 1;
            } else {
              client.move = client.move + 4;
            }
            client.game.playerTurn++;
            client.sendJSON(payLoad);
          }
          break;
        case 'winner':
          client.close();
          break;
        case 'loser':
          client.close();
          break;
        default:
          console.log('Unknown type.')
      }
    })
  }
}
