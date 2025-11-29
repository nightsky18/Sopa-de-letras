// server/server.js
const express = require('express');
const connectDB = require('./config/db');
const { Worker } = require('worker_threads');
const app = express();

connectDB(); // Conectar a MongoDB

server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

function validarPalabraConcurrente(word, callback) {
  const worker = new Worker('./workers/wordValidator.js', {
    workerData: { word }
  });

  worker.on('message', (result) => {
    callback(null, result);
  });

  worker.on('error', (err) => {
    callback(err);
  });
}
// Middleware para parsear JSON
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor Express con Socket.io funcionando');
});

// Configurar eventos de Socket.io
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Iniciar servidor HTTP con Socket.io
