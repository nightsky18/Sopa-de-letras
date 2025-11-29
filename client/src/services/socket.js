// client/src/services/socket.js
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000'); // URL del servidor backend

export default socket;
