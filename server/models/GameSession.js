const mongoose = require('mongoose');

const GameSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true }, // referencia al tablero
  foundWords: { type: [String], default: [] }, // palabras encontradas
  timeSpent: { type: Number, default: 0 }, // segundos jugados
  status: { type: String, default: 'playing' }, // playing, finished, etc.
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('GameSession', GameSessionSchema);
