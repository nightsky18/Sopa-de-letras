import React from 'react';
import '../App.css'; // Reutilizamos o agregamos estilos aquí

function ControlPanel({ wordsToFind, foundWords }) {
  return (
    <div className="control-panel">
      <h3>Palabras a buscar ({foundWords.length}/{wordsToFind.length})</h3>
      <div className="word-list">
        {wordsToFind.map((word, index) => {
          const isFound = foundWords.includes(word);
          return (
            <div key={index} className={`word-item ${isFound ? 'word-found' : ''}`}>
              {word}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ControlPanel;