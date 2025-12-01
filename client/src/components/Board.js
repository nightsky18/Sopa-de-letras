import React, { useState, useEffect, useCallback } from 'react';
import socket from '../services/socket';
import '../App.css'; // Asegúrate de importar los estilos

function Board({ matrix }) {
  // ESTADOS
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null); // {row, col}
  const [selectedCells, setSelectedCells] = useState([]);     // Array de celdas temporales
  const [foundCells, setFoundCells] = useState(new Set());    // Set de strings "fila-col"

  // 1. ESCUCHAR RESPUESTA DEL SERVIDOR
  useEffect(() => {
    // Escuchar resultado de validación
    socket.on('validationResult', (result) => {
      if (result.isValid) {
        // Si es válida, agregamos las celdas al conjunto de encontradas de forma permanente
        setFoundCells(prev => {
          const newSet = new Set(prev);
          result.cells.forEach(cell => newSet.add(`${cell.row}-${cell.col}`));
          return newSet;
        });
        console.log(`¡Palabra encontrada: ${result.word}!`);
      } else {
        console.log('Intento fallido:', result.reason);
      }
      // Limpiamos la selección temporal
      setSelectedCells([]);
    });

    return () => {
      socket.off('validationResult');
    };
  }, []);

  // 2. LÓGICA GEOMÉTRICA (Calcular línea entre dos puntos)
  const getCellsBetween = useCallback((start, end) => {
    const cells = [];
    const diffRow = end.row - start.row;
    const diffCol = end.col - start.col;
    
    const steps = Math.max(Math.abs(diffRow), Math.abs(diffCol));
    
    // Verificar si es una línea válida (Horizontal, Vertical o Diagonal perfecta)
    const isHorizontal = diffRow === 0;
    const isVertical = diffCol === 0;
    const isDiagonal = Math.abs(diffRow) === Math.abs(diffCol);

    if (!isHorizontal && !isVertical && !isDiagonal) {
      return [start]; // Si rompe la geometría, solo seleccionamos la inicial (o podrías retornar vacío)
    }

    // Calcular incremento por paso (-1, 0, o 1)
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

  // 3. MANEJADORES DEL MOUSE
  const handleMouseDown = (row, col) => {
    setIsSelecting(true);
    setSelectionStart({ row, col });
    setSelectedCells([{ row, col }]);
  };

  const handleMouseEnter = (row, col) => {
    if (!isSelecting || !selectionStart) return;
    
    // Calcular trayectoria visual
    const path = getCellsBetween(selectionStart, { row, col });
    setSelectedCells(path);
  };

  const handleMouseUp = () => {
    if (!isSelecting) return;
    setIsSelecting(false);
    setSelectionStart(null);

    // Si hay selección, enviar al servidor para validar
    if (selectedCells.length > 1) {
      // Construir la palabra string basada en las celdas seleccionadas
      const wordString = selectedCells.map(cell => matrix[cell.row][cell.col]).join('');
      
      // Emitir evento al Backend (tal como lo probamos en Rama 2)
      socket.emit('validateWord', {
        word: wordString,
        selectedCells: selectedCells
      });
    } else {
        setSelectedCells([]); // Limpiar si fue solo un clic sin arrastre
    }
  };

  // 4. RENDERIZADO
  if (!matrix || matrix.length === 0) return <div>Cargando tablero...</div>;

  return (
    <div className="board-container" onMouseUp={handleMouseUp}>
      <table className="board-table" onMouseLeave={() => { if(isSelecting) handleMouseUp() }}>
        <tbody>
          {matrix.map((row, rIndex) => (
            <tr key={rIndex}>
              {row.map((letter, cIndex) => {
                // Determinar clase CSS
                const cellId = `${rIndex}-${cIndex}`;
                const isFound = foundCells.has(cellId);
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