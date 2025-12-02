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

const hasChosenInitialDifficulty = () => {
  return localStorage.getItem('sopa_initial_difficulty_chosen') === 'true';
};

const markInitialDifficultyChosen = () => {
  localStorage.setItem('sopa_initial_difficulty_chosen', 'true');
};

// Generar userId solo cuando se llame explícitamente
const getPersistentUserId = () => {
  let id = localStorage.getItem('sopa_user_id');
  if (!id) {
    id =
      'user_' +
      Math.random().toString(36).substr(2, 9) +
      Date.now().toString(36);
    localStorage.setItem('sopa_user_id', id);
  }
  return id;
};

function App() {
  const [boardMatrix, setBoardMatrix] = useState([]);
  const [wordsToFind, setWordsToFind] = useState([]);
  const [foundWords, setFoundWords] = useState([]);
  const [foundCells, setFoundCells] = useState(new Set());
  const [sessionId, setSessionId] = useState(null);
  const [isGameActive, setIsGameActive] = useState(false);
  const [gameMessage, setGameMessage] = useState('');
  const [timerStart, setTimerStart] = useState(0);
  const [topScores, setTopScores] = useState([]);
  const [recentGames, setRecentGames] = useState([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState(2);
  const [hasSession, setHasSession] = useState(
    !!localStorage.getItem('sopa_user_id')
  );
  const MySwal = withReactContent(Swal);

  useEffect(() => {
    // Leer userId solo si existe
    let userId = localStorage.getItem('sopa_user_id');

    const refreshStats = () => {
      if (userId) {
        socket.emit('requestUserStats', { userId });
      }
    };

    socket.on('connect', () => {
      console.log('Conectado al servidor');
      const savedSessionId = localStorage.getItem('sopa_game_id');

      if (userId && savedSessionId) {
        console.log('Intentando reanudar partida guardada...');
        socket.emit('resumeGame', { gameSessionId: savedSessionId, userId });
      } else if (userId && !savedSessionId) {
        console.log('Usuario existente sin partida activa, esperando Nueva Partida');
      } else {
        console.log('Sin usuario activo, esperando Nueva Partida');
      }

      refreshStats();
    });

    socket.on('errorResuming', () => {
      console.warn('No se pudo reanudar. Limpiando partida guardada');
      localStorage.removeItem('sopa_game_id');
    });

    socket.on('gameResumed', (data) => {
      setBoardMatrix(data.matrix);
      setWordsToFind(data.wordsPlaced);
      setSessionId(data.gameSessionId);
      setFoundWords(data.foundWords || []);

      const recoveredSet = new Set();
      if (data.foundCells && Array.isArray(data.foundCells)) {
        data.foundCells.forEach((cell) => {
          recoveredSet.add(`${cell.row}-${cell.col}`);
        });
      }
      setFoundCells(recoveredSet);

      if (data.startTime) {
        const start = new Date(data.startTime).getTime();
        const now = new Date().getTime();
        const elapsedSeconds = Math.floor((now - start) / 1000);
        setTimerStart(elapsedSeconds);
      } else {
        setTimerStart(0);
      }

      setIsGameActive(true);
      setGameMessage('');
    });

    socket.on('userStats', (data) => {
      setTopScores(data.topScores || []);
      setRecentGames(data.recentGames || []);
    });

    socket.on('boardGenerated', (data) => {
      setBoardMatrix(data.matrix || []);
      setWordsToFind(data.wordsPlaced || []);
      setSessionId(data.gameSessionId || null);
      setFoundWords([]);
      setFoundCells(new Set());
      setTimerStart(0);
      setIsGameActive(true);
      setGameMessage('');
      if (data.gameSessionId) {
        localStorage.setItem('sopa_game_id', data.gameSessionId);
      }
    });

    socket.on('gameFinished', (data) => {
      setIsGameActive(false);
      const m = Math.floor(data.duration / 60);
      const s = data.duration % 60;
      const timeStr = `${m}:${s.toString().padStart(2, '0')}`;
      localStorage.removeItem('sopa_game_id');
      setGameMessage(`¡Felicidades! Completado en ${timeStr}`);
      refreshStats();
    });

    socket.on('resolveResult', (data) => {
      setIsGameActive(false);
      const newFoundCells = new Set(foundCells);

      data.solutions.forEach((sol) => {
        sol.cells.forEach((cell) => {
          newFoundCells.add(`${cell.row}-${cell.col}`);
        });
      });

      setFoundCells(newFoundCells);
      setGameMessage('Partida finalizada (Solución revelada)');
      localStorage.removeItem('sopa_game_id');
      refreshStats();
    });

    socket.on('validationResult', (result) => {
      if (result.isValid) {
        setFoundWords((prev) => {
          if (!prev.includes(result.word)) {
            return [...prev, result.word];
          }
          return prev;
        });

        setFoundCells((prev) => {
          const newSet = new Set(prev);
          result.cells.forEach((cell) =>
            newSet.add(`${cell.row}-${cell.col}`)
          );
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
      socket.off('userStats');
      socket.off('gameResumed');
      socket.off('errorResuming');
    };
  }, [foundCells]);

  const handleResolve = () => {
    MySwal.fire({
      title: '¿Te rindes?',
      text: 'Se mostrarán todas las soluciones y la partida terminará.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, resolver',
      cancelButtonText: 'Seguir jugando',
      background: '#f9f9f9',
      customClass: {
        popup: 'my-swal-popup',
      },
    }).then((result) => {
      if (result.isConfirmed) {
        socket.emit('requestResolve', { gameSessionId: sessionId });

        MySwal.fire('¡Resuelto!', 'Aquí tienes la solución.', 'info');
      }
    });
  };

  const handleNewGame = () => {
    Swal.fire({
      title: '¿Nueva Partida?',
      text: isGameActive
        ? 'La partida actual se marcará como abandonada.'
        : 'Se generará un nuevo tablero.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, nueva partida',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        // Crear o recuperar userId SOLO aquí
        let currentUserId = localStorage.getItem('sopa_user_id');
        if (!currentUserId) {
          currentUserId = getPersistentUserId();
        }
        setHasSession(true);

        if (sessionId && isGameActive) {
          socket.emit('abandonGame', { gameSessionId: sessionId });
        }

        localStorage.removeItem('sopa_game_id');
        setFoundWords([]);
        setFoundCells(new Set());
        setGameMessage('');
        setSessionId(null);

        setTimeout(() => {
          socket.emit('requestUserStats', { userId: currentUserId });
        }, 300);

// Decisión de dificultad
let difficulty;

if (!hasChosenInitialDifficulty()) {
  // Primera vez: usar lo que eligió el usuario
  difficulty = selectedDifficulty;
  markInitialDifficultyChosen();
} else {
  // Base: dificultad actual o previa
  difficulty = selectedDifficulty;

  try {
    const aiSuggestion = await predictDifficulty(recentGames);
    console.log(`IA sugiere nivel bruto: ${aiSuggestion}`);

    // Redondear y limitar entre 1 y 3
    let suggested = Math.round(aiSuggestion);
    if (suggested < 1) suggested = 1;
    if (suggested > 3) suggested = 3;

    // Permitir cambiar hasta 2 niveles si el rendimiento es muy bajo
    // Ej: de 3 (Difícil) a 1 (Fácil) tras muchas rendiciones
    difficulty = suggested;

    const nivelTexto =
      difficulty === 1 ? 'Fácil' :
      difficulty === 3 ? 'Difícil' : 'Medio';

    Swal.fire({
      title: `Nivel usado: ${nivelTexto}`,
      text: 'La dificultad se ha ajustado según tu desempeño reciente.',
      timer: 1500,
      showConfirmButton: false,
      icon: 'info',
    });
  } catch (e) {
    console.error('Error IA:', e);
    // Si falla la IA, quedate con selectedDifficulty
  }
}

        socket.emit('requestBoard', { userId: currentUserId, difficulty });
      }
    });
  };

  const handleLogoutSession = () => {
    Swal.fire({
      title: '¿Cerrar sesión de juego?',
      text: 'Se borrarán tus partidas activas y estadísticas locales.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        if (sessionId && isGameActive) {
          socket.emit('abandonGame', { gameSessionId: sessionId });
        }

        localStorage.removeItem('sopa_user_id');
        localStorage.removeItem('sopa_game_id');
        localStorage.removeItem('sopa_initial_difficulty_chosen');

        setBoardMatrix([]);
        setWordsToFind([]);
        setFoundWords([]);
        setFoundCells(new Set());
        setSessionId(null);
        setIsGameActive(false);
        setGameMessage('');
        setTimerStart(0);
        setTopScores([]);
        setRecentGames([]);
        setHasSession(false);

        Swal.fire({
          title: 'Sesión cerrada',
          text: 'Cuando vuelvas a jugar se creará un nuevo usuario y podrás elegir dificultad de nuevo.',
          icon: 'info',
          timer: 2000,
          showConfirmButton: false,
        });
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

        {!hasChosenInitialDifficulty() && (
          <div className="difficulty-selector">
            <span>Dificultad inicial: </span>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(Number(e.target.value))}
            >
              <option value={1}>Fácil</option>
              <option value={2}>Medio</option>
              <option value={3}>Difícil</option>
            </select>
          </div>
        )}

        <div className="button-group">
          <button className="new-game-btn" onClick={handleNewGame}>
            Nueva Partida
          </button>

          {isGameActive && (
            <button className="resolve-btn" onClick={handleResolve}>
              Rendirse
            </button>
          )}

          {hasSession && (
            <button className="logout-btn" onClick={handleLogoutSession}>
              Salir de la sesión
            </button>
          )}
        </div>

        {gameMessage && <div className="victory-message">{gameMessage}</div>}
      </div>

      <div className="game-container">
        <StatsPanel topScores={topScores} recentGames={recentGames} />

        <Board
          matrix={boardMatrix}
          foundCells={foundCells}
          sessionId={sessionId}
          isActive={isGameActive}
        />

        <ControlPanel wordsToFind={wordsToFind} foundWords={foundWords} />
      </div>
    </div>
  );
}

export default App;
