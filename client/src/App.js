import React, { useState, useEffect } from 'react';
import cross from './img/cross.png';
import circle from './img/circle.png'
import triangle from './img/triangle.png'
import './App.css';

//  const socket = new WebSocket('wss://murmuring-island-83018.herokuapp.com');
const socket = new WebSocket('ws://localhost:8080');
const images = [cross, circle, triangle];

const gameReducer = (state, action) => {
  console.log(state, action);
  switch (action.type) {
    case 'connect':
      return {
        ...state,
        clientId: action.payload.id
      };
    case 'create':
      socket.send(JSON.stringify({ type: 'create' }))
      return {
        ...state
      };
    case 'playOnline':
      socket.send(JSON.stringify({ type: 'playOnline' }))
      return {
        ...state,
        isLoading: true
      };
    case 'join':
      if (action.payload.self === true) {
        socket.send(JSON.stringify({ type: 'join', gameId: action.payload.id }));
        return {
          ...state
        }
      }
      return {
        ...state,
        game: action.payload.game,
        isLoading: false
      };
    case 'move':
      const cell = action.payload.cell;
      if (state.game === null) {
        return { ...state };
      }
      const updatedGame = state.game;
      updatedGame.grid[(cell / 4 >> 0)][cell % 4] = updatedGame.playerTurn;

      if (updatedGame.players[updatedGame.playerTurn] === state.clientId) {
        socket.send(JSON.stringify({ type: 'move', cell }));
      }

      updatedGame.playerTurn = ((updatedGame.playerTurn + 1) % 3);
      return {
        ...state,
        game: updatedGame,
      }
    case 'winner':
      return {
        ...state,
        game: null,
        winner: true,
      }
    case 'loser':
      return {
        ...state,
        game: null
      }
    default:
      console.log('Unknown type.')
      return {
        ...state
      }
  }
}

function useGameReducer(reducer, initialState) {
  const [state, setState] = useState(initialState);

  function dispatch(action) {
    const nextState = reducer(state, action);
    setState(nextState);
  }

  useEffect(() => {
    socket.onmessage = (message) => {
      const {type, payload} = JSON.parse(message.data);
      console.log(type, payload);
      switch (type) {
        case 'connect':
          dispatch({ type: 'connect', payload });
          break;
        case 'join':
          dispatch({ type: 'join', payload });
          break;
        case 'move':
          dispatch({ type: 'move', payload });
          break;
        case 'winner':
          dispatch({ type: 'winner' });
          break;
        case 'loser':
          dispatch({ type: 'loser' });
          break;
        default:
          console.log('Unknown type.')
      }
    }
  })

  return [state, dispatch];
}

function App() {
  const [gameState, dispatch] = useGameReducer(gameReducer, {
    clientId: null,
    game: null,
    winner: false,
    loser: false,
    isLoading: false
  });

  const [inputText, setInputText] = useState('');

  const handleBox = (cell) => {
    const { playerTurn, players } = gameState.game;
    if (players[playerTurn] === gameState.clientId) {
      dispatch({ type: 'move', payload: { cell } })
    } else {
      console.log('Not your turn');
    }
  }

  return (
    <div className="App">
      <h1>Tic Tac Toe Game!</h1>
      {
        gameState.isLoading === false
          ? (
            <>
              <button
                onClick={() => dispatch({ type: 'playOnline' })}
              >
                Play Online
              </button>
              <button
                onClick={() => dispatch({ type: 'create' })}
              >
                Create Game
              </button>
              <button
                onClick={() => dispatch({
                  type: 'join',
                  payload: {
                    self: true,
                    id: inputText
                  }
                })}
              >
                Join Game
              </button>
              <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} />
            </>
          ) : <h2>Waiting for players to join...</h2>
      }
      <br></br>

      {gameState.winner && <h1>Congrats! You are the Winner!</h1>}
      {gameState.game && <h2>Players </h2>}
      <div className='players'>
        {
          (gameState.game) ?
            (gameState.game.players.map(player => {
              const { players, playerTurn } = gameState.game;
              return (
                <div
                  className='player'
                  key={player}
                  style={{
                    background: players[playerTurn] === player ? "red" : "white"
                  }}
                >
                  {player}
                </div>
              )
            })) : <></>
        }
      </div>
      {
        gameState.game && <h2>Board </h2>
      }
      <div className="boxes">
        {
          gameState.game
            &&
              [].concat(...gameState.game.grid).map((val, idx) => {
                return (
                  <div
                    className="box"
                    key={idx}
                    id={idx}
                    onClick={(e) => handleBox(e.target.id)}
                  >
                    {
                      val === -1 ? idx : <img src={images[val]} height='70%' width='70%' alt=""></img>
                    }
                  </div>
                )
              })
        }
      </div>
      {
        gameState.game
        && <h2 className="game-id">Game ID : {gameState.game.id}</h2>
      }
    </div>
  );
}

export default App;
