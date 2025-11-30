const mongoose = require('mongoose');

const GameSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  board: { type: [[String]], required: true },  // matriz dinámica de letras
  foundWords: { type: [String], default: [] },
  timeSpent: { type: Number, default: 0 },     // segundos transcurridos
  status: { type: String, default: 'playing' }, // playing, finished, paused
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('GameSession', GameSessionSchema);
