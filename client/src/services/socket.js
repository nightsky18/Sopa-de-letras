// client/src/services/socket.js
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  transports: ['websocket'], // opcional, ayuda a evitar polling
});

export default socket;
