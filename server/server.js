// server/server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const socketSetup = require('./socket'); // <-- IMPORTANTE

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 4000;

// conectar BD
connectDB();

// middlewares
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor Express con Socket.io funcionando');
});

// configurar sockets
socketSetup(io); // <-- AQUÍ SE USA

// iniciar servidor
server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
