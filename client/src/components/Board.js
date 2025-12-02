import React, { useState, useCallback } from 'react';
import socket from '../services/socket';
import '../App.css';

// Paleta de 25 colores
const COLORS = [
  '#e74c3c', '#3498db', '#27ae60', '#9b59b6', '#f1c40f',
  '#e67e22', '#1abc9c', '#2ecc71', '#34495e', '#ff6b81',
  '#8e44ad', '#16a085', '#2980b9', '#d35400', '#c0392b',
  '#2c3e50', '#7f8c8d', '#fd79a8', '#00cec9', '#6c5ce7',
  '#e84393', '#fab1a0', '#55efc4', '#6711a1ff', '#fdcb6e'
];

const getColorForId = (id) => {
  if (!id) return undefined;
  return COLORS[(id - 1) % COLORS.length];
};

// foundCells y cellColors vienen del padre (App.js)
function Board({ matrix, foundCells, cellColors, sessionId }) {
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
        row: start.row + i * rowStep,
        col: start.col + i * colStep,
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
      const wordString = selectedCells
        .map((cell) => matrix[cell.row][cell.col])
        .join('');
      socket.emit('validateWord', {
        word: wordString,
        selectedCells: selectedCells,
        gameSessionId: sessionId,
      });
    }
    setSelectedCells([]);
  };

  if (!matrix || matrix.length === 0) return <div>Cargando tablero...</div>;

  return (
    <div className="board-container" onMouseUp={handleMouseUp}>
      <table
        className="board-table"
        onMouseLeave={() => isSelecting && handleMouseUp()}
      >
        <tbody>
          {matrix.map((row, rIndex) => (
            <tr key={rIndex}>
              {row.map((letter, cIndex) => {
                const cellId = `${rIndex}-${cIndex}`;
                const isFound = foundCells && foundCells.has(cellId);
                const isSelected = selectedCells.some(
                  (c) => c.row === rIndex && c.col === cIndex
                );

                let cellClass = 'board-cell';
                if (isSelected) cellClass += ' cell-selected';
                else if (isFound) cellClass += ' cell-found';

                const colorId =
                  cellColors && Object.prototype.hasOwnProperty.call(cellColors, cellId)
                    ? cellColors[cellId]
                    : null;
                const style =
                  isFound && colorId
                    ? {
                        backgroundColor: getColorForId(colorId),
                        color: '#ffffff',
                      }
                    : {};

                return (
                  <td
                    key={cIndex}
                    className={cellClass}
                    style={style}
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
