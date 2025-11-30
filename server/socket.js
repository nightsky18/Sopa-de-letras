// server/socket.js
const { generateBoard } = require('./utils/boardGenerator');

function socketSetup(io) {
  io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    // Cuando el cliente pide un tablero
    socket.on('requestBoard', async () => {
      try {
        const { matrix, wordsPlaced } = await generateBoard(15, 15, 10);
        socket.emit('boardGenerated', { matrix, wordsPlaced });
      } catch (err) {
        console.error('Error generando tablero:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
    });
  });
}

module.exports = socketSetup;
