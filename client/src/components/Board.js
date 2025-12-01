import React, { useState, useCallback } from 'react';
import socket from '../services/socket';
import '../App.css';

// foundCells viene del padre (App.js)
function Board({ matrix, foundCells }) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectedCells, setSelectedCells] = useState([]);

  // Lógica geométrica para obtener celdas entre dos puntos
  const getCellsBetween = useCallback((start, end) => {
    const cells = [];
    const diffRow = end.row - start.row;
    const diffCol = end.col - start.col;
    const steps = Math.max(Math.abs(diffRow), Math.abs(diffCol));
    const isHorizontal = diffRow === 0;
    const isVertical = diffCol === 0;
    const isDiagonal = Math.abs(diffRow) === Math.abs(diffCol);

    if (!isHorizontal && !isVertical && !isDiagonal) return [start];

    const rowStep = diffRow === 0 ? 0 : diffRow / steps;
    const colStep = diffCol === 0 ? 0 : diffCol / steps;

    for (let i = 0; i <= steps; i++) {
      cells.push({
        row: start.row + (i * rowStep),
        col: start.col + (i * colStep)
      });
    }
    return cells;
  }, []);

  const handleMouseDown = (row, col) => {
    setIsSelecting(true);
    setSelectionStart({ row, col });
    setSelectedCells([{ row, col }]);
  };

  const handleMouseEnter = (row, col) => {
    if (!isSelecting || !selectionStart) return;
    const path = getCellsBetween(selectionStart, { row, col });
    setSelectedCells(path);
  };

  const handleMouseUp = () => {
    if (!isSelecting) return;
    setIsSelecting(false);
    setSelectionStart(null);

    if (selectedCells.length > 1) {
      const wordString = selectedCells.map(cell => matrix[cell.row][cell.col]).join('');
      socket.emit('validateWord', {
        word: wordString,
        selectedCells: selectedCells
      });
      // Limpiamos selección visual inmediatamente, si es correcta App.js nos mandará el foundCells actualizado
      setSelectedCells([]);
    } else {
      setSelectedCells([]);
    }
  };

  if (!matrix || matrix.length === 0) return <div>Cargando tablero...</div>;

  return (
    <div className="board-container" onMouseUp={handleMouseUp}>
      <table className="board-table" onMouseLeave={() => isSelecting && handleMouseUp()}>
        <tbody>
          {matrix.map((row, rIndex) => (
            <tr key={rIndex}>
              {row.map((letter, cIndex) => {
                const cellId = `${rIndex}-${cIndex}`;
                // Usamos la prop foundCells
                const isFound = foundCells && foundCells.has(cellId);
                const isSelected = selectedCells.some(c => c.row === rIndex && c.col === cIndex);
                
                let cellClass = 'board-cell';
                if (isFound) cellClass += ' cell-found';
                else if (isSelected) cellClass += ' cell-selected';

                return (
                  <td 
                    key={cIndex} 
                    className={cellClass}
                    onMouseDown={() => handleMouseDown(rIndex, cIndex)}
                    onMouseEnter={() => handleMouseEnter(rIndex, cIndex)}
                  >
                    {letter}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Board;