// server/models/GameSession.js
const mongoose = require('mongoose');

const GameSessionSchema = new mongoose.Schema({
  user: { type: String, required: true, index: true }, // Indexado para búsquedas rápidas de historial
  board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
  foundWords: { type: [String], default: [] },
  
  score: { type: Number, default: 0 }, // Puntos calculados
  
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  duration: { type: Number, default: 0 }, // Segundos
  
  status: { 
    type: String, 
    enum: ['playing', 'finished', 'abandoned', 'resolved'], 
    default: 'playing' 
  },
  
  difficultyLevel: { type: Number, default: 2 } //Guardar nivel jugado
});

module.exports = mongoose.model('GameSession', GameSessionSchema);