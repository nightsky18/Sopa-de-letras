import React, { useState, useEffect } from 'react';
import '../App.css';

function Timer({ isActive, initialSeconds = 0 }) {
  const [seconds, setSeconds] = useState(initialSeconds);

  // Si cambia initialSeconds (ej: al reanudar), actualizamos el estado interno
  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    let interval = null;

    if (isActive) {
      interval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else if (!isActive) {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isActive]);

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