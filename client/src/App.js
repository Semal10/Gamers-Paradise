import React , {useState , useEffect} from 'react';
import cross from './img/cross.png';
import circle from './img/circle.png'
import triangle from './img/triangle.png'
import './App.css';

function App() {
  
  const [clientId , setClientId] = useState(null);
  const [currentGame , setCurrentGame] = useState(null);
  const [socket , setSocket] = useState(null);
  const [inputText , setInputText] = useState('');
  const [winner , setWinner] = useState(false);
  let boxes = [];
  let playerShape = null;

  (currentGame) ? currentGame.clients.forEach(c => {
    if(c.clientId === clientId){
      playerShape = c.shape;
    }
  }) : <></>

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');
    setSocket(socket);
    socket.onmessage = (message) => {
      console.log('Received from server : ',message.data);
      const response = JSON.parse(message.data);
      if(response.type==='connect'){
        setClientId(response.clientId);
      }
      if(response.type==='create'){
        console.log('Game created successfully : ',response.game.id);
        setCurrentGame(response.game);
      }
      if(response.type==='join'){
        console.log('Game Joined successfully : ',response.game.id);
        setCurrentGame(response.game);
      }
      if(response.type==='update'){
        if(!response.game.state) return;
        for(const b of Object.keys(response.game.state)){
          const shape = response.game.state[b];
          const boxObject = document.getElementById(b);
          if(shape==='cross'){
            boxObject.innerHTML = "<img src="+cross+" height='70%' width='70%'/>";
          }
          if(shape==='circle'){
            boxObject.innerHTML = "<img src="+circle+" height='70%' width='70%'/>";
          }
          if(shape==='triangle'){
            boxObject.innerHTML = "<img src="+triangle+" height='70%' width='70%'/>";
          }
        }
        const state = response.game.state;
        const winner = calculateWinner(state);
        socket.send(JSON.stringify("Winner : "+winner));
        if(winner){
          const payLoad = {
            "type": "winner",
            "winner": winner,
            "game": response.game  
          }
          socket.send(JSON.stringify(payLoad));
        }
      }
      if(response.type==='winner'){
        setWinner(true);
        setCurrentGame(null);
        setInputText('');
      }
      if(response.type==='loser'){
        setCurrentGame(null);
        setInputText('');
      }
    }
  },[])

  const handleCreate = () => {
    const payLoad = {
      "type" : "create",
      "clientId" : clientId,
    }
    socket.send(JSON.stringify(payLoad));
  }

  const handleJoin = () => {
    let gameId = null;
    if(!currentGame) gameId = inputText;
    else gameId = currentGame.id;
    const payLoad = {
      "type" : "join",
      "clientId" : clientId,
      "gameId" : gameId
    }
    socket.send(JSON.stringify(payLoad));
  }

  const handleBox = (e) => {
    //console.log(e.target.id);
    if(playerShape==='cross'){
      e.target.innerHTML = "<img src="+cross+" height='70%' width='70%'/>";
    }
    if(playerShape==='circle'){
      e.target.innerHTML = "<img src="+circle+" height='70%' width='70%'/>";
    }
    if(playerShape==='triangle'){
      e.target.innerHTML = "<img src="+triangle+" height='70%' width='70%'/>";
    }
    const payLoad = {
      "type" : "play",
      "clientId" : clientId,
      "gameId" : currentGame.id,
      "box": e.target.id,
      "shape": playerShape 
    }
    socket.send(JSON.stringify(payLoad));
  }

  for(let i=0;i<16;i++){
    boxes.push(i+1);
  };

  return (
    <div className="App">
      <h1>Tic Tac Toe Game!</h1>
      <button onClick={handleCreate}>Create Game</button>
      <button onClick={handleJoin}>Join Game</button>
      <input type="text" value={inputText} onChange={(e)=>setInputText(e.target.value)}/>
      {winner ? <h1>Congrats! You are the Winner!</h1> : <></>}
      {currentGame ? <h2>Players </h2> : <></>}
      <div className='players'>
        {
          (currentGame) ?
          (currentGame.clients.map(c => {
            return <div className='player' key={c.clientId} style={{background: c.color}}>{c.clientId}</div>
          })) : <></>
        }
      </div>
      {currentGame ? <h2>Board </h2> : <></>}
      <div className="boxes">{
        (currentGame)?
        boxes.map(box => {
          return <div className="box" key={box} id={box} onClick={(e)=>handleBox(e)}>{box}</div>
        }):<></>
      }
      </div>
      {(currentGame) ? <h2 className="game-id">Game ID : {currentGame.id}</h2> : <></>}
    </div>
  );
}

const calculateWinner = (state) => {
  //rows
  if(state[1]===state[2] && state[2]===state[3]) return state[1];
  if(state[2]===state[3] && state[3]===state[4]) return state[2];

  if(state[5]===state[6] && state[6]===state[7]) return state[5];
  if(state[6]===state[7] && state[7]===state[8]) return state[6];

  if(state[9]===state[10] && state[10]===state[11]) return state[9];
  if(state[10]===state[11] && state[11]===state[12]) return state[10];

  if(state[13]===state[14] && state[14]===state[15]) return state[13];
  if(state[14]===state[15] && state[15]===state[16]) return state[14];
  //colums
  if(state[1]===state[5] && state[5]===state[9]) return state[1];
  if(state[5]===state[9] && state[9]===state[13]) return state[5];

  if(state[2]===state[6] && state[6]===state[10]) return state[6];
  if(state[6]===state[10] && state[10]===state[14]) return state[6];

  if(state[3]===state[7] && state[7]===state[11]) return state[11];
  if(state[7]===state[11] && state[11]===state[15]) return state[11];

  if(state[4]===state[8] && state[8]===state[12]) return state[12];
  if(state[8]===state[12] && state[12]===state[16]) return state[12];
  //diagonals
  if(state[1]===state[6] && state[6]===state[11]) return state[6];
  if(state[3]===state[6] && state[6]===state[9]) return state[6];

  if(state[2]===state[7] && state[7]===state[12]) return state[7];
  if(state[4]===state[7] && state[7]===state[10]) return state[7];

  if(state[5]===state[10] && state[10]===state[15]) return state[10];
  if(state[7]===state[10] && state[10]===state[13]) return state[10];

  if(state[6]===state[11] && state[11]===state[16]) return state[11];
  if(state[8]===state[11] && state[11]===state[14]) return state[11];

  return null;

}

export default App;
