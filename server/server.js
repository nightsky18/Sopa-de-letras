// server/server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 4000;

connectDB();

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
socketSetup(io);   // importante

// rutas, etc...

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
});

server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
