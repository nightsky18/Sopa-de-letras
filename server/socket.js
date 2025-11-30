js
const { generateBoard } = require('./utils/boardGenerator');
const Board = require('./models/Board');

function socketSetup(io) {
  io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    socket.on('requestBoard', async () => {
      const { matrix, wordsPlaced } = await generateBoard(15, 15, 10);
      socket.emit('boardGenerated', { matrix, wordsPlaced });
    });

    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
    });
  });
}

module.exports = socketSetup;
