import { uuid } from './util.js';

const CREATED = 0;
const STARTED = 1;
const FINISHED = 2;

export default class Game {
  constructor() {
    this.id = uuid();
    this.players = [];
    this.playerTurn = 0;
    this.grid = [];
    this.state = CREATED;
    for (let i = 0; i < 4; i++) {
      this.grid.push([]);
      for (let j = 0; j < 4; j++) {
        this.grid[i].push(-1);
      }
    }
    games[this.id] = this;
  }

  start() {
    this.state = STARTED;
  }

  addPlayer(playerId) {
    this.players.push(playerId);
    clients[playerId].game = this;
    if (this.players.length === 3) {
      this.start();
    }
    return playerId;
  }

  move(cell, player) {
    if (this.state !== STARTED) return;
    if (player !== this.players[this.playerTurn]) return;
    const row = (cell / 4 >> 0);
    const col = (cell % 4);
    this.grid[row][col] = this.playerTurn;
    this.checkWinner();
    this.playerTurn = (this.playerTurn + 1) % 3;
    this.players
      .filter(playerId => playerId !== player)
      .forEach(playerId => clients[playerId].sendAction('move', { cell: cell }));
  }

  checkWinner() {
    const mat = this.grid;
    let winner = -1;
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (mat[i][j] === -1) continue;
        if (j !== 0 && j + 1 < 4) {
          if (mat[i][j - 1] === mat[i][j] && mat[i][j + 1] === mat[i][j])
            return this.finish(mat[i][j]);
        }
        if (i !== 0 && i + 1 < 4) {
          if (mat[i - 1][j] === mat[i][j] && mat[i + 1][j] === mat[i][j])
            return this.finish(mat[i][j]);
        }
        if (i !== 0 && i + 1 < 4 && j !== 0 && j + 1 < 4) {
          if (mat[i - 1][j - 1] === mat[i][j] && mat[i + 1][j + 1] === mat[i][j])
            return this.finish(mat[i][j]);
          if (mat[i - 1][j + 1] === mat[i][j] && mat[i + 1][j - 1] === mat[i][j])
            return this.finish(mat[i][j]);
        }
      }
    }
    // console.log(this);
  }

  finish(winner) {
    this.state = FINISHED;
    this.players.forEach(player => {
      player === this.players[winner]
        ? clients[player].sendAction('winner', {})
        : clients[player].sendAction('loser', {});
    })
    delete games[this.id];
  }
}