import React, { useState, useEffect } from 'react';
import '../App.css'; // Para estilos

function Timer({ isActive }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval = null;

    if (isActive) {
      interval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isActive, seconds]);

  // Formatear a MM:SS
  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="timer-container">
      <span className="timer-icon">⏱️</span>
      <span className="timer-value">{formatTime(seconds)}</span>
    </div>
  );
}

export default Timer;