// server/socket.js
const { generateBoard } = require('./utils/boardGenerator');
const { runWordValidation } = require('./utils/workerHandler'); // <--- IMPORTAR

// Simulación de almacenamiento en memoria temporal (idealmente sería Redis o Mongo)
// key: socket.id, value: { matrix, wordsPlaced, ... }
const activeGames = {}; 

function socketSetup(io) {
  io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    // 1. Generar Tablero
    socket.on('requestBoard', async () => {
      try {
        // Generar tablero 15x15 con 10 palabras
        const { matrix, wordsPlaced } = await generateBoard(15, 15, 15);
        
        // Guardar estado de la partida en memoria asociado al socket
        activeGames[socket.id] = {
          matrix,
          wordsPlaced,
          foundWords: []
        };

        // Enviar al cliente solo lo necesario (ocultar wordsPlaced si se quiere dificultad real, pero por ahora se envía)
        // Enviamos wordsPlaced para que el cliente sepa qué buscar.
        socket.emit('boardGenerated', { matrix, wordsPlaced });
      } catch (err) {
        console.error('Error generando tablero:', err);
      }
    });

    // 2. Validar Palabra (Nueva lógica con Worker)
    socket.on('validateWord', async (data) => {
      // data espera: { word: "SOL", selectedCells: [...] }
      const game = activeGames[socket.id];

      if (!game) {
        socket.emit('validationResult', { isValid: false, reason: 'Partida no encontrada' });
        return;
      }

      try {
        // Lanzar el Worker Thread
        const result = await runWordValidation(
          data.word, 
          data.selectedCells, 
          game.wordsPlaced, 
          game.matrix
        );

        if (result.isValid) {
          // Si es válida, añadir a encontradas
          if (!game.foundWords.includes(result.word)) {
            game.foundWords.push(result.word);
          }
        }

        // Responder al cliente
        socket.emit('validationResult', result);

      } catch (err) {
        console.error('Error en validación:', err);
        socket.emit('validationResult', { isValid: false, error: 'Error interno del servidor' });
      }
    });

    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
      delete activeGames[socket.id]; // Limpiar memoria
    });
  });
}

module.exports = socketSetup;
