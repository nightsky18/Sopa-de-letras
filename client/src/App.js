import React, { useEffect, useState } from 'react';
import Board from './components/Board';
import ControlPanel from './components/ControlPanel';
import socket from './services/socket';
import './App.css';

function App() {
  const [boardMatrix, setBoardMatrix] = useState([]);
  const [wordsToFind, setWordsToFind] = useState([]); // Lista total de palabras
  const [foundWords, setFoundWords] = useState([]);   // Lista de palabras ya encontradas (strings)
  const [foundCells, setFoundCells] = useState(new Set()); // Coordenadas encontradas (para el Board)
   const [sessionId, setSessionId] = useState(null); // ID de la sesión de juego

  useEffect(() => {
    // 1. Conexión inicial
    socket.on('connect', () => {
      console.log('Conectado al servidor');
      socket.emit('requestBoard');
    });

    // 2. Recibir tablero y lista de palabras
    socket.on('boardGenerated', (data) => {
      setBoardMatrix(data.matrix);
      setWordsToFind(data.wordsPlaced); // Guardamos la lista para el panel
      setSessionId(data.gameSessionId); // Guardamos el ID de la sesión
      console.log('Palabras a buscar:', data.wordsPlaced);
    });

    // 3. Escuchar validaciones exitosas (Centralizado aquí)
    socket.on('validationResult', (result) => {
      if (result.isValid) {
        // Actualizar lista de palabras encontradas
        setFoundWords(prev => {
          if (!prev.includes(result.word)) {
            return [...prev, result.word];
          }
          return prev;
        });

        // Actualizar celdas visuales (para el Board)
        setFoundCells(prev => {
          const newSet = new Set(prev);
          result.cells.forEach(cell => newSet.add(`${cell.row}-${cell.col}`));
          return newSet;
        });
      }
    });

    return () => {
      socket.off('connect');
      socket.off('boardGenerated');
      socket.off('validationResult');
    };
  }, []);

  return (
    <div className="App">
      <h1>Sopa de Letras</h1>
      
      <div className="game-container">
        {/* Pasamos matrix, foundCells y sessionid al Board */}
        <Board 
          matrix={boardMatrix} 
          foundCells={foundCells} 
          sessionId={sessionId}
        />

        {/* Pasamos listas al Panel */}
        <ControlPanel 
          wordsToFind={wordsToFind} 
          foundWords={foundWords} 
        />
      </div>
    </div>
  );
}

export default App;