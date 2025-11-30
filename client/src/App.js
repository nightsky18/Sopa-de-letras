import React, { useEffect, useState } from 'react';
import Board from './components/Board';
import socket from './services/socket';

function App() {
  const [boardMatrix, setBoardMatrix] = useState([]);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Conectado al servidor');
      socket.emit('requestBoard');      // pedir tablero al conectar
    });

    socket.on('boardGenerated', (board) => {
      console.log('Tablero recibido', board);
      setBoardMatrix(board.matrix);
    });

    return () => {
      socket.off('connect');
      socket.off('boardGenerated');
    };
  }, []);

  return (
    <div>
      <h1>Tablero Sopa de Letras</h1>
      <Board matrix={boardMatrix} />
    </div>
  );
}

export default App;
