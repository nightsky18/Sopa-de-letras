// server/workers/wordValidator.js
const { parentPort, workerData } = require('worker_threads');

// Simulación de tarea pesada: validar palabra recibida
function validateWord(word) {
  // Aquí va la lógica real de validación
  const validWords = ['sol', 'mar', 'casa', 'juego'];
  return validWords.includes(word.toLowerCase());
}

// Ejecutar la validación
const result = {
  word: workerData.word,
  isValid: validateWord(workerData.word),
};

// Enviar resultado al hilo padre
parentPort.postMessage(result);
