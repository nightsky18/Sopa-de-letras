import React, { useEffect, useState } from 'react';
import Board from './components/Board';
import ControlPanel from './components/ControlPanel';
import Timer from './components/Timer';
import socket from './services/socket';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import StatsPanel from './components/StatsPanel';
import { predictDifficulty } from './services/aiModel';
import './App.css';

// Función auxiliar fuera del componente para obtener/generar user ID persistente
const getPersistentUserId = () => {
  let id = localStorage.getItem('sopa_user_id');
  if (!id) {
    id = 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    localStorage.setItem('sopa_user_id', id);
  }
  return id;
};

function App() {
  const [boardMatrix, setBoardMatrix] = useState([]);
  const [wordsToFind, setWordsToFind] = useState([]); // Lista total de palabras
  const [foundWords, setFoundWords] = useState([]);   // Lista de palabras ya encontradas (strings)
  const [foundCells, setFoundCells] = useState(new Set()); // Coordenadas encontradas (para el Board)
  const [sessionId, setSessionId] = useState(null); // ID de la sesión de juego
  const [isGameActive, setIsGameActive] = useState(false); 
  const [gameMessage, setGameMessage] = useState(''); 
  const [timerStart, setTimerStart] = useState(0); // Estado para pasar tiempo 
  const [topScores, setTopScores] = useState([]); 
  const [recentGames, setRecentGames] = useState([]); 
  const MySwal = withReactContent(Swal);
  
  useEffect(() => {

    const userId = getPersistentUserId(); // OBTENER USER ID SIEMPRE

    // Función para refrescar stats
    const refreshStats = () => {
      socket.emit('requestUserStats', { userId });
    };

    // 1. Conexión inicial
    socket.on('connect', () => {
      console.log('Conectado al servidor');

      // --- LÓGICA DE RECONEXIÓN ---
      const savedSessionId = localStorage.getItem('sopa_game_id');

      if (savedSessionId) {
        // En reanudación también enviamos user por seguridad/validación futura
        console.log('Intentando reanudar partida guardada...');
        socket.emit('resumeGame', { gameSessionId: savedSessionId, userId});
      } else {
        console.log('Iniciando nueva partida...');
        socket.emit('requestBoard', { userId });
      }
      refreshStats(); // <--- Pedir al conectar
    });

    // Si el servidor dice que NO se puede reanudar (ej: ya acabó), pedimos nueva
    socket.on('errorResuming', () => {
      console.warn('No se pudo reanudar. Creando nueva...');
      localStorage.removeItem('sopa_game_id'); // Limpiar ID inválido
      socket.emit('requestBoard');
    });

    // Respuesta de reanudación exitosa
    socket.on('gameResumed', (data) => {
      setBoardMatrix(data.matrix);
      setWordsToFind(data.wordsPlaced);
      setSessionId(data.gameSessionId);
      setFoundWords(data.foundWords); // Restaurar estado de palabras encontradas

      // --- HIDRATACIÓN VISUAL ---
      const recoveredSet = new Set();
      if (data.foundCells && Array.isArray(data.foundCells)) {
        data.foundCells.forEach(cell => {
           recoveredSet.add(`${cell.row}-${cell.col}`);
        });
      }
      setFoundCells(recoveredSet);

      // CALCULAR TIEMPO TRANSCURRIDO
      if (data.startTime) {
        const start = new Date(data.startTime).getTime();
        const now = new Date().getTime();
        const elapsedSeconds = Math.floor((now - start) / 1000);
        setTimerStart(elapsedSeconds); // Enviamos esto al Timer
      } else {
        setTimerStart(0);
      }
      
      setIsGameActive(true);
      setGameMessage('');
    });

    // Recibir datos
    socket.on('userStats', (data) => {
      setTopScores(data.topScores);
      setRecentGames(data.recentGames);
    });

    // Recibir tablero y lista de palabras
    socket.on('boardGenerated', (data) => {
      setBoardMatrix(data.matrix);
      setWordsToFind(data.wordsPlaced); // Guardamos la lista para el panel
      setSessionId(data.gameSessionId); // Guardamos el ID de la sesión
      setFoundWords([]); // Reiniciar
      setFoundCells(new Set());
      setTimerStart(0); // Nueva partida = 0 segundos
      setIsGameActive(true); //Iniciar reloj
      setGameMessage('');
      localStorage.setItem('sopa_game_id', data.gameSessionId);
    });

    // Escuchar fin de juego
    socket.on('gameFinished', (data) => {
      setIsGameActive(false); // <--- Parar reloj
      // Formatear segundos a MM:SS para el mensaje
      const m = Math.floor(data.duration / 60);
      const s = data.duration % 60;
      const timeStr = `${m}:${s.toString().padStart(2, '0')}`;
      localStorage.removeItem('sopa_game_id');
      
      setGameMessage(`¡Felicidades! Completado en ${timeStr}`);
      refreshStats(); // <--- Pedir actualización de estadísticas
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
      localStorage.removeItem('sopa_game_id');
      refreshStats(); // <--- Pedir actualización de estadísticas
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

  const handleNewGame = () => {
    Swal.fire({
      title: '¿Nueva Partida?',
      text: isGameActive 
        ? "La partida actual se marcará como abandonada." 
        : "Se generará un nuevo tablero.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, nueva partida',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        // 1. Si estaba jugando, avisar al server para que abandone la anterior
        if (sessionId && isGameActive) {
           socket.emit('abandonGame', { gameSessionId: sessionId });
        }
        
        // 2. Limpiar SOLO game_id
        localStorage.removeItem('sopa_game_id');
        
        // 3. Limpiar estados visuales
        setFoundWords([]);
        setFoundCells(new Set());
        setGameMessage('');
        setSessionId(null);

        // 4. Obtener User ID (SIN BORRARLO)
        const currentUserId = getPersistentUserId();
        
        // 5. Pedir nueva
        socket.emit('requestBoard', { userId: currentUserId });
        
        // 6. Pedir stats nuevos tras abandonar la anterior
        const userId = getPersistentUserId();
        refreshStats(); // <--- Pedir actualización de estadísticas

        // --- IA DECISION ---
        // Usamos el estado 'recentGames' que ya tenemos en memoria gracias al StatsPanel
        // (Asegúrate de que recentGames esté actualizado, si no, podríamos pedirlo de nuevo, 
        // pero usualmente el estado de React ya lo tiene).
        
        let difficulty = 2; // Default
        try {
            difficulty = await predictDifficulty(recentGames);
            console.log(`IA sugiere nivel: ${difficulty}`);
            
            // Feedback visual sutil
            const nivelTexto = difficulty === 1 ? 'Fácil' : (difficulty === 3 ? 'Difícil' : 'Medio');
            Swal.fire({
                title: `Nivel Ajustado: ${nivelTexto}`,
                text: 'La IA ha calibrado tu dificultad.',
                timer: 1500,
                showConfirmButton: false,
                icon: 'info'
            });
            
        } catch (e) {
            console.error('Error IA:', e);
        }

        // Enviar petición con dificultad
        socket.emit('requestBoard', { userId, difficulty });
      }
    });
  };

  return (
    <div className="App">
      <h1>Sopa de Letras</h1>
      
      <div className="header-controls">
        <Timer 
            key={sessionId || 'init'} 
            isActive={isGameActive} 
            initialSeconds={timerStart} 
        />
        
        <div className="button-group">
            <button className="new-game-btn" onClick={handleNewGame}>
                Nueva Partida
            </button>

            {isGameActive && (
            <button className="resolve-btn" onClick={handleResolve}>
                Rendirse
            </button>
            )}
        </div>
        
        {gameMessage && <div className="victory-message">{gameMessage}</div>}
      </div>

      <div className="game-container">
        
        {/* IZQUIERDA: Stats */}
        <StatsPanel topScores={topScores} recentGames={recentGames} />

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