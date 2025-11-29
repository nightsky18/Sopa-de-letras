// server/socket.js
const { Worker } = require('worker_threads');

function socketSetup(io) {
  io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    // Ejemplo: recibir palabra seleccionada del cliente
    socket.on('wordSelected', (wordData) => {
      // Crear un worker para validar la palabra de forma concurrente
      const worker = new Worker('./workers/wordValidator.js', {
        workerData: wordData,
      });

      worker.on('message', (result) => {
        // Enviar respuesta al cliente con el resultado de la validación
        socket.emit('validationResult', result);
      });

      worker.on('error', (error) => {
        console.error('Error Worker:', error);
      });
    });

    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
    });
  });
}

module.exports = socketSetup;
