// server/utils/matrixSearch.js

const DIRECTIONS = [
  [0, 1],   // Horizontal
  [1, 0],   // Vertical
  [1, 1],   // Diagonal Abajo
  [-1, 1]   // Diagonal Arriba
];

function findWordInMatrix(matrix, word) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const cleanWord = word.toUpperCase();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Si la primera letra coincide, exploramos las 4 direcciones
      if (matrix[r][c] === cleanWord[0]) {
        
        for (const [dr, dc] of DIRECTIONS) {
          let cells = [];
          let match = true;

          for (let i = 0; i < cleanWord.length; i++) {
            const nr = r + (i * dr);
            const nc = c + (i * dc);

            // Verificar límites y coincidencia
            if (
              nr < 0 || nr >= rows || 
              nc < 0 || nc >= cols || 
              matrix[nr][nc] !== cleanWord[i]
            ) {
              match = false;
              break;
            }
            cells.push({ row: nr, col: nc });
          }

          if (match) {
            return cells; // ¡Encontrada! Devolvemos array de celdas
          }
        }
      }
    }
  }
  return []; // No encontrada (raro, pero posible por seguridad)
}

module.exports = { findWordInMatrix };