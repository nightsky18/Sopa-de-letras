// server/workers/wordValidator.js
const { parentPort, workerData } = require('worker_threads');

/**
 * workerData espera recibir:
 * {
 *   word: string,           // Palabra formada por el usuario (ej: "SOL")
 *   selectedCells: Array,   // [{row, col}, ...] Coordenadas seleccionadas
 *   validWords: Array,      // Lista de palabras correctas en este tablero
 *   matrix: Array           // (Opcional) Matriz del tablero para validación estricta de letras
 * }
 */

function validateSelection() {
  const { word, validWords, selectedCells, matrix } = workerData;
  
  const cleanWord = word.toUpperCase();

  // 1. ¿La palabra existe en la lista de palabras ocultas del tablero?
  if (!validWords.includes(cleanWord)) {
    return { 
      isValid: false, 
      reason: 'La palabra no está en la lista de búsqueda.' 
    };
  }

  // 2. Validación de integridad de coordenadas (si se envía la matriz)
  if (matrix && selectedCells && selectedCells.length > 0) {
    for (let i = 0; i < selectedCells.length; i++) {
      const { row, col } = selectedCells[i];
      
      // Verificar límites del tablero
      if (row < 0 || row >= matrix.length || col < 0 || col >= matrix[0].length) {
        return { isValid: false, reason: 'Coordenadas fuera de rango.' };
      }
      
      // Verificar coincidencia de letra
      // Nota: Asumimos que selectedCells viene en orden.
      // Si la celda (0,0) tiene 'S' y la palabra es 'SOL', la primera letra debe ser 'S'.
      if (matrix[row][col] !== cleanWord[i]) {
        return { 
          isValid: false, 
          reason: `La celda [${row},${col}] no coincide con la letra ${cleanWord[i]}` 
        };
      }
    }
  }

  // Si pasa las verificaciones
  return { 
    isValid: true, 
    word: cleanWord,
    cells: selectedCells // Devolvemos las celdas para que el front las pinte de verde
  };
}

try {
  // Ejecutar lógica
  const result = validateSelection();
  // Enviar resultado al hilo principal
  parentPort.postMessage(result);
} catch (error) {
  parentPort.postMessage({ isValid: false, error: error.message });
}
