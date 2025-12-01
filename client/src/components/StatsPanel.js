import React from 'react';
import '../App.css';

function StatsPanel({ topScores, recentGames }) {
    const formatDate = (dateStr) => {
    if (!dateStr) return '-'; // Manejo de nulos
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Fecha inválida'; // Manejo de formato erróneo
    
        return date.toLocaleDateString(undefined, { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute:'2-digit' 
        });
    };

  return (
    <div className="stats-panel">
      <h3>🏅 Mejores Puntuaciones</h3>
      {topScores.length === 0 ? <p className="no-data">Sin victorias aún</p> : (
        <ul className="stats-list">
          {topScores.map((game, i) => (
            <li key={i} className="stat-item top-score">
              <span className="stat-score">{Math.round(game.score)} pts</span>
              <span className="stat-date">{formatDate(game.startTime)}</span>
            </li>
          ))}
        </ul>
      )}

      <h3>🕒 Historial Reciente</h3>
      {recentGames.length === 0 ? <p className="no-data">Sin partidas</p> : (
        <ul className="stats-list">
          {recentGames.map((game, i) => (
            <li key={i} className={`stat-item status-${game.status}`}>
              <span className="stat-info">
                {game.status === 'finished' ? '🏆' : '🏳️'} {Math.round(game.score)} pts
              </span>
              <span className="stat-date">{formatDate(game.startTime)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default StatsPanel;