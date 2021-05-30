const WebSocket = require('ws');

for (let i = 0; i < 10000; i++) {
  const client = new WebSocket('ws://localhost:8080/');
}