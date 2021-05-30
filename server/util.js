let count = 1000;
export const uuid = () => {
  count+=7;
  if (count == 10000) count = 1000;
  return Math.floor(Math.random()*1000) + '-' + Math.floor(Math.random()*1000) + '-' + count;
}

export const upgradeWebSocket = (ws) => {
  ws.id = uuid();
  ws.sendJSON = obj => ws.send(JSON.stringify(obj));
  ws.sendAction = (type, payload) => {
    ws.sendJSON({
      type,
      payload
    });
  }
}
