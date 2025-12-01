import React, { useEffect, useState } from 'react';
import Board from './components/Board';
import ControlPanel from './components/ControlPanel';
import Timer from './components/Timer';
import socket from './services/socket';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './App.css';

function App() {
  const [boardMatrix, setBoardMatrix] = useState([]);
  const [wordsToFind, setWordsToFind] = useState([]); // Lista total de palabras
  const [foundWords, setFoundWords] = useState([]);   // Lista de palabras ya encontradas (strings)
  const [foundCells, setFoundCells] = useState(new Set()); // Coordenadas encontradas (para el Board)
  const [sessionId, setSessionId] = useState(null); // ID de la sesión de juego
  const [isGameActive, setIsGameActive] = useState(false); 
  const [gameMessage, setGameMessage] = useState(''); 
  const MySwal = withReactContent(Swal);

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
      setFoundWords([]); // Reiniciar
      setFoundCells(new Set());
      setIsGameActive(true); //Iniciar reloj
      setGameMessage('');
    });

    // 3. Escuchar fin de juego
    socket.on('gameFinished', (data) => {
      setIsGameActive(false); // <--- Parar reloj
      // Formatear segundos a MM:SS para el mensaje
      const m = Math.floor(data.duration / 60);
      const s = data.duration % 60;
      const timeStr = `${m}:${s.toString().padStart(2, '0')}`;
      
      setGameMessage(`¡Felicidades! Completado en ${timeStr}`);
    });

    // 4. Escuchar resolución de juego (mostrar solución)
    socket.on('resolveResult', (data) => {
      setIsGameActive(false); // Detener reloj e interacciones
      
      // Marcar TODAS las celdas recibidas
      const newFoundCells = new Set(foundCells); // Mantener las que ya tenía
      
      data.solutions.forEach(sol => {
        sol.cells.forEach(cell => {
          newFoundCells.add(`${cell.row}-${cell.col}`);
        });
      });
      
      setFoundCells(newFoundCells);
      setGameMessage('Partida finalizada (Solución revelada)');
    });

    // 5. Escuchar validaciones exitosas (Centralizado aquí)
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
      socket.off('gameFinished');
      socket.off('resolveResult');
    };
  }, [foundCells]); // Añadimos dependencia foundCells para no perder las previas

  const handleResolve = () => {
    MySwal.fire({
      title: '¿Te rindes?',
      text: "Se mostrarán todas las soluciones y la partida terminará.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c', // Rojo para acción destructiva
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, resolver',
      cancelButtonText: 'Seguir jugando',
      background: '#f9f9f9',
      customClass: {
        popup: 'my-swal-popup' // Opcional por si quieres más CSS
      }
    }).then((result) => {
      if (result.isConfirmed) {
        socket.emit('requestResolve', { gameSessionId: sessionId });
        
        // Opcional: Feedback inmediato
        MySwal.fire(
          '¡Resuelto!',
          'Aquí tienes la solución.',
          'info'
        );
      }
    });
  };

  return (
    <div className="App">
      <h1>Sopa de Letras</h1>
      
      <div className="header-controls">
        <Timer isActive={isGameActive} />
        {/* Botón Resolver (solo visible si está jugando) */}
        {isGameActive && (
          <button className="resolve-btn" onClick={handleResolve}>
            Resolver / Rendirse
          </button>
        )}
        {gameMessage && <div className="victory-message">{gameMessage}</div>}
      </div>

      <div className="game-container">
        {/* Pasamos matrix, foundCells y sessionid al Board */}
        <Board 
          matrix={boardMatrix} 
          foundCells={foundCells} 
          sessionId={sessionId}
          isActive={isGameActive} // bloquear tablero
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