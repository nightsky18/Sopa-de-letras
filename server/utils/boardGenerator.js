// server/utils/boardGenerator.js
const Word = require('../models/Word');

function generateEmptyMatrix(rows, columns) {
  return Array.from({ length: rows }, () => Array(columns).fill(''));
}

// Direcciones posibles: [deltaRow, deltaCol]
const DIRECTIONS = {
  HORIZONTAL: [0, 1],
  VERTICAL: [1, 0],
  DIAGONAL_DOWN: [1, 1],  // \
  DIAGONAL_UP: [-1, 1]    // /
};

function canPlaceWord(matrix, word, row, col, dr, dc) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  
  for (let i = 0; i < word.length; i++) {
    const r = row + (i * dr);
    const c = col + (i * dc);

    // 1. Verificar límites
    if (r < 0 || r >= rows || c < 0 || c >= cols) return false;

    // 2. Verificar colisión (celda vacía o misma letra)
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

async function generateBoard(rows = 15, columns = 15, minWords = 15) {
  const wordsDocs = await Word.aggregate([{ $sample: { size: minWords } }]);
  // Ordenar palabras de mayor a menor longitud ayuda a encajar las difíciles primero
  const words = wordsDocs
    .map(w => w.text.toUpperCase())
    .sort((a, b) => b.length - a.length); 

  let matrix = generateEmptyMatrix(rows, columns);
  let wordsPlaced = [];

  for (const word of words) {
    let placed = false;
    let attempts = 0;
    const maxAttempts = 150; // Un poco más de intentos al ser más complejo

    while (!placed && attempts < maxAttempts) {
      // Elegir dirección aleatoria
      const dirKeys = Object.keys(DIRECTIONS);
      const randomDirKey = dirKeys[Math.floor(Math.random() * dirKeys.length)];
      const [dr, dc] = DIRECTIONS[randomDirKey];

      // Elegir punto de inicio aleatorio
      // (Optimizamos rango para no fallar tanto por límites, aunque canPlaceWord lo valida igual)
      const startRow = Math.floor(Math.random() * rows);
      const startCol = Math.floor(Math.random() * columns);

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