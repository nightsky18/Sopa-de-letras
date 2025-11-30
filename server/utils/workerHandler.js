// server/utils/workerHandler.js
const { Worker } = require('worker_threads');
const path = require('path');

/**
 * Lanza un Worker Thread para validar una palabra.
 * @param {string} word - La palabra seleccionada por el usuario.
 * @param {Array} selectedCells - Array de coordenadas [{row, col}].
 * @param {Array} validWords - Lista de palabras que sí están en el tablero.
 * @param {Array} matrix - La matriz del tablero actual.
 * @returns {Promise} - Resuelve con { isValid, word, cells, reason? }
 */
function runWordValidation(word, selectedCells, validWords, matrix) {
  return new Promise((resolve, reject) => {
    // Ruta absoluta al archivo del worker
    const workerPath = path.resolve(__dirname, '../workers/wordValidator.js');

    const worker = new Worker(workerPath, {
      workerData: {
        word,
        selectedCells,
        validWords,
        matrix
      }
    });

    // Escuchar mensaje de éxito del worker
    worker.on('message', (result) => {
      resolve(result);
      // Terminar el hilo explícitamente
      // worker.terminate(); No es estrictamente necesario si el script del worker acaba, pero buena práctica si queda vivo.
    });

    // Manejo de errores
    worker.on('error', (err) => {
      reject(err);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker finalizó con código de salida ${code}`));
      }
    });
  });
}

module.exports = { runWordValidation };