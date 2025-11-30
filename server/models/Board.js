// server/models/Board.js
const mongoose = require('mongoose');

const BoardSchema = new mongoose.Schema({
  rows: { type: Number, required: true },
  columns: { type: Number, required: true },
  matrix: { type: [[String]], required: true }, // matriz de letras
  wordsPlaced: { type: [String], default: [] }, // palabras que están en el tablero
});

module.exports = mongoose.model('Board', BoardSchema);
