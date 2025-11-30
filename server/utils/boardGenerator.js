
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

// Función principal de generación de tablero
function generateBoard(words, rows = 10, columns = 10) {
  let matrix = generateEmptyMatrix(rows, columns);
  let wordsPlaced = [];

  for (const word of words) {
    const upperWord = word.toUpperCase();

    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 100) {
      const horizontal = Math.random() < 0.5;
      if (horizontal) {
        const row = Math.floor(Math.random() * rows);
        const colStart = Math.floor(Math.random() * (columns - upperWord.length + 1));

        if (canPlaceWordHorizontally(matrix, upperWord, row, colStart)) {
          placeWordHorizontally(matrix, upperWord, row, colStart);
          placed = true;
          wordsPlaced.push(upperWord);
        }
      } else {
        const rowStart = Math.floor(Math.random() * (rows - upperWord.length + 1));
        const col = Math.floor(Math.random() * columns);

        if (canPlaceWordVertically(matrix, upperWord, rowStart, col)) {
          placeWordVertically(matrix, upperWord, rowStart, col);
          placed = true;
          wordsPlaced.push(upperWord);
        }
      }
      attempts++;
    }
  }

  matrix = fillEmptySpaces(matrix);

  return { matrix, wordsPlaced };
}

module.exports = { generateBoard };
