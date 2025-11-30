// server/utils/boardGenerator.js
const Word = require('../models/Word');

function generateEmptyMatrix(rows, columns) {
  return Array.from({ length: rows }, () => Array(columns).fill(''));
}

function placeWordHorizontally(matrix, word, row, colStart) {
  for (let i = 0; i < word.length; i++) {
    matrix[row][colStart + i] = word[i];
  }
}

function placeWordVertically(matrix, word, rowStart, col) {
  for (let i = 0; i < word.length; i++) {
    matrix[rowStart + i][col] = word[i];
  }
}

function canPlaceWordHorizontally(matrix, word, row, colStart) {
  if (colStart + word.length > matrix[0].length) return false;
  for (let i = 0; i < word.length; i++) {
    if (matrix[row][colStart + i] !== '' && matrix[row][colStart + i] !== word[i]) {
      return false;
    }
  }
  return true;
}

function canPlaceWordVertically(matrix, word, rowStart, col) {
  if (rowStart + word.length > matrix.length) return false;
  for (let i = 0; i < word.length; i++) {
    if (matrix[rowStart + i][col] !== '' && matrix[rowStart + i][col] !== word[i]) {
      return false;
    }
  }
  return true;
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

async function generateBoard(rows = 15, columns = 15, minWords = 10) {
  // Traer al menos minWords palabras aleatorias de la base de datos
  const wordsDocs = await Word.aggregate([{ $sample: { size: minWords } }]);
  const words = wordsDocs.map(w => w.text.toUpperCase());

  let matrix = generateEmptyMatrix(rows, columns);
  let wordsPlaced = [];

  for (const word of words) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 100) {
      const horizontal = Math.random() < 0.5;
      if (horizontal) {
        const row = Math.floor(Math.random() * rows);
        const colStart = Math.floor(Math.random() * (columns - word.length + 1));

        if (canPlaceWordHorizontally(matrix, word, row, colStart)) {
          placeWordHorizontally(matrix, word, row, colStart);
          placed = true;
          wordsPlaced.push(word);
        }
      } else {
        const rowStart = Math.floor(Math.random() * (rows - word.length + 1));
        const col = Math.floor(Math.random() * columns);

        if (canPlaceWordVertically(matrix, word, rowStart, col)) {
          placeWordVertically(matrix, word, rowStart, col);
          placed = true;
          wordsPlaced.push(word);
        }
      }
      attempts++;
    }
  }

  matrix = fillEmptySpaces(matrix);

  return { matrix, wordsPlaced };
}

module.exports = { generateBoard };
