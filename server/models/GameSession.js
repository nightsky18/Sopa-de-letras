// server/models/GameSession.js
const mongoose = require('mongoose');

const GameSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
  foundWords: { type: [String], default: [] },
  timeSpent: { type: Number, default: 0 },
  status: { type: String, default: 'playing' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('GameSession', GameSessionSchema);
