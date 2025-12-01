// server/models/GameSession.js
const mongoose = require('mongoose');

const GameSessionSchema = new mongoose.Schema({
  board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
  foundWords: { type: [String], default: [] }, // Palabras que el jugador ya encontró
  score: { type: Number, default: 0 },         // Opcional: Puntos
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  duration: { type: Number, default: 0 }, // Duración en segundos
  status: { 
    type: String, 
    enum: ['playing', 'finished', 'abandoned'], 
    default: 'playing' 
  }
});

module.exports = mongoose.model('GameSession', GameSessionSchema);
