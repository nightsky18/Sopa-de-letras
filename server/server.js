// server/server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
const gameSessionRoutes = require('./routes/gameSessionRoutes');
const { Worker } = require('worker_threads');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 4000;

connectDB(); // Conectar a MongoDB

// Middleware para parsear JSON
app.use(express.json());

// Rutas API
app.use('/api', gameSessionRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor Express con Socket.io funcionando');
});

// Función para validar palabra con Worker Thread
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

// Configurar eventos de Socket.io
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Iniciar servidor HTTP con Socket.io
server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});



