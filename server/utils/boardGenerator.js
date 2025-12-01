// server/utils/boardGenerator.js
const Word = require('../models/Word');

function generateEmptyMatrix(rows, columns) {
  return Array.from({ length: rows }, () => Array(columns).fill(''));
}

// Definición de Direcciones
const DIRECTIONS = {
  HORIZONTAL: [0, 1],
  VERTICAL: [1, 0],
  DIAGONAL_DOWN: [1, 1],
  DIAGONAL_UP: [-1, 1]
};

// Configuración de Niveles
const LEVELS = {
  1: { rows: 10, cols: 10, wordCount: 5, allowDiagonal: false },
  2: { rows: 15, cols: 15, wordCount: 15, allowDiagonal: true },
  3: { rows: 20, cols: 20, wordCount: 25, allowDiagonal: true } 
};

function canPlaceWord(matrix, word, row, col, dr, dc) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  
  for (let i = 0; i < word.length; i++) {
    const r = row + (i * dr);
    const c = col + (i * dc);

    if (r < 0 || r >= rows || c < 0 || c >= cols) return false;

    const currentCell = matrix[r][c];
    if (currentCell !== '' && currentCell !== word[i]) return false;
  }
  return true;
}

function placeWord(matrix, word, row, col, dr, dc) {
  for (let i = 0; i < word.length; i++) {
    const r = row + (i * dr);
    const c = col + (i * dc);
    matrix[r][c] = word[i];
  }
}

function fillEmptySpaces(matrix) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[0].length; c++) {
      if (matrix[r][c] === '') {
        matrix[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
      }
    }
  }
  return matrix;
}

/**
 * Genera un tablero basado en el nivel de dificultad.
 * @param {number} difficulty - Nivel 1 (Fácil), 2 (Medio), 3 (Difícil)
 */
async function generateBoard(difficulty = 2) {
  // 1. Obtener configuración según nivel (default 2)
  const config = LEVELS[difficulty] || LEVELS[2];
  const { rows, cols, wordCount, allowDiagonal } = config;

  // 2. Seleccionar palabras de BD
  const wordsDocs = await Word.aggregate([{ $sample: { size: wordCount } }]);
  
  // Ordenar por longitud (las largas primero son más difíciles de ubicar)
  const words = wordsDocs
    .map(w => w.text.toUpperCase())
    .sort((a, b) => b.length - a.length);

  let matrix = generateEmptyMatrix(rows, cols);
  let wordsPlaced = [];

  // 3. Determinar direcciones permitidas
  let availableDirs = [DIRECTIONS.HORIZONTAL, DIRECTIONS.VERTICAL];
  if (allowDiagonal) {
    availableDirs.push(DIRECTIONS.DIAGONAL_DOWN, DIRECTIONS.DIAGONAL_UP);
  }

  for (const word of words) {
    let placed = false;
    let attempts = 0;
    const maxAttempts = 150; 

    while (!placed && attempts < maxAttempts) {
      // Elegir dirección aleatoria de las permitidas
      const [dr, dc] = availableDirs[Math.floor(Math.random() * availableDirs.length)];

      const startRow = Math.floor(Math.random() * rows);
      const startCol = Math.floor(Math.random() * cols);

      if (canPlaceWord(matrix, word, startRow, startCol, dr, dc)) {
        placeWord(matrix, word, startRow, startCol, dr, dc);
        placed = true;
        wordsPlaced.push(word);
      }
      attempts++;
    }
  }

  matrix = fillEmptySpaces(matrix);

  return { matrix, wordsPlaced };
}

module.exports = { generateBoard };