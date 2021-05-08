import React, { useState, useEffect } from 'react';
import cross from './img/cross.png';
import circle from './img/circle.png'
import triangle from './img/triangle.png'
import './App.css';

function App() {
  const [clientId, setClientId] = useState(null);
  const [currentGame, setCurrentGame] = useState(null);
  const [socket, setSocket] = useState(null);
  const [inputText, setInputText] = useState('');
  const [winner, setWinner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  let boxes = [];
  let playerShape = null;

  (currentGame) ? currentGame.clients.forEach(c => {
    if (c.clientId === clientId) {
      playerShape = c.shape;
    }
  }) : <></>

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');
    setSocket(socket);
    socket.onmessage = (message) => {
      console.log('Received from server : ', message.data);
      const response = JSON.parse(message.data);
      if (response.type === 'connect') {
        setClientId(response.clientId);
      }
      if (response.type === 'create') {
        console.log('Game created successfully : ', response.game.id);
        setCurrentGame(response.game);
      }
      if (response.type === 'join') {
        console.log('Game Joined successfully : ', response.game.id);
        setCurrentGame(response.game);
        setIsLoading(false);
      }
      if (response.type === 'update') {
        console.log('server update', response.game.playerTurn);
        if (!response.game.state) return;
        for (const b of Object.keys(response.game.state)) {
          const shape = response.game.state[b];
          const boxObject = document.getElementById(b);
          if (shape === 'cross') {
            boxObject.innerHTML = "<img src=" + cross + " height='70%' width='70%'/>";
          }
          if (shape === 'circle') {
            boxObject.innerHTML = "<img src=" + circle + " height='70%' width='70%'/>";
          }
          if (shape === 'triangle') {
            boxObject.innerHTML = "<img src=" + triangle + " height='70%' width='70%'/>";
          }
        }
        const state = response.game.state;
        // const winner = calculateWinner(state);
        // socket.send(JSON.stringify("Winner : "+winner));
        // if(winner){
        //   const payLoad = {
        //     "type": "winner",
        //     "winner": winner,
        //     "game": response.game  
        //   }
        //   socket.send(JSON.stringify(payLoad));
        // }
        setCurrentGame(response.game);
      }
      if (response.type === 'winner') {
        setWinner(true);
        setCurrentGame(null);
        setInputText('');
      }
      if (response.type === 'loser') {
        setCurrentGame(null);
        setInputText('');
      }
    }
  }, [])

  const handleCreate = () => {
    const payLoad = {
      "type": "create",
      "clientId": clientId,
    }
    socket.send(JSON.stringify(payLoad));
  }

  const handleJoin = () => {
    let gameId = null;
    if (!currentGame) gameId = inputText;
    else gameId = currentGame.id;
    const payLoad = {
      "type": "join",
      "clientId": clientId,
      "gameId": gameId
    }
    socket.send(JSON.stringify(payLoad));
  }

  const handleBox = (e) => {
    console.log('PT client', currentGame.playerTurn);
    if (currentGame.playerTurn === clientId) {
      if (playerShape === 'cross') {
        e.target.innerHTML = "<img src=" + cross + " height='70%' width='70%'/>";
      }
      if (playerShape === 'circle') {
        e.target.innerHTML = "<img src=" + circle + " height='70%' width='70%'/>";
      }
      if (playerShape === 'triangle') {
        e.target.innerHTML = "<img src=" + triangle + " height='70%' width='70%'/>";
      }

      const payLoad = {
        "type": "play",
        "clientId": clientId,
        "gameId": currentGame.id,
        "box": e.target.id,
        "shape": playerShape
      }
      socket.send(JSON.stringify(payLoad));
    } else {
      console.log('Not your turn');
    }
  }

  const requestPlayOnline = (e) => {
    const playload = {
      "type": "playOnline",
      "clientId": clientId,
    }
    socket.send(JSON.stringify(playload));
    setIsLoading(true);
  }

  for (let i = 0; i < 16; i++) {
    boxes.push(i + 1);
  };

  return (
    <div className="App">
      <h1>Tic Tac Toe Game!</h1>
      {
        isLoading === false
          ? (
            <>
              <button onClick={requestPlayOnline}>Play Online</button>
              <button onClick={handleCreate}>Create Game</button>
              <button onClick={handleJoin}>Join Game</button>
              <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} />
            </>
          )
          : <h2>Waiting for players to join...</h2>
      }
      <br></br>

      {winner ? <h1>Congrats! You are the Winner!</h1> : <></>}
      {currentGame ? <h2>Players </h2> : <></>}
      <div className='players'>
        {
          (currentGame) ?
            (currentGame.clients.map(c => {
              return (
                <div
                  className='player'
                  key={c.clientId}
                  style={{
                    background: currentGame.playerTurn === c.clientId ? "red" : c.color
                  }}
                >
                  {c.clientId}
                </div>
              )
            })) : <></>
        }
      </div>
      {currentGame ? <h2>Board </h2> : <></>}
      <div className="boxes">{
        (currentGame) ?
          boxes.map(box => {
            return <div className="box" key={box} id={box} onClick={(e) => handleBox(e)}>{box}</div>
          }) : <></>
      }
      </div>
      {(currentGame) ? <h2 className="game-id">Game ID : {currentGame.id}</h2> : <></>}
    </div>
  );
}

export default App;
